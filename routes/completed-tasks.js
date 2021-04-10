const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskModel = require("../models/task");

/* View Completed Tasks GET
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
  await taskModel.loadUsersActiveTasks(req.user.userID, 1);
  const completedTasks = taskModel.state.tasks;

  res.render("viewCompleted", {
    completedTasks: completedTasks,
  });
});

module.exports = router;
