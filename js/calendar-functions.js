const { DateTime } = require("luxon");

const monthList = [
  ``,
  `January`,
  `February`,
  `March`,
  `April`,
  `May`,
  `June`,
  `July`,
  `August`,
  `September`,
  `October`,
  `November`,
  `December`,
];

/**
 * Gets the current date and creates an array of the days to populate the calendar.
 * @returns An object with the month, year, last day, and an array of the days to use for the calendar.
 */
function currentDate() {
  const dateReturn = {};
  const dt = DateTime.local();

  dateReturn.month = monthList[dt.month];
  dateReturn.monthNumber = dt.month;

  if (dateReturn.monthNumber < 10) {
    dateReturn.monthNumber = `0` + dateReturn.monthNumber;
  }

  dateReturn.year = dt.year;
  dateReturn.lastDay = dt.daysInMonth;
  dateReturn.days = _populateDayNumbers(dt.month, dt.year);

  return dateReturn;
}

/**
 * Gets the previous month's date and creates an array of the days to populate the calendar.
 * @param {String} displayedMonth The full word of the month that is currently being shown in the calendar.
 * @param {String} displayedYear The year that is currently being shown in the calendar.
 * @returns An object with the month, year, last day, and an array of the days to use for the calendar.
 */
function previous(displayedMonth, displayedYear) {
  const dateReturn = {};
  let currentDisplayedMonth = monthList.findIndex(
    (month) => month === displayedMonth
  );

  if (displayedMonth != "January") {
    dateReturn.month = monthList[currentDisplayedMonth - 1];
    dateReturn.monthNumber = monthList.findIndex(
      (month) => month === dateReturn.month
    );
    dateReturn.year = displayedYear;
    dateReturn.days = _populateDayNumbers(
      currentDisplayedMonth - 1,
      +dateReturn.year
    );
    dateReturn.lastDay = DateTime.local(
      +dateReturn.year,
      +dateReturn.monthNumber
    ).daysInMonth;
  } else {
    dateReturn.month = monthList[12];
    dateReturn.monthNumber = monthList.findIndex(
      (month) => month === dateReturn.month
    );
    dateReturn.year = displayedYear - 1;
    dateReturn.days = _populateDayNumbers(12, displayedYear - 1);
    dateReturn.lastDay = DateTime.local(
      +dateReturn.year,
      +dateReturn.monthNumber
    ).daysInMonth;
  }

  if (dateReturn.monthNumber < 10) {
    dateReturn.monthNumber = `0` + dateReturn.monthNumber;
  }

  return dateReturn;
}

/**
 * Gets the next month's date and creates an array of the days to populate the calendar.
 * @param {String} displayedMonth The full word of the month that is currently being shown in the calendar.
 * @param {String} displayedYear The year that is currently being shown in the calendar.
 * @returns An object with the month, year, last day, and an array of the days to use for the calendar.
 */
function next(displayedMonth, displayedYear) {
  const dateReturn = {};
  let currentDisplayedMonth = monthList.findIndex(
    (element) => element === displayedMonth
  );

  if (displayedMonth != "December") {
    dateReturn.month = monthList[currentDisplayedMonth + 1];
    dateReturn.monthNumber = monthList.findIndex(
      (element) => element === dateReturn.month
    );
    dateReturn.year = displayedYear;
    dateReturn.days = _populateDayNumbers(
      currentDisplayedMonth + 1,
      +dateReturn.year
    );
    dateReturn.lastDay = DateTime.local(
      +dateReturn.year,
      +dateReturn.monthNumber
    ).daysInMonth;
  } else {
    dateReturn.month = monthList[1];
    dateReturn.monthNumber = monthList.findIndex(
      (element) => element === dateReturn.month
    );
    dateReturn.year = +displayedYear + 1;
    dateReturn.days = _populateDayNumbers(1, +displayedYear + 1);
    dateReturn.lastDay = DateTime.local(
      +dateReturn.year,
      +dateReturn.monthNumber
    ).daysInMonth;
  }

  if (dateReturn.monthNumber < 10) {
    dateReturn.monthNumber = `0` + dateReturn.monthNumber;
  }

  return dateReturn;
}

/**
 * Creates an array that contains all of the days of the month to populate the calendar with.
 * @param {String} displayedMonth The full word of the month that is currently being shown in the calendar.
 * @param {String} displayedYear The year that is currently being shown in the calendar.
 * @returns An array that contains the month's days to populate the calendar.
 */
function _populateDayNumbers(displayedMonth, displayedYear) {
  const daysArray = [];
  const dt = DateTime.local(displayedYear, displayedMonth, 1);

  let weekOneEmptyDays = dt.weekday;
  if (weekOneEmptyDays == 7) {
  } else {
    for (let i = 1; i <= weekOneEmptyDays; i++) {
      daysArray.push(" ");
    }
  }

  let count = dt.daysInMonth;
  for (let i = 1; i <= count; i++) {
    daysArray.push(i);
  }

  let remainingDays = 42 - daysArray.length;
  if (remainingDays > 0) {
    for (let i = 1; i <= remainingDays; i++) {
      daysArray.push(" ");
    }
  }

  return daysArray;
}

module.exports = {
  currentDate: currentDate,
  previous: previous,
  next: next,
};
