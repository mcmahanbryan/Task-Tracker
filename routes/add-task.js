const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskModel = require("../models/task");
const taskTypeModel = require("../models/task-type");
const dateFormat = require("../js/date-format");

/* Add Task Modal GET
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
  await taskTypeModel.loadTaskTypes(req.user.userID);
  const activeTypes = taskTypeModel.state.taskTypes;

  res.render("modals/addTask", {
    dateFormat: dateFormat,
    activeTypes: activeTypes,
  });
});

/* Add Task Modal POST
------------------------------------------------*/
router.post("/submit", checkAuthentication, async function (req, res) {
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

  await taskModel.createNewTask(taskInfo);

  res.redirect("../../tasks");
});

module.exports = router;
