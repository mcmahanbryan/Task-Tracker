const { DateTime } = require("luxon");

const monthList = [``,`January`, `February`, `March`, `April`, `May`, `June`,
                 `July`, `August`, `September`, `October`, `November`, `December`];

function currentDate() {
    let dateReturn = {};

    const dt = DateTime.local();
    dateReturn.month = monthList[dt.month];
    dateReturn.monthNumber = dt.month;
    
    if (dateReturn.monthNumber < 10) {
        dateReturn.monthNumber = `0` + dateReturn.monthNumber;
    }

    dateReturn.year = dt.year;
    dateReturn.lastDay = dt.daysInMonth;
    dateReturn.days = populateDayNumbers(dt.month, dt.year);
    
    return dateReturn;
}

function previous(displayedMonth, displayedYear) {
    let dateReturn = {};
    let currentDisplayedMonth = monthList.findIndex(element => element === displayedMonth);
    
    if(displayedMonth != 'January') {
        dateReturn.month = monthList[currentDisplayedMonth - 1];
        dateReturn.monthNumber = monthList.findIndex(element => element === dateReturn.month);
        dateReturn.year = displayedYear;
        dateReturn.days = populateDayNumbers(currentDisplayedMonth - 1, Number(dateReturn.year));
        dateReturn.lastDay = DateTime.local(Number(dateReturn.year), Number(dateReturn.monthNumber)).daysInMonth;
    } else {
        dateReturn.month = monthList[12];
        dateReturn.monthNumber = monthList.findIndex(element => element === dateReturn.month);
        dateReturn.year = displayedYear - 1;
        dateReturn.days = populateDayNumbers(12, displayedYear - 1);
        dateReturn.lastDay = DateTime.local(Number(dateReturn.year), Number(dateReturn.monthNumber)).daysInMonth;
    }

    if (dateReturn.monthNumber < 10) {
        dateReturn.monthNumber = `0` + dateReturn.monthNumber;
    }

    return dateReturn;
}

function next(displayedMonth, displayedYear) {
    let dateReturn = {};
    let currentDisplayedMonth = monthList.findIndex(element => element === displayedMonth);
    
    if(displayedMonth != 'December') {
        dateReturn.month = monthList[currentDisplayedMonth + 1];
        dateReturn.monthNumber = monthList.findIndex(element => element === dateReturn.month);
        dateReturn.year = displayedYear; 
        dateReturn.days = populateDayNumbers(currentDisplayedMonth + 1, Number(dateReturn.year));
        dateReturn.lastDay = DateTime.local(Number(dateReturn.year), Number(dateReturn.monthNumber)).daysInMonth;
    } else {
        dateReturn.month = monthList[1];
        dateReturn.monthNumber = monthList.findIndex(element => element === dateReturn.month);
        dateReturn.year = Number(displayedYear) + 1; 
        dateReturn.days = populateDayNumbers(1, Number(displayedYear) + 1);
        dateReturn.lastDay = DateTime.local(Number(dateReturn.year), Number(dateReturn.monthNumber)).daysInMonth;
    }

    if (dateReturn.monthNumber < 10) {
        dateReturn.monthNumber = `0` + dateReturn.monthNumber;
    }

    return dateReturn;
}

function populateDayNumbers(displayedMonth, displayedYear) {
    let daysArray = [];
    const dt = DateTime.local(displayedYear, displayedMonth, 1);

    let weekOneEmptyDays = dt.weekday;
    if (weekOneEmptyDays == 7) {
    } else {
            for(let i = 1; i <= weekOneEmptyDays; i++) {
              daysArray.push(' ');
        }
    } 

    let count = dt.daysInMonth;
    for(let i = 1; i <= count; i++) {
        daysArray.push(i);
    }

    let remainingDays = 42 - daysArray.length;
    if (remainingDays > 0) {
        for(let i = 1; i <= remainingDays; i++) {
            daysArray.push(' ');
        }
    }

    return daysArray;
}

module.exports = {
    currentDate: currentDate,
    previous: previous,
    next: next
}

