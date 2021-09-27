const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskModel = require("../models/task");
const taskTypeModel = require("../models/task-type");
const dateFormat = require("../js/date-format");


/* Tasks GET
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
  await taskModel.loadUsersActiveTasks(req.user.userID);
  const htmlText = _generateHtml(taskModel.state.tasks);

  res.render("tasks", {
    htmlText: htmlText,
  });
});


/* Add Task Modal GET
------------------------------------------------*/
router.get("/addTask", checkAuthentication, async function (req, res) {
  await taskTypeModel.loadTaskTypes(req.user.userID);
  const activeTypes = taskTypeModel.state.taskTypes;

  res.render("modals/addTask", {
    dateFormat: dateFormat,
    activeTypes: activeTypes,
    displayValidationErrors: displayValidationErrors,
  });
});

/* Add Task Modal POST
------------------------------------------------*/
router.post("/submitTask", checkAuthentication, async function (req, res) {
  const title = req.body.taskTitle;
  const taskDescription = req.body.taskDescription;
  const taskType = req.body.taskType;
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;
  const createdBy = req.user.userID;

  const taskInfo = {
    task_title: title,
    task_description: taskDescription,
    task_type_id: taskType,
    task_start: startDate,
    task_end: endDate,
    created_by: createdBy,
  };

  const responseData = {
    errors: [],
    htmlText: '',
  };

  const dataErrors = taskModel.isValidData(taskInfo);

  if (dataErrors.flat(1).length > 0) {
    dataErrors.forEach(error => {
      responseData.errors.push(error);
    })

    res.send(responseData);
  } else {
    await taskModel.createNewTask(taskInfo);
    await taskModel.loadUsersActiveTasks(req.user.userID);
    responseData.htmlText = _generateHtml(taskModel.state.tasks);

    res.send(responseData);
  }
});


/* Edit Task Modal GET
------------------------------------------------*/
router.get("/:taskID/:from", checkAuthentication, async function (req, res) {
  const selectedTaskID = req.params.taskID;
  const from = req.params.from;

  await taskModel.loadUserTask(selectedTaskID);
  const selectedTask = taskModel.state.selectedTask;
  selectedTask.from = from;

  await taskTypeModel.loadTaskTypes(req.user.userID);
  taskTypeModel.loadSelectedType(selectedTask.taskTypeID);
  taskTypeModel.moveSelectedTaskTypeToTop();
  const activeTypes = taskTypeModel.state.taskTypes;

  res.render("modals/editTask", {
    activeTypes: activeTypes,
    selectedTask: selectedTask,
  });
});

/* Edit Task Modal POST
------------------------------------------------*/
router.post("/submitUpdatedTask", checkAuthentication, async function (req, res) {
  const newTaskInfo = {
    selectedID: req.body.selectedID,
    title: req.body.taskTitle,
    task_description: req.body.taskDescription,
    task_type: req.body.taskType,
    task_start: req.body.startDate,
    task_end: req.body.endDate,
    complete: req.body.complete,
  };

  const responseData = {
    errors: [],
    htmlText: '',
  };

  const dataErrors = taskModel.isValidData(newTaskInfo);

  if (dataErrors.flat(1).length > 0) {
    dataErrors.forEach(error => {
      responseData.errors.push(error);
    })

    res.send(responseData);
  } else {
    await taskModel.updateUserTask(newTaskInfo);
    await taskModel.loadUsersActiveTasks(req.user.userID);
    responseData.htmlText = _generateHtml(taskModel.state.tasks);
  
    res.send(responseData);
  }
});

/* Delete Task Modal GET
------------------------------------------------*/
router.get("/:taskID/deleteTask/confirm", checkAuthentication, async function (req, res) {
  const selectedTaskID = req.params.taskID;
  await taskModel.loadUserTask(selectedTaskID);
  const taskInfo = taskModel.state.selectedTask;

  res.render("modals/deleteTask", { taskInfo: taskInfo });
});

/* Delete Task Modal POST
------------------------------------------------*/
router.post("/deleteTask/submit", checkAuthentication, async function (req, res) {
  const selectedTaskID = taskModel.state.selectedTask.taskID;
  await taskModel.deleteNewTask(selectedTaskID);
  await taskModel.loadUsersActiveTasks(req.user.userID);
  const htmlText = _generateHtml(taskModel.state.tasks);

  res.send(htmlText);
});

module.exports = router;


const _generateHtml = function (activeTasks) {
  let htmlText = '';

  if (activeTasks.length > 0){
    activeTasks.forEach(function(row){
    
    htmlText += `
      <tr>
        <td>${row.taskTitle}</td>
        <td>${row.taskType}</td>
        <td>${row.taskStartDisplay}</td> 
        <td>${row.taskEndDisplay}</td> 
        <td> 
          <a href="./tasks/${row.taskID}/1"
            title="Edit Task"
            class="btn btn-success btn-sm edit-modal">
            <i class="far fa-edit"></i>
            </a>
            <a href="./tasks/${row.taskID}/deleteTask/confirm"
            title="Delete Task"
            class="btn btn-danger btn-sm delete-modal">
            <i class="fas fa-trash-alt"></i>
          </a>
        </td>
      </tr>`;
    })
  } else {
    htmlText +=
      `<tr>
      <td colspan="6">No Active Tasks</td>
      </tr>`;
  }

  return htmlText;
}


const displayValidationErrors = function (errors) {
  errors.forEach(([field, text]) => {
    const errorText = document.createElement('p');
    errorText.innerText = text;
    errorText.classList.add('error-text');
    document.querySelector(`.${field}`).after(errorText);
    document.querySelector(`.${field}`).classList.add('error-border');
  })
};