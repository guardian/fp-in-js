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
    const classes = {
        wrapper: 'js-email-sub',
        form: 'js-email-sub__form',
        inlineLabel: 'js-email-sub__inline-label',
        textInput: 'js-email-sub__text-input',
        listIdHiddenInput: 'js-email-sub__listid-input'
    };

    const setup = (rootEl, documentBody, isIframed, classes) => {

        addInlineLabelsToForms(documentBody, classes, $, formInlineLabels);
        // mount the form into the current page
        attachToPageForms((element) => {
            const $formElement = $('.' + classes.form, element);
            const analytics = getFormMetaData($formElement);

            bindSubmit($formElement, analytics);
            manageFormHeight($(element), isIframed, analytics);

        }, $, classes);
        //This has no return value ...
    };

    const removeAndRemember = (e, iframe, analytics) => {
        const currentListPrefs = userPrefs.get('email-sign-up-' + analytics.formType) || []; 
        currentListPrefs.push(analytics.listId + '');
        userPrefs.set('email-sign-up-' + analytics.formType, uniq(currentListPrefs));

        $(iframe).remove();

        googleAnalytics.trackNonClickInteraction('rtrt | email form inline | ' + analytics.formType + ' | ' + analytics.listId + ' | ' + analytics.signedIn + ' | form hidden');

    };

    const bindSubmit = ($form, analytics) => {
        bean.on($form[0], 'submit', this.submitForm($form, '/email', analytics));
    };

    const submitForm = ($form, url, analytics) => {

        const validateEmail = (emailAddress) => {
            return typeof emailAddress === 'string' &&
                   emailAddress.indexOf('@') > -1;
        }

        const getData = (emailAddress, listId, formData) => {
            return  'email=' + encodeURIComponent(emailAddress) +
                    '&listId=' + listId +
                    '&campaignCode=' + formData.campaignCode +
                    '&referrer=' + formData.referrer;
        }

        const getAnalyticsData = (analytics, $form) => {
            const formData = $form.data('formData');
            const data =  getData(emailAddress, listId, formData);
            return  'rtrt | email form inline | '
                    + analytics.formType + ' | '
                    + analytics.listId + ' | '
                    + analytics.signedIn + ' | '
                    + '%action%';
        }

        return function (event) {
            const emailAddress = $('.' + classes.textInput, $form).val();
            const listId = $('.' + classes.listIdHiddenInput, $form).val();

            event.preventDefault();

            // state should be passed in as argument
            if (validateEmail(emailAddress)) {

                const analyticsInfo = getAnalyticsData(analytics);

                return new Promise(function (analyticsInfo) {
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
                    .then(updatePostedForm(true, $form)) //update the dom once we've completed update
                    .catch(function (error) { //log errors
                        robust.log('c-email', error);
                        googleAnalytics.trackNonClickInteraction(analyticsInfo.replace('%action%', 'error'));
                        updatePostedForm(false, $form)(); //write errors back to user
                    });
                });
            }
        };

    };

    const getSuccessMessages = ($form) => {
        const formData = $form.data('formData')
        return {
            statusClass: 'email-sub__message--success',
            submissionHeadline: formData.customSuccessHeadline || messages.defaultSuccessHeadline,
            submissionMessage: formData.customSuccessDesc || messages.defaultSuccessDesc,
            submissionIcon: svgs('tick')
        }
    };

    const getFailureMessages = () => {
        return {
            statusClass: 'email-sub__message--failure',
            submissionHeadline: 'Something went wrong',
            submissionMessage: 'Please try again.',
            submissionIcon: svgs('crossIcon')
        }
    };

    const updatePostedForm = (isSuccess, $form) => {
            const submissionMessage (isSuccess) ? getSuccessMessages($form) : getFailureMessages();
            const submissionHtml = template(successHtml, submissionMessage);

            fastdom.write(function () {
                $form.addClass('email-sub__form--is-hidden');
                $form.after(submissionHtml);
            });
        }
        //this has no return value
    };

    const manageFormHeight = ($el, isIframed, analytics) => {

        if (isIframed) {
            renderIframeForm(rootEl, $el, analytics);
            setIframeHeight(rootEl, freezeHeight).call();
            mediator.on('window:throttledResize', ui.setIframeHeight(rootEl, freezeHeightReset));
        } else {
            freezeHeight();
            mediator.on('window:throttledResize', resetHeight);
        }

        const setMinHeight = setMinHeight($el);
        const resetMinHeight = resetMinHeight($el);

        const setMinHeight = ($wrapper) => {
            return () => {
                const wrapperHeight;
                // read from dom
                fastdom.read(function () {
                    wrapperHeight = $wrapper[0].clientHeight;
                });

                fastdom.defer(function () {
                    $wrapper.css('min-height', wrapperHeight);
                });
            }
        };

        const resetMinHeight = ($wrapper) => {
            return () => {
                fastdom.write(function () {
                    $wrapper.css('min-height', '');
                    setMinHeight();
                });
            }
        };

        const setIframeHeight = (iFrameEl, callback) => {
            return () => {
                // dom write
                fastdom.write(function () {
                    iFrameEl.height = '';
                    iFrameEl.height = iFrameEl.contentWindow.document.body.clientHeight + 'px';
                    callback.call();
                });
            };
        };
    };

    const renderIframeForm = (thisRootEl, el, analytics, opts) => {
        // check if opts are valid, if not use data,
        const data = getFormData(el, $(thisRootEl).data(), opts);

        updateFormForLoggedInUsers(Id, el);
        initIframeForm(data);
        cacheFormData(el, data);

    };

    const initIframeForm = (data) => {
        fastdom.write(function () {
            if (data.formTitle) {
                $('.js-email-sub__heading', el).text(data.formTitle);
            }

            if (data.ormDescription) {
                $('.js-email-sub__description', el).text(data.formDescription);
            }

            if (data.removeComforter) {
                $('.js-email-sub__small', el).remove();
            }

            if (data.formModClass) {
                $(el).addClass('email-sub--' + data.formModClass);
            }

            if (data.formCloseButton) {
                const closeButtonTemplate = {
                    closeIcon: svgs('closeCentralIcon')
                },
                closeButtonHtml = template(closeHtml, closeButtonTemplate);

                el.append(closeButtonHtml);

                bean.on(el[0], 'click', '.js-email-sub--close', removeAndRemember, [thisRootEl, analytics[0], analytics[1]]);
            }
        });
    }

    const cacheFormData = (el, data) => {               // Cache data on the form element
        $('.js-email-sub__form', el).data('formData', {
            customSuccessEventName: data.formSuccessEventName,
            campaignCode: data.formCampaignCode,
            referrer: window.location.href,
            customSuccessHeadline: data.formSuccessHeadline,
            customSuccessDesc: data.formSuccessDesc
        });
    }

    const getFormData = (el, formData, opts) => {
        return {
            formTitle: (opts && opts.formTitle) || formData.formTitle || false,
            formDescription: (opts && opts.formDescription) || formData.formDescription || false,
            formCampaignCode: (opts && opts.formCampaignCode) || formData.formCampaignCode || '',
            formSuccessHeadline: (opts && opts.formSuccessHeadline) || formData.formSuccessHeadline,
            formSuccessDesc: (opts && opts.formSuccessDesc) || formData.formSuccessDesc,
            removeComforter: (opts && opts.removeComforter) || formData.removeComforter || false,
            formModClass: (opts && opts.formModClass) || formData.formModClass || false,
            formCloseButton: (opts && opts.formCloseButton) || formData.formCloseButton || false,
            formSuccessEventName: (opts && opts.formSuccessEventName) || formData.formSuccessEventName || false;
        }
    }

    const updateFormForLoggedInUsers = (Id, el) => {
        Id.getUserFromApi((userFromId) => {
            if (userFromId && userFromId.primaryEmailAddress) {
                //dom updated
                fastdom.write(function () {
                    $('.js-email-sub__inline-label', el).addClass('email-sub__inline-label--is-hidden');
                    $('.js-email-sub__submit-input', el).addClass('email-sub__submit-input--solo');
                    $('.js-email-sub__text-input', el).val(userFromId.primaryEmailAddress);
                });
            }
        })
    };

    const attachToPageForms = (callback, $, classes) => {
        $('.' + classes.wrapper, documentBody).each(
            (el) => callback(el);
        );
        //This has no return value ...
    };

    const getFormMetaData = ($form, Id) => {
        return {
            formType: $form.data('email-form-type'),
            listId: $form.data('email-list-id'),
            signedIn: (Id.isUserLoggedIn()) ? 'user signed-in' : 'user not signed-in'
        };
    };

    const addInlineLabelsToForms = (rootElement, classes, $, formInlineLabels) => {

        $('.' + classes.inlineLabel, rootElement).each(
            (inputField) => {
                formInlineLabels.init(inputField, formLabels);
            }
        );

        const formLabels = {
            textInputClass: '.js-email-sub__text-input',
            labelClass: '.js-email-sub__label',
            hiddenLabelClass: 'email-sub__label--is-hidden',
            labelEnabledClass: 'email-sub__inline-label--enabled'
        };
    }

    const isBrowserIE = (detect) => {
            const browser = detect.getUserAgent.browser;
            const version = detect.getUserAgent.version;

            return browser === 'MSIE' && contains(['7','8','9'], version + '')
    }

    // should we call other functions ??
    const hideEmailFormFromIE = () => {
        $('.js-footer__secondary').addClass('l-footer__secondary--no-email');
        $('.js-footer__email-container', '.js-footer__secondary').addClass('is-hidden');
    }

    const loadedThroughIframe = (iframe) => {
        return rootEl && rootEl.tagName === 'IFRAME';
    }

    return {
        updateForm: initIframeForm,
        // Root Element is optional! Will be iframe root
        // This should be an option type
        init: function (iframe) {
            if (isBrowserIE) {
                hideEmailFormFromIE();
            } else {
                if (loadedThroughIframe(iframe)) {
                    // We can listen for a lazy load or reload to catch an update
                    setup(iframe, iframe.contentDocument.body, true, classes);
                    bean.on(iframe, 'load', function () {
                        setup(iframe, iframe.contentDocument.body, true, classes);
                    });
                } else {
                    setup(null, document, false, classes);
            }
        }
    };

};