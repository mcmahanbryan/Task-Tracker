const taskQueries = require("../data/task");

const state = {
  tasks: [],
  selectedTask: {},
  paginationPage: 1,
};

/**
 * 
 * @param {*} task 
 * @returns 
 */
const _createTaskObject = function(task) {
  const userID = task.created_by ? task.created_by : null;
  const taskID = task.task_id ? task.task_id : null;
  const taskTitle = task.task_title ? task.task_title : null;
  const taskDescription = task.task_description ? task.task_description : null;
  const taskTypeID = task.task_type_id ? task.task_type_id : null;
  const taskStart = task.task_start ? task.task_start : null;
  const taskEnd = task.task_end ? task.task_end : null;
  const taskStartDisplay = task.task_start_display
    ? task.task_start_display
    : null;
  const taskEndDisplay = task.task_end_display ? task.task_end_display : null;
  const taskType = task.type_description ? task.type_description : null;
  const taskCompletedDate = task.completed_date
  ? task.completed_date
  : null;
  const completedDateDisplay = task.completed_date_display
    ? task.completed_date_display
    : null;

  return {
    userID: userID,
    taskID: taskID,
    taskTitle: taskTitle,
    taskDescription: taskDescription,
    taskTypeID: taskTypeID,
    taskStart: taskStart,
    taskEnd: taskEnd,
    taskStartDisplay: taskStartDisplay,
    taskEndDisplay: taskEndDisplay,
    taskType: taskType,
    taskCompletedDisplay: completedDateDisplay,
    taskCompletedDate: taskCompletedDate,
  };
}

/**
 * 
 * @param {*} userID 
 */
const loadUsersTodayTasks = async function (userID) {
  state.tasks = [];
  const data = await taskQueries.getUsersTodayTasks(userID);

  data.forEach((taskData) => {
    const task = _createTaskObject(taskData);
    state.tasks.push(task);
  });
};

/**
 * 
 * @param {*} userID 
 * @param {*} completed 
 */
const loadUsersActiveTasks = async function (userID, completed = 0) {
  state.tasks = [];
  const data = await taskQueries.getUsersActiveTasks(userID, completed);

  data.forEach((taskData) => {
    const task = _createTaskObject(taskData);
    state.tasks.push(task);
  });
};

/**
 * 
 * @param {*} taskID 
 * @param {*} completed 
 */
const loadUserTask = async function (taskID, completed = 0) {
  let task = {};
  const data = await taskQueries.getUserTask(+taskID, completed);
  data.forEach((taskData) => {
    task = _createTaskObject(taskData);
  });
  
  state.selectedTask = task;
};

/**
 * 
 * @param {*} taskInfo 
 */
const createNewTask = async function (taskInfo) {
  await taskQueries.createNewTask(taskInfo);
};

/**
 * 
 * @param {*} taskID 
 */
const deleteNewTask = async function (taskID) {
  await taskQueries.deleteUserTask(taskID);
  state.selectedTask = {};
};

/**
 * 
 * @param {*} taskInfo 
 */
const updateUserTask = async function (taskInfo) {
  await taskQueries.updateUserTask(taskInfo);
  state.selectedTask = {};
};

/**
 * 
 * @param {*} data 
 * @returns 
 */
const isValidData = function (data) {
  const errors = [];

  if (data.task_start > data.task_end) {
      errors.push(["startDate", "Start Date is after End Date"]);
    };

    return errors;
} 

module.exports = {
  state: state,
  loadUsersTodayTasks: loadUsersTodayTasks,
  loadUsersActiveTasks: loadUsersActiveTasks,
  loadUserTask: loadUserTask,
  createNewTask: createNewTask,
  deleteNewTask: deleteNewTask,
  updateUserTask: updateUserTask,
  isValidData: isValidData,
};
