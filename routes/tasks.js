const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskModel = require("../models/task");

/* Tasks GET
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
  await taskModel.loadUsersActiveTasks(req.user.userID);
  const activeTasks = taskModel.state.tasks;

  res.render("tasks", {
    activeTasks: activeTasks,
  });
});

module.exports = router;
