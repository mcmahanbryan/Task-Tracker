const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskModel = require("../models/task");

/* Home Page
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
  await taskModel.loadUsersTodayTasks(req.user.userID);
  const todaysTasks = taskModel.state.tasks;

  res.render("index", {
    todaysTasks: todaysTasks,
    apiKey: process.env.OPEN_WEATHER_API,
  });
});

module.exports = router;
