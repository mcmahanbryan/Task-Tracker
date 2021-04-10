const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskModel = require("../models/task");
const taskTypeModel = require("../models/task-type");

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
  taskTypeModel.moveSelectedTaskToTop();
  const activeTypes = taskTypeModel.state.taskTypes;

  res.render("modals/editTask", {
    activeTypes: activeTypes,
    selectedTask: selectedTask,
  });
});

/* Edit Task Modal POST
------------------------------------------------*/
router.post("/submit", checkAuthentication, async function (req, res) {
  const newTaskInfo = {
    selectedID: req.body.selectedID,
    title: req.body.taskTitle,
    taskDescription: req.body.taskDescription,
    taskType: req.body.taskType,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    complete: req.body.hasOwnProperty("complete") ? 1 : 0,
  };

  const from = +req.body.from;

  await taskModel.updateUserTask(newTaskInfo);

  // From will be set by the url parameter, it will be 0 if the modal was opened from Home, 1 if it was opened from Tasks.
  if (from === 0) {
    res.redirect("../../dashboard");
  } else {
    res.redirect("../../tasks");
  }
});

module.exports = router;
