const taskQueries = require("../queries/task");

const state = {
  tasks: [],
  selectedTask: {},
};

function _createTaskObject(task) {
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
  const completedDateDisplay = task.completed_date_display
    ? task.completed_date_display
    : null;

  return {
    taskID: taskID,
    taskTitle: taskTitle,
    taskDescription: taskDescription,
    taskTypeID: taskTypeID,
    taskStart: taskStart,
    taskEnd: taskEnd,
    taskStartDisplay: taskStartDisplay,
    taskEndDisplay: taskEndDisplay,
    taskType: taskType,
    taskCompletedDisplay: completedDateDisplay ? completedDateDisplay : null,
  };
}

const loadUsersTodayTasks = async function (userID) {
  state.tasks = [];
  const data = await taskQueries.getUsersTodayTasks(userID);

  data.forEach((taskData) => {
    const task = _createTaskObject(taskData);
    state.tasks.push(task);
  });
};

const loadUsersActiveTasks = async function (userID, completed = 0) {
  state.tasks = [];
  const data = await taskQueries.getUsersActiveTasks(userID, completed);

  data.forEach((taskData) => {
    const task = _createTaskObject(taskData);
    state.tasks.push(task);
  });
};

const loadUserTask = async function (taskID, completed = 0) {
  let task = {};
  const data = await taskQueries.getUserTask(+taskID, completed);
  data.forEach((taskData) => {
    task = _createTaskObject(taskData);
  });

  state.selectedTask = task;
};

const createNewTask = async function (taskInfo) {
  await taskQueries.createNewTask(taskInfo);
};

const deleteNewTask = async function (taskID) {
  await taskQueries.deleteUserTask(taskID);
};

const updateUserTask = async function (taskInfo) {
  await taskQueries.updateUserTask(taskInfo);
  state.selectedTask = {};
};

module.exports = {
  state: state,
  loadUsersTodayTasks: loadUsersTodayTasks,
  loadUsersActiveTasks: loadUsersActiveTasks,
  loadUserTask: loadUserTask,
  createNewTask: createNewTask,
  deleteNewTask: deleteNewTask,
  updateUserTask: updateUserTask,
};
