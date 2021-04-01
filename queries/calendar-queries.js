if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const { DateTime } = require("luxon");
const mysql = require("mysql");

// MySQL Setup
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.SQL_PASSWORD,
  database: "tasktracker",
});

con.connect((err) => {
  if (err) console.log(err);
});

/**
 * Gets all of the active tasks for the user from the database.
 * @param {Date} firstDay Format of YYYY/MM/DD and is the first day of the month.
 * @param {Date} lastDay Format of YYYY/MM/DD and is the last day of the month.
 * @param {Number} userID User ID of the user in the database.
 * @returns All active tasks for the month.
 */
function getCalendarActiveTasks(firstDay, lastDay, userID) {
  return new Promise(function (resolve, reject) {
    const monthTasks = [];
    const [monthStartYear, monthStartMonth, monthStartDay] = firstDay.split(
      "-"
    );
    const [monthEndYear, monthEndMonth, monthEndDay] = lastDay.split("-");

    con.query(
      `SELECT t.id as task_id, t.task_title, t.task_description, t.task_type_id, DATE_FORMAT(t.task_start, "%Y-%m-%d") 
      as task_start, DATE_FORMAT(t.task_end, "%Y-%m-%d") as task_end, DATE_FORMAT(t.task_start, "%m/%d/%Y") as task_start_display, 
      DATE_FORMAT(t.task_end, "%m/%d/%Y") as task_end_display, tt.type_description, t.complete
      FROM task t
      JOIN task_type tt ON tt.id = t.task_type_id
      WHERE t.active = 1 AND t.task_end >= ? AND t.task_start <= ? AND t.created_by = ? 
      ORDER BY t.complete asc, t.task_title asc`,
      [firstDay, lastDay, userID],
      (err, tasks) => {
        if (err) {
          reject(err);
        }

        // Looks at each active task for the user and sees if it belongs in the month being viewed.
        tasks.forEach((task) => {
          const taskID = task.task_id;
          const taskTitle = task.task_title;
          const taskTypeID = task.task_type_id;
          const typeDescription = task.type_description;
          const [
            taskStartYear,
            taskStartMonth,
            taskStartDay,
          ] = task.task_start.split("-");
          const [taskEndYear, taskEndMonth, taskEndDay] = task.task_end.split(
            "-"
          );
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

        resolve(monthTasks);
      }
    );
  });
}

module.exports = {
  getCalendarActiveTasks: getCalendarActiveTasks,
};
