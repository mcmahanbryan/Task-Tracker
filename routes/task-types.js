const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskTypeModel = require("../models/task-type");

/* Task Types GET
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
  await taskTypeModel.loadTaskTypes(req.user.userID);

  res.render("taskTypes", { taskTypes: taskTypeModel.state.taskTypes });
});

module.exports = router;
