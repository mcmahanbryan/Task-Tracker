const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskModel = require("../models/task");
const taskTypeModel = require("../models/task-type");
const dateFormat = require("../js/date-format");
const pagination = require("../js/pagination");


/* Tasks GET
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
  await taskModel.loadUsersActiveTasks(req.user.userID);
  taskModel.state.paginationPage = 1;
  const paginationPage = taskModel.state.paginationPage;

  // Create pagination array
  const taskPaginationArray = pagination.createPaginationArray(taskModel.state.tasks);
  
  // Create pagination html based on the array
  const tableHtml = _generateHtml(taskPaginationArray[taskModel.state.paginationPage - 1]);
  const paginationHtml = pagination.generatePaginationHtml(taskPaginationArray, paginationPage);
  const paginationCountHtml = pagination.generatePaginationCountHtml(taskPaginationArray, paginationPage);

  res.render("tasks", {
    tableHtml: tableHtml,
    paginationHtml: paginationHtml,
    paginationCountHtml: paginationCountHtml,
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
    tableHtml: '',
    paginationHtml: '',
    paginationCountHtml: '',
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

    const paginationPage = taskModel.state.paginationPage;
    const taskPaginationArray = pagination.createPaginationArray(taskModel.state.tasks);
    
    responseData.tableHtml = _generateHtml(taskPaginationArray[taskModel.state.paginationPage - 1]);
    responseData.paginationHtml = pagination.generatePaginationHtml(taskPaginationArray, paginationPage);
    responseData.paginationCountHtml = pagination.generatePaginationCountHtml(taskPaginationArray, paginationPage);

    res.send(responseData);
  }
});


/* Edit Task Modal GET
------------------------------------------------*/
router.get("/:taskID/:from", checkAuthentication, async function (req, res) {
  const selectedTaskID = req.params.taskID;
  const from = req.params.from;

  await taskModel.loadUserTask(selectedTaskID);

  if (req.user.userID !== taskModel.state.selectedTask.userID) {
    res.redirect("/unauthorized");
    return;
  }

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
    tableHtml: '',
    paginationHtml: '',
    paginationCountHtml: '',
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

    const paginationPage = taskModel.state.paginationPage;
    const taskPaginationArray = pagination.createPaginationArray(taskModel.state.tasks);
    
    responseData.tableHtml = _generateHtml(taskPaginationArray[taskModel.state.paginationPage - 1]);
    responseData.paginationHtml = pagination.generatePaginationHtml(taskPaginationArray, paginationPage);
    responseData.paginationCountHtml = pagination.generatePaginationCountHtml(taskPaginationArray, paginationPage);
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
  await taskModel.deleteNewTask(taskModel.state.selectedTask.taskID);
  await taskModel.loadUsersActiveTasks(req.user.userID);
  const taskPaginationArray = pagination.createPaginationArray(taskModel.state.tasks);
  
  // If a deletion reduces the need of a page, it will set the current page to the last page.
  if (taskPaginationArray.length < taskModel.state.paginationPage) {
    taskModel.state.paginationPage = taskPaginationArray.length;
  }

  const paginationPage = taskModel.state.paginationPage;

  const responseData = {
    tableHtml: '',
    paginationHtml: '',
    paginationCountHtml: '',
  };
  
  responseData.tableHtml = _generateHtml(taskPaginationArray[taskModel.state.paginationPage - 1]);
  responseData.paginationHtml = pagination.generatePaginationHtml(taskPaginationArray, paginationPage);
  responseData.paginationCountHtml = pagination.generatePaginationCountHtml(taskPaginationArray, paginationPage);

  res.send(responseData);
});

/* Pagination POST
------------------------------------------------*/
router.post("/pagination", checkAuthentication, async function (req, res) {
  const clickedBtn = req.body.clickedBtn;

  if (clickedBtn === "Previous") {
    taskModel.state.paginationPage -= 1;
  } else if (clickedBtn === "Next") {
    taskModel.state.paginationPage += 1;
  } else {
    taskModel.state.paginationPage = +clickedBtn;
  }

  const paginationPage = taskModel.state.paginationPage;
  const taskPaginationArray = await pagination.createPaginationArray(taskModel.state.tasks);
  const tableHtml = await _generateHtml(taskPaginationArray[paginationPage - 1]);
  const paginationHtml = await pagination.generatePaginationHtml(taskPaginationArray, paginationPage);
  const paginationCountHtml = await pagination.generatePaginationCountHtml(taskPaginationArray, paginationPage);

  res.send({tableHtml, paginationHtml, paginationCountHtml});
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
