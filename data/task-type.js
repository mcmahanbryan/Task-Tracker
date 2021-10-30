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
 * Gets the default task types and the user's custom types.
 * @param {Number} userID User ID of the user in the database.
 * @returns An array of all the user's available task types.
 */
function getTaskTypes(userID) {
  return new Promise(function (resolve, reject) {
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

        resolve(taskTypes);
      }
    );
  });
}

/**
 * Creates a new task type in the database for the user.
 * @param {Object} typeInfo An object with all of the type information.
 * @returns N/A
 */
function createTaskType(typeInfo) {
  return new Promise(function (resolve, reject) {
    con.query("INSERT INTO task_type SET ?", typeInfo, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

/**
 * Updates a specific task type.
 * @param {Number} selectedTypeID The database id of the task type.
 * @param {String} typeDescription The string description of the type.
 * @returns N/A
 */
function updateTaskType(selectedTypeID, typeDescription) {
  return new Promise(function (resolve, reject) {
    con.query(
      "UPDATE task_type SET type_description = ? WHERE id = ?",
      [typeDescription, selectedTypeID],
      (err) => {
        if (err) {
          reject(err);
        }

        resolve();
      }
    );
  });
}

/**
 * Deletes a specific task type.
 * @param {Number} selectedTypeID The database id of the task type.
 * @returns N/A
 */
function deleteTaskType(selectedTypeID) {
  return new Promise(function (resolve, reject) {
    con.query(
      `UPDATE task_type SET active = 0 WHERE id = ?`,
      selectedTypeID,
      (err) => {
        if (err) {
          reject(err);
        }

        resolve();
      }
    );
  });
}

module.exports = {
  getTaskTypes: getTaskTypes,
  updateTaskType: updateTaskType,
  createTaskType: createTaskType,
  deleteTaskType: deleteTaskType,
};
