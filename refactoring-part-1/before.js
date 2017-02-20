getContributionsTimeSeries('contributionAmount', contributions);

// before
function getContributionsTimeSeries(key) {
    var timeSeries = [];
    for (var date in contributions) {
        if (contributions.hasOwnProperty(date)) {
            var dateInt = parseInt(date);
            if (key === 'contributionAmount') {
                var money = contributions[date][key];
                var amount;
                if (money === null) {
                    amount = 0;
                } else {
                    amount = money['amount'];
                }
                timeSeries.push([dateInt, amount]);
            }
            else if (key === 'contributionCount') {
                timeSeries.push([dateInt, contributions[date][key]]);
            }
        }
    }
    return timeSeries.sort();
};