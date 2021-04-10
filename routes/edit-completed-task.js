const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskModel = require("../models/task");
const taskTypeModel = require("../models/task-type");

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
  taskTypeModel.moveSelectedTaskToTop();
  const activeTypes = taskTypeModel.state.taskTypes;

  res.render("modals/editCompletedTask", {
    activeTypes: activeTypes,
    selectedTask: selectedTask,
  });
});

module.exports = router;
