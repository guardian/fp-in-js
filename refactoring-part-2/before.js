define([
    'common/utils/formInlineLabels',
    'bean',
    'bonzo',
    'qwery',
    'fastdom',
    'Promise',
    'common/utils/$',
    'common/utils/config',
    'common/utils/detect',
    'common/utils/fetch',
    'common/utils/mediator',
    'common/utils/template',
    'common/utils/robust',
    'common/modules/analytics/google',
    'lodash/collections/contains',
    'common/views/svgs',
    'text!common/views/email/submissionResponse.html',
    'text!common/views/ui/close-button.html',
    'common/modules/identity/api',
    'common/modules/user-prefs',
    'lodash/arrays/uniq'
], function (
    formInlineLabels,
    bean,
    bonzo,
    qwery,
    fastdom,
    Promise,
    $,
    config,
    detect,
    fetch,
    mediator,
    template,
    robust,
    googleAnalytics,
    contains,
    svgs,
    successHtml,
    closeHtml,
    Id,
    userPrefs,
    uniq
) {


    //global state

    var state = {
        submitting: false
    };

    //constants
    var messages = {
        defaultSuccessHeadline: 'Thank you for subscribing',
        defaultSuccessDesc: ''
    };

    //form validation and messaging
    var updateForm = {
        replaceContent: function (isSuccess, $form) {
            var formData = $form.data('formData')
            var submissionMessage = { // this should be a seperate function for building messages
                    statusClass: (isSuccess) ? 'email-sub__message--success' : 'email-sub__message--failure',
                    submissionHeadline: (isSuccess) ? formData.customSuccessHeadline || messages.defaultSuccessHeadline : 'Something went wrong', //messages should be passed in
                    submissionMessage: (isSuccess) ? formData.customSuccessDesc || messages.defaultSuccessDesc : 'Please try again.',
                    submissionIcon: (isSuccess) ? svgs('tick') : svgs('crossIcon') //svgs should be passed in
                }
            var submissionHtml = template(successHtml, submissionMessage); //template should be passed in

            //this should be in a seperate function
            //this is also a side effect
            fastdom.write(function () {
                $form.addClass('email-sub__form--is-hidden');
                $form.after(submissionHtml);
            });
        }
    };

    function handleSubmit(isSuccess, $form) {
        return function () {
            updateForm.replaceContent(isSuccess, $form);
            state.submitting = false; //writes to global state
        };
    }

    // more constants
    var classes = {
            wrapper: 'js-email-sub',
            form: 'js-email-sub__form',
            inlineLabel: 'js-email-sub__inline-label',
            textInput: 'js-email-sub__text-input',
            listIdHiddenInput: 'js-email-sub__listid-input'
        }
    var removeAndRemember = function (e, data) {
            //would be better to pass in iframe and analytics
            var iframe = data[0],
                analytics = data[1],
                currentListPrefs = userPrefs.get('email-sign-up-' + analytics.formType) || []; 
                //user prefs shold be passed in, this is also state so should be managed differently

            currentListPrefs.push(analytics.listId + '');
            userPrefs.set('email-sign-up-' + analytics.formType, uniq(currentListPrefs));

            //dom manipulation
            $(iframe).remove();

            //external call
            googleAnalytics.trackNonClickInteraction('rtrt | email form inline | ' + analytics.formType + ' | ' + analytics.listId + ' | ' + analytics.signedIn + ' | form hidden');

        }

    var ui = {
            updateForm: function (thisRootEl, el, analytics, opts) {
                // check if opts are valid, if not use data,
                var formData = $(thisRootEl).data(),
                    formTitle = (opts && opts.formTitle) || formData.formTitle || false,
                    formDescription = (opts && opts.formDescription) || formData.formDescription || false,
                    formCampaignCode = (opts && opts.formCampaignCode) || formData.formCampaignCode || '',
                    formSuccessHeadline = (opts && opts.formSuccessHeadline) || formData.formSuccessHeadline,
                    formSuccessDesc = (opts && opts.formSuccessDesc) || formData.formSuccessDesc,
                    removeComforter = (opts && opts.removeComforter) || formData.removeComforter || false,
                    formModClass = (opts && opts.formModClass) || formData.formModClass || false,
                    formCloseButton = (opts && opts.formCloseButton) || formData.formCloseButton || false,
                    formSuccessEventName = (opts && opts.formSuccessEventName) || formData.formSuccessEventName || false;

                // side effect
                Id.getUserFromApi(function (userFromId) {
                    ui.updateFormForLoggedIn(userFromId, el);
                });

                // Dom updated
                fastdom.write(function () {
                    if (formTitle) {
                        $('.js-email-sub__heading', el).text(formTitle);
                    }

                    if (formDescription) {
                        $('.js-email-sub__description', el).text(formDescription);
                    }

                    if (removeComforter) {
                        $('.js-email-sub__small', el).remove();
                    }

                    if (formModClass) {
                        $(el).addClass('email-sub--' + formModClass);
                    }

                    if (formCloseButton) {
                        var closeButtonTemplate = {
                            closeIcon: svgs('closeCentralIcon')
                        },
                        closeButtonHtml = template(closeHtml, closeButtonTemplate);

                        el.append(closeButtonHtml);

                        bean.on(el[0], 'click', '.js-email-sub--close', removeAndRemember, [thisRootEl, analytics]);
                    }
                });

                // Dom updated again
                // Cache data on the form element
                $('.js-email-sub__form', el).data('formData', {
                    customSuccessEventName: formSuccessEventName,
                    campaignCode: formCampaignCode,
                    referrer: window.location.href,
                    customSuccessHeadline: formSuccessHeadline,
                    customSuccessDesc: formSuccessDesc
                });

            },
            updateFormForLoggedIn: function (userFromId, el) {
                if (userFromId && userFromId.primaryEmailAddress) {
                    //dom updated
                    fastdom.write(function () {
                        $('.js-email-sub__inline-label', el).addClass('email-sub__inline-label--is-hidden');
                        $('.js-email-sub__submit-input', el).addClass('email-sub__submit-input--solo');
                        $('.js-email-sub__text-input', el).val(userFromId.primaryEmailAddress);
                    });
                }
            },
            freezeHeight: function ($wrapper, reset) {
                //external var
                var wrapperHeight;

                var getHeight = function () {
                        // read from dom
                        fastdom.read(function () {
                            wrapperHeight = $wrapper[0].clientHeight;
                        });
                    }
                var setHeight = function () {
                        // dom write
                        fastdom.defer(function () {
                            $wrapper.css('min-height', wrapperHeight);
                        });
                    }

                var resetHeight = function () {
                        //dom write
                        fastdom.write(function () {
                            $wrapper.css('min-height', '');
                            getHeight();
                            setHeight();
                        });
                    };

                return function () {
                    if (reset) {
                        resetHeight();
                    } else {
                        // these should be combined
                        getHeight();
                        setHeight();
                    }
                };
            },
            setIframeHeight: function (iFrameEl, callback) {
                return function () {
                    // dom write
                    fastdom.write(function () {
                        iFrameEl.height = '';
                        iFrameEl.height = iFrameEl.contentWindow.document.body.clientHeight + 'px';
                        callback.call();
                    });
                };
            }
        },
        formSubmission = {
            bindSubmit: function ($form, analytics) {
                //event handler
                var url = '/email';
                bean.on($form[0], 'submit', this.submitForm($form, url, analytics));
            },
            submitForm: function ($form, url, analytics) {
                /**
                 * simplistic email address validation to prevent misfired
                 * omniture events
                 *
                 * @param  {String} emailAddress
                 * @return {Boolean}
                 */
                function validate(emailAddress) { //yay
                    return typeof emailAddress === 'string' &&
                           emailAddress.indexOf('@') > -1;
                }

                return function (event) {
                    var emailAddress = $('.' + classes.textInput, $form).val();
                    var listId = $('.' + classes.listIdHiddenInput, $form).val();
                    var analyticsInfo; //external state

                    event.preventDefault();

                    // state should be passed in as argument
                    if (!state.submitting && validate(emailAddress)) {
                        var formData = $form.data('formData');
                        var data =  'email=' + encodeURIComponent(emailAddress) +
                                    '&listId=' + listId +
                                    '&campaignCode=' + formData.campaignCode +
                                    '&referrer=' + formData.referrer;
                        // this should not be external var
                        analyticsInfo = 'rtrt | email form inline | '
                                        + analytics.formType + ' | '
                                        + analytics.listId + ' | '
                                        + analytics.signedIn + ' | '
                                        + '%action%';
                        // this should not be external var
                        // this is to prevent double submission
                        state.submitting = true;

                        return new Promise(function () {
                            //send external event
                            if (formData.customSuccessEventName) {
                                mediator.emit(formData.customSuccessEventName);
                            }

                            //send another external event
                            googleAnalytics.trackNonClickInteraction(analyticsInfo.replace('%action%', 'subscribe clicked'));
                            //post form data
                            return fetch(config.page.ajaxUrl + url, {
                                method: 'post',
                                body: data,
                                headers: {
                                    'Accept': 'application/json'
                                }
                            })
                            .then(function (response) { // handle errors
                                if (!response.ok) {
                                    throw new Error('Fetch error: ' + response.status + ' ' + response.statusText);
                                }
                            }) //track some stuff
                            .then(function () {
                                googleAnalytics.trackNonClickInteraction(analyticsInfo.replace('%action%', 'subscribe successful'));
                            })
                            .then(handleSubmit(true, $form)) //update the dom once we've completed update
                            .catch(function (error) { //log errors
                                robust.log('c-email', error);
                                googleAnalytics.trackNonClickInteraction(analyticsInfo.replace('%action%', 'error'));
                                handleSubmit(false, $form)(); //write errors back to user
                            });
                        });
                    }
                };
            }
        },
        setup = function (rootEl, thisRootEl, isIframed) {
            //$ should be passed in classes should be passed in
            $('.' + classes.inlineLabel, thisRootEl).each(function (el) {
                //more constants
                formInlineLabels.init(el, {
                    textInputClass: '.js-email-sub__text-input',
                    labelClass: '.js-email-sub__label',
                    hiddenLabelClass: 'email-sub__label--is-hidden',
                    labelEnabledClass: 'email-sub__inline-label--enabled'
                });
            });
            // write the form into the current page
            $('.' + classes.wrapper, thisRootEl).each(function (el) {
                var $el = $(el)
                var freezeHeight = ui.freezeHeight($el, false);
                var freezeHeightReset = ui.freezeHeight($el, true);
                var $formEl = $('.' + classes.form, el);
                var analytics = {
                        formType: $formEl.data('email-form-type'),
                        listId: $formEl.data('email-list-id'),
                        signedIn: (Id.isUserLoggedIn()) ? 'user signed-in' : 'user not signed-in'
                    };

                formSubmission.bindSubmit($formEl, analytics);

                // If we're in an iframe, we should check whether we need to add a title and description
                // from the data attributes on the iframe (eg: allowing us to set them from composer)
                if (isIframed) {
                    ui.updateForm(rootEl, $el, analytics);
                }

                // Ensure our form is the right height, both in iframe and outside
                (isIframed) ? ui.setIframeHeight(rootEl, freezeHeight).call() : freezeHeight.call();

                mediator.on('window:throttledResize',
                    (isIframed) ? ui.setIframeHeight(rootEl, freezeHeightReset) : freezeHeightReset
                );
            });
        };

    return {
            updateForm: ui.updateForm,
            init: function (rootEl) {
                var browser = detect.getUserAgent.browser,
                    version = detect.getUserAgent.version;
                // If we're in lte IE9, don't run the init and adjust the footer
                if (browser === 'MSIE' && contains(['7','8','9'], version + '')) {
                    $('.js-footer__secondary').addClass('l-footer__secondary--no-email');
                    $('.js-footer__email-container', '.js-footer__secondary').addClass('is-hidden');
                } else {
                    // We're loading through the iframe
                    if (rootEl && rootEl.tagName === 'IFRAME') {
                        // We can listen for a lazy load or reload to catch an update
                        setup(rootEl, rootEl.contentDocument.body, true);
                        bean.on(rootEl, 'load', function () {
                            setup(rootEl, rootEl.contentDocument.body, true);
                        });

                    } else {
                        setup(rootEl, rootEl || document, false);
                    }
                }
            }
        };
});

