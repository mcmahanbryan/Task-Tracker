const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskModel = require("../models/task");
const taskTypeModel = require("../models/task-type");

/* View Completed Tasks GET
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
  await taskModel.loadUsersActiveTasks(req.user.userID, 1);
  const htmlText = _generateHtml(taskModel.state.tasks);

  res.render("viewCompleted", {
    htmlText: htmlText,
  });
});

/* Edit Completed Task Modal GET
------------------------------------------------*/
router.get("/:taskID/:from", checkAuthentication, async function (req, res) {
  const selectedTaskID = req.params.taskID;
  const from = req.params.from;

  await taskModel.loadUserTask(selectedTaskID, 1);
  const selectedTask = taskModel.state.selectedTask;
  selectedTask.from = from;

  await taskTypeModel.loadTaskTypes(req.user.userID);
  taskTypeModel.loadSelectedType(selectedTask.taskTypeID);
  taskTypeModel.moveSelectedTaskTypeToTop();
  const activeTypes = taskTypeModel.state.taskTypes;

  res.render("modals/editCompletedTask", {
    activeTypes: activeTypes,
    selectedTask: selectedTask,
  });
});

module.exports = router;


const _generateHtml = function (completedTasks) {
  let htmlText = '';

  if (completedTasks.length > 0){
    completedTasks.forEach(function(row){
    
    htmlText += `
      <tr>
          <td>${row.taskTitle}</td>
          <td>${row.taskType}</td>
          <td>${row.taskStartDisplay}</td> 
          <td>${row.taskEndDisplay}</td>
          <td>${row.taskCompletedDisplay}</td> 
          <td><a href="./viewCompleted/${row.taskID}/1"
              title="View Completed Task"
              class="btn btn-success btn-sm edit-completed-modal">
              <i class="far fa-edit"></i>
              </a>
          </td>
      </tr>`
  })} else {
    htmlText += `
    <tr>
      <td colspan="6" class="white-text">No Completed Tasks</td>
    </tr>`
  }

  return htmlText;
}