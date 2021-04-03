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

/**
 * Gets all of the active tasks for the user from the database.
 * @param {Date} firstDay Format of YYYY/MM/DD and is the first day of the month.
 * @param {Date} lastDay Format of YYYY/MM/DD and is the last day of the month.
 * @param {Number} userID User ID of the user in the database.
 * @returns All active tasks for the month.
 */
function getCalendarMonthTasks(firstDay, lastDay, tasks) {
  const monthTasks = [];
  const [monthStartYear, monthStartMonth, monthStartDay] = firstDay.split("-");
  const [monthEndYear, monthEndMonth, monthEndDay] = lastDay.split("-");

  // Looks at each active task for the user and sees if it belongs in the month being viewed.
  tasks.forEach((task) => {
    const taskID = task.task_id;
    const taskTitle = task.task_title;
    const taskTypeID = task.task_type_id;
    const typeDescription = task.type_description;
    const [taskStartYear, taskStartMonth, taskStartDay] = task.task_start.split(
      "-"
    );
    const [taskEndYear, taskEndMonth, taskEndDay] = task.task_end.split("-");
    debugger;
    const taskStartDisplay = task.task_start_display;
    const taskEndDisplay = task.task_end_display;
    const taskType = task.type_description;
    const taskComplete = task.complete;
    let currentMonthEndDate;
    let currentMonthStartDate;

    // Putting the start/end dates of the current month and the task in the DateTime
    // format, so they can be compared correctly.
    const taskEndDate = DateTime.local(
      +taskEndYear,
      +taskEndMonth,
      +taskEndDay
    );
    const monthEndDate = DateTime.local(
      +monthEndYear,
      +monthEndMonth,
      +monthEndDay
    );

    const taskStartDate = DateTime.local(
      +taskStartYear,
      +taskStartMonth,
      +taskStartDay
    );
    const monthStartDate = DateTime.local(
      +monthStartYear,
      +monthStartMonth,
      +monthStartDay
    );

    // Checks to see if the task end date is after the end of this month
    // and sets the end day to the last day of the month if it is.
    if (taskEndDate > monthEndDate) {
      currentMonthEndDate = +monthEndDay;
    } else {
      currentMonthEndDate = +taskEndDay;
    }

    // Checks to see if the task start date is before the first of this month
    // and sets it to the first day of the month if it is.
    if (taskStartDate < monthStartDate) {
      currentMonthStartDate = 01;
    } else {
      currentMonthStartDate = +taskStartDay;
    }

    taskInfo = {
      taskID: taskID,
      taskTitle: taskTitle,
      taskTypeID: taskTypeID,
      typeDescription: typeDescription,
      taskStart: currentMonthStartDate,
      taskEnd: currentMonthEndDate,
      taskStartDisplay: taskStartDisplay,
      taskEndDisplay: taskEndDisplay,
      taskType: taskType,
      taskComplete: taskComplete,
    };

    monthTasks.push(taskInfo);
  });

  return monthTasks;
}

module.exports = {
  getCalendarMonthTasks: getCalendarMonthTasks,
  currentDate: currentDate,
  previous: previous,
  next: next,
};
