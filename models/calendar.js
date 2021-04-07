const calendarQueries = require("../queries/calendar");
const { DateTime } = require("luxon");

const state = {
  viewedMonthName: "",
  viewedMonthNumber: "",
  viewedYear: "",
  viewedDaysInMonth: 0,
  viewedCalendarDays: [],
  calendarTasks: [],
};

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
const loadCurrentDate = function () {
  const dt = DateTime.local();

  if (dt.month < 10) {
    state.viewedMonthNumber = `0` + dt.month;
  } else {
    state.viewedMonthNumber = dt.month;
  }

  state.viewedMonthName = dt.monthLong;
  state.viewedYear = dt.year;
  state.viewedDaysInMonth = dt.daysInMonth;
  _populateDayNumbers(dt.month, dt.year);
};

/**
 *
 * @param {*} displayedMonth
 * @param {*} displayedYear
 */
function previous(displayedMonth, displayedYear) {
  const currentDisplayedMonth = monthList.findIndex(
    (month) => month === displayedMonth
  );

  if (displayedMonth !== "January") {
    state.viewedMonthName = monthList[currentDisplayedMonth - 1];
    state.viewedMonthNumber = monthList.findIndex(
      (month) => month === state.viewedMonthName
    );

    state.viewedYear = +displayedYear;

    _populateDayNumbers(currentDisplayedMonth - 1, state.viewedYear);

    state.viewedDaysInMonth = DateTime.local(
      state.viewedYear,
      state.viewedMonthNumber
    ).daysInMonth;
  } else {
    state.viewedMonthName = monthList[12];
    state.viewedMonthNumber = 12;
    state.viewedYear = +displayedYear - 1;
    _populateDayNumbers(12, state.viewedYear - 1);
    state.viewedDaysInMonth = DateTime.local(
      state.viewedYear,
      state.viewedMonthNumber
    ).daysInMonth;
  }

  if (state.viewedMonthNumber < 10) {
    state.viewedMonthNumber = `0` + state.viewedMonthNumber;
  }
}

/**
 *
 * @param {*} displayedMonth
 * @param {*} displayedYear
 */
function next(displayedMonth, displayedYear) {
  let currentDisplayedMonth = monthList.findIndex(
    (element) => element === displayedMonth
  );

  if (displayedMonth !== "December") {
    state.viewedMonthName = monthList[currentDisplayedMonth + 1];
    state.viewedMonthNumber = monthList.findIndex(
      (element) => element === state.viewedMonthName
    );
    state.viewedYear = +displayedYear;
    _populateDayNumbers(currentDisplayedMonth + 1, state.viewedYear);
  } else {
    state.viewedMonthName = monthList[1];
    state.viewedMonthNumber = monthList.findIndex(
      (element) => element === state.viewedMonthName
    );
    state.viewedYear = +displayedYear + 1;
    _populateDayNumbers(1, state.viewedYear);
  }

  state.viewedDaysInMonth = DateTime.local(
    state.viewedYear,
    state.viewedMonthNumber
  ).daysInMonth;

  if (state.viewedMonthNumber < 10) {
    state.viewedMonthNumber = `0` + state.viewedMonthNumber;
  }
}

/**
 *
 * @param {*} displayedMonth
 * @param {*} displayedYear
 */
function _populateDayNumbers(displayedMonth, displayedYear) {
  const daysArray = [];
  const dt = DateTime.local(displayedYear, displayedMonth, 1);

  const weekOneEmptyDays = dt.weekday;
  if (weekOneEmptyDays !== 7) {
    for (let i = 1; i <= weekOneEmptyDays; i++) {
      daysArray.push(" ");
    }
  }

  const count = dt.daysInMonth;
  for (let i = 1; i <= count; i++) {
    daysArray.push(i);
  }

  const remainingDays = 42 - daysArray.length;
  if (remainingDays > 0) {
    for (let i = 1; i <= remainingDays; i++) {
      daysArray.push(" ");
    }
  }

  state.viewedCalendarDays = daysArray;
}

/**
 *
 * @param {*} firstDay
 * @param {*} lastDay
 * @param {*} tasks
 */
function getCalendarMonthTasks(firstDay, lastDay, tasks) {
  state.calendarTasks = [];
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

  state.calendarTasks = monthTasks;
}

/**
 *
 * @param {*} firstDay
 * @param {*} lastDay
 * @param {*} userID
 */
const loadCalendarActiveTasks = async function (firstDay, lastDay, userID) {
  const data = await calendarQueries.getCalendarActiveTasks(
    firstDay,
    lastDay,
    userID
  );

  getCalendarMonthTasks(firstDay, lastDay, data);
};

module.exports = {
  state: state,
  getCalendarMonthTasks: getCalendarMonthTasks,
  loadCalendarActiveTasks: loadCalendarActiveTasks,
  loadCurrentDate: loadCurrentDate,
  previous: previous,
  next: next,
};
