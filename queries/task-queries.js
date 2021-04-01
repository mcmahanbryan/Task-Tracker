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
 * Gets a specific user task.
 * @param {Number} taskID The database id of the task.
 * @param {Number} from The location that the function is being called from (0 if the modal was opened from Home, 1 if it was opened from Tasks).
 * @param {Number} completed Mark whether you want a completed task or not, it defaults to 0.
 * @returns An object of the task.
 */
function getUserTask(taskID, from = 0, completed = 0) {
  return new Promise(function (resolve, reject) {
    let selectedTask = {};

    con.query(
      `SELECT id as task_id, task_title, task_description, task_type_id, DATE_FORMAT(task_start, "%Y-%m-%d") 
        as task_start, 
        ${
          completed
            ? 'DATE_FORMAT(completed_date, "%Y-%m-%d") as completed_date,'
            : ""
        } 
        DATE_FORMAT(task_end, "%Y-%m-%d") as task_end
        FROM task WHERE id = ?`,
      taskID,
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
          const completedDate = completed ? task.completed_date : "";

          selectedTask = {
            taskID: taskID,
            taskTitle: taskTitle,
            taskDescription: taskDescription,
            taskTypeID: taskTypeID,
            taskStart: taskStart,
            taskEnd: taskEnd,
            completedDate: completedDate,
            from: from,
          };
        });

        resolve(selectedTask);
      }
    );
  });
}

/**
 * Updates a specific user task.
 * @param {Object} updatedTaskInfo An object including all of the task fields and their values.
 * @returns N/A
 */
function updateUserTask(updatedTaskInfo) {
  return new Promise(function (resolve, reject) {
    con.query(
      `UPDATE task SET task_title = ?,  task_description = ?, task_type_id = ?, task_start = ?, task_end = ?,
        ${updatedTaskInfo.complete ? "completed_date = now()," : ""} 
         complete = ? WHERE id = ?`,
      [
        updatedTaskInfo.title,
        updatedTaskInfo.taskDescription,
        updatedTaskInfo.taskType,
        updatedTaskInfo.startDate,
        updatedTaskInfo.endDate,
        updatedTaskInfo.complete,
        updatedTaskInfo.selectedID,
      ],
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
 * Deletes a specific user task.
 * @param {Number} taskID The database id for the task.
 * @returns N/A
 */
function deleteUserTask(taskID) {
  return new Promise(function (resolve, reject) {
    con.query(`UPDATE task SET active = 0 WHERE id = ?`, taskID, (err) => {
      if (err) {
        reject(err);
      }

      resolve();
    });
  });
}

/**
 * Gets the active tasks for a user. Can be used to get completed or uncompleted task.
 * @param {Number} userID User ID of the user in the database.
 * @param {Number} completed Marks whether you want completed or uncompleted tasks. Defaults to 0 (uncompleted).
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

/**
 * Gets the user's tasks for the current day.
 * @param {Number} userID User ID of the user in the database.
 * @returns An array of the tasks for the current date for the user
 */
async function getUsersTodayTasks(userID) {
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

/**
 * Inserts a new task into the database.
 * @param {Object} newTask An object with all of the new task information.
 * @returns N/A
 */
function createNewTask(newTask) {
  return new Promise(function (resolve, reject) {
    con.query("INSERT INTO task SET ?", newTask, (err) => {
      if (err) reject(err);
    });

    resolve();
  });
}

module.exports = {
  getUsersActiveTasks: getUsersActiveTasks,
  getUsersTodayTasks: getUsersTodayTasks,
  getUserTask: getUserTask,
  updateUserTask: updateUserTask,
  deleteUserTask: deleteUserTask,
  createNewTask: createNewTask,
};
