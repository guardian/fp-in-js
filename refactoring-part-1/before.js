getContributionsTimeSeries('contributionAmount', contributions);

// after
function fixEmptyAmount(money) {
    return (money === null) ? 0 : money['amount'];
}

function getContributionsTimeSeries(key, contributions) {
    return Object.keys(contributions)
        .map(function(date){
            var dateInt = parseInt(date);
            if (key === 'contributionAmount') {
                var money = contributions[date][key];
                var amount = fixEmptyAmount(money);
                return [dateInt, amount];
            }
            if (key === 'contributionCount') {
                return [dateInt, contributions[date][key]];
            }
        })
        .sort();
};
