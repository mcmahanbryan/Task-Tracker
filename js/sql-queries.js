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
  console.log("Connected!");
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
    const [monthStartYear, monthStartMonth, monthStartDay] = firstDay;
    const [monthEndYear, monthEndMonth, monthEndDay] = lastDay;

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

          const taskStartDisplay = task.task_start_display;
          const taskEndDisplay = task.task_end_display;
          const taskType = task.type_description;
          const taskComplete = task.complete;
          let currentMonthEndDate;
          let currentMonthStartDate;

          // Putting the start/end dates of the current month and the task  in the DateTime
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
            currentMonthEndDate = +monthEndDate.daysInMonth;
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

/**
 * Gets the active tasks for a user. Can be used to get completed or uncompleted task.
 * @param {Number} userID User ID of the user in the database.
 * @param {Boolean} completed Marks whether you want completed or uncompleted tasks. Defaults to 0 (uncompleted).
 * @returns Array of active tasks.
 */
function getUsersActiveTasks(userID, completed = 0) {
  return new Promise(function (resolve, reject) {
    const activeTasks = [];

    con.query(
      `SELECT t.id as task_id, t.task_title, t.task_description, t.task_type_id, DATE_FORMAT(t.task_start, "%Y-%m-%d") 
    as task_start, DATE_FORMAT(t.task_end, "%Y-%m-%d") as task_end, DATE_FORMAT(t.task_start, "%m/%d/%Y") as task_start_display, 
    DATE_FORMAT(t.task_end, "%m/%d/%Y") as task_end_display, 
    ${
      completed
        ? 'DATE_FORMAT(t.completed_date, "%m/%d/%Y") as completed_date_display,'
        : ""
    } 
    tt.type_description
    FROM task t
    JOIN task_type tt ON tt.id = t.task_type_id
    WHERE t.active = 1 AND t.complete = ${completed} AND t.created_by = ? ORDER BY t.task_start asc`,
      userID,
      (err, tasks) => {
        if (err) {
          reject(err);
        }

        tasks.forEach((task) => {
          const taskID = task.task_id;
          const taskTitle = task.task_title;
          const taskDescription = task.task_description;
          const taskTypeID = task.task_type_id;
          const taskStart = task.task_start;
          const taskEnd = task.task_end;
          const taskStartDisplay = task.task_start_display;
          const taskEndDisplay = task.task_end_display;
          const taskType = task.type_description;
          const completedDateDisplay = task.completed_date_display
            ? task.completed_date_display
            : null;

          taskInfo = {
            taskID: taskID,
            taskTitle: taskTitle,
            taskDescription: taskDescription,
            taskTypeID: taskTypeID,
            taskStart: taskStart,
            taskEnd: taskEnd,
            taskStartDisplay: taskStartDisplay,
            taskEndDisplay: taskEndDisplay,
            taskType: taskType,
            taskCompletedDisplay: completedDateDisplay
              ? completedDateDisplay
              : null,
          };

          activeTasks.push(taskInfo);
        });

        resolve(activeTasks);
      }
    );
  });
}

function getUsersTodayTasks(userID) {
  return new Promise(function (resolve, reject) {
    const todaysTasks = [];

    con.query(
      `SELECT t.id as task_id, t.task_title, DATE_FORMAT(t.task_end, "%m/%d/%Y") as task_end, tt.type_description FROM task t
    JOIN task_type tt ON tt.id = t.task_type_id
    WHERE t.active = 1 
    AND t.complete = 0 AND t.task_start <= CURDATE() AND t.task_end >= CURDATE()
    AND t.created_by = ?
    ORDER BY t.task_end ASC`,
      userID,
      (err, tasks) => {
        if (err) {
          reject(err);
        }

        tasks.forEach((task) => {
          const taskID = task.task_id;
          const taskTitle = task.task_title;
          const typeDescription = task.type_description;
          const taskEnd = task.task_end;

          taskInfo = {
            taskID: taskID,
            taskTitle: taskTitle,
            typeDescription: typeDescription,
            taskEnd: taskEnd,
          };

          todaysTasks.push(taskInfo);
        });

        resolve(todaysTasks);
      }
    );
  });
}

function getTaskTypes(userID) {
  return new Promise(function (resolve, reject) {
    const activeTaskTypes = [];

    con.query(
      `SELECT id, type_description, active, custom, user_id
    FROM task_type
    WHERE active = 1 AND custom = 0 OR active = 1 AND user_id = ?
    ORDER BY custom ASC, type_description ASC`,
      userID,
      (err, taskTypes) => {
        if (err) {
          reject(err);
        }

        taskTypes.forEach((type) => {
          const typeID = type.id;
          const typeDescription = type.type_description;
          const custom = type.custom;

          typeInfo = {
            typeID: typeID,
            typeDescription: typeDescription,
            custom: custom,
          };

          activeTaskTypes.push(typeInfo);
        });

        resolve(activeTaskTypes);
      }
    );
  });
}

function getAllUsers() {
  return new Promise(function (resolve, reject) {
    const foundUsers = [];

    con.query(
      "SELECT id, user_name, password FROM user WHERE active = 1",
      (err, users) => {
        if (err) console.log(err);

        users.forEach((user) => {
          foundUsers.push({
            userID: user.id,
            userName: user.user_name,
            password: user.password,
          });
        });
      }
    );

    resolve(foundUsers);
  });
}

module.exports = {
  getCalendarActiveTasks: getCalendarActiveTasks,
  getUsersActiveTasks: getUsersActiveTasks,
  getUsersTodayTasks: getUsersTodayTasks,
  getTaskTypes: getTaskTypes,
  getAllUsers: getAllUsers,
};
