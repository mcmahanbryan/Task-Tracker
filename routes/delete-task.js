const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskModel = require("../models/task");

/* Delete Task Modal GET
------------------------------------------------*/
router.get("/:taskID", checkAuthentication, async function (req, res) {
  const selectedTaskID = req.params.taskID;
  await taskModel.loadUserTask(selectedTaskID);
  const taskInfo = taskModel.state.selectedTask;

  res.render("modals/deleteTask", { taskInfo: taskInfo });
});

/* Delete Task Modal POST
------------------------------------------------*/
router.post("/submit", checkAuthentication, async function (req, res) {
  const selectedTaskID = taskModel.state.selectedTask.taskID;
  await taskModel.deleteNewTask(selectedTaskID);

  res.redirect("../../tasks");
});

module.exports = router;
