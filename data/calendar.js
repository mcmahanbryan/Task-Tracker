if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

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

        resolve(tasks);
      }
    );
  });
}

module.exports = {
  getCalendarActiveTasks: getCalendarActiveTasks,
};
