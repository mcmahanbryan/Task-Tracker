if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const dateFormat = require("./js/date-format");

// Models
const calendarModel = require("./models/calendar");
const taskTypeModel = require("./models/task-type");
const userModel = require("./models/user");
const taskModel = require("./models/task");

//Passport setup
const initializePassport = require("./js/passport-config");
const { checkAuthentication } = require("./js/user-authentication");
const { checkNoAuthentication } = require("./js/user-authentication");

// Express Setup
const app = express();
const port = 3000;
app.use(express.static("./public/"));
app.set("view engine", "ejs");

app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Body-parser setup
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

/* Login
------------------------------------------------*/
app.get("/", checkNoAuthentication, async function (req, res) {
  await userModel.loadAllUsers();
  const foundUsers = userModel.state.users;

  initializePassport(
    passport,
    (userName) => foundUsers.find((user) => user.userName === userName),
    (id) => foundUsers.find((user) => user.userID === id)
  );

  res.render("login");
});

app.post(
  "/",
  checkNoAuthentication,
  passport.authenticate("local", {
    successRedirect: "./dashboard",
    failureRedirect: "./",
    failureFlash: true,
  })
);

/* Registration
------------------------------------------------*/
app.get("/register", checkNoAuthentication, async function (req, res) {
  res.render("./register", { error: "" });
});

app.post("/register", checkNoAuthentication, async function (req, res) {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const userName = req.body.userName;

  await userModel.loadAllUsers("userName");
  const usersList = userModel.state.users;

  if (usersList.includes(userName)) {
    res.render("./register", {
      error: "Username taken, please try another.",
    });
  } else {
    await userModel.createNewUser(userName, hashedPassword);
    res.redirect("./");
  }
});

/* Home Page
------------------------------------------------*/
app.get("/dashboard", checkAuthentication, async function (req, res) {
  await taskModel.loadUsersTodayTasks(req.user.userID);
  const todaysTasks = taskModel.state.tasks;

  res.render("index", {
    todaysTasks: todaysTasks,
    apiKey: process.env.OPEN_WEATHER_API,
  });
});

/* Tasks Page
------------------------------------------------*/
app.get("/tasks", checkAuthentication, async function (req, res) {
  await taskModel.loadUsersActiveTasks(req.user.userID);
  const activeTasks = taskModel.state.tasks;

  res.render("tasks", {
    activeTasks: activeTasks,
  });
});

/* View Completed Tasks Page
------------------------------------------------*/
app.get("/viewCompleted", checkAuthentication, async function (req, res) {
  await taskModel.loadUsersActiveTasks(req.user.userID, 1);
  const completedTasks = taskModel.state.tasks;

  res.render("viewCompleted", {
    completedTasks: completedTasks,
  });
});

/* Add Task Modal
------------------------------------------------*/
app.get("/modals/addTask", checkAuthentication, async function (req, res) {
  await taskTypeModel.loadTaskTypes(req.user.userID);
  const activeTypes = taskTypeModel.state.taskTypes;

  res.render("modals/addTask", {
    dateFormat: dateFormat,
    activeTypes: activeTypes,
  });
});

app.post("/submitTask", checkAuthentication, async function (req, res) {
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

  res.redirect("tasks");
});

/* Edit Task Modal
------------------------------------------------*/
app.get(
  "/modals/editTask/:taskID/:from",
  checkAuthentication,
  async function (req, res) {
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
  }
);

/* Edit Completed Task Modal
------------------------------------------------*/
app.get(
  "/modals/editCompletedTask/:taskID/:from",
  checkAuthentication,
  async function (req, res) {
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
  }
);

app.post("/updateTask", checkAuthentication, async function (req, res) {
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
    res.redirect("/");
  } else {
    res.redirect("tasks");
  }
});

/* Delete Task Modal
------------------------------------------------*/
app.get(
  "/modals/deleteTask/:taskID",
  checkAuthentication,
  async function (req, res) {
    const selectedTaskID = req.params.taskID;
    await taskModel.loadUserTask(selectedTaskID);
    const taskInfo = taskModel.state.selectedTask;

    res.render("modals/deleteTask", { taskInfo: taskInfo });
  }
);

app.post("/deleteTask", checkAuthentication, async function (req, res) {
  const selectedTaskID = req.body.selectedID;
  await taskModel.deleteNewTask(selectedTaskID);

  res.redirect("tasks");
});

/* Calender
------------------------------------------------*/
app.get("/calendar", checkAuthentication, async function (req, res) {
  calendarModel.loadCurrentDate();
  const firstDay = `${calendarModel.state.viewedYear}-${calendarModel.state.viewedMonthNumber}-01`;
  const lastDay = `${calendarModel.state.viewedYear}-${calendarModel.state.viewedMonthNumber}-${calendarModel.state.viewedDaysInMonth}`;

  await calendarModel.loadCalendarActiveTasks(
    firstDay,
    lastDay,
    req.user.userID
  );

  res.render("calendar", {
    viewedMonth: calendarModel.state.viewedMonthName,
    viewedYear: calendarModel.state.viewedYear,
    viewedDays: calendarModel.state.viewedCalendarDays,
    viewedTotalDays: calendarModel.state.viewedDaysInMonth,
    monthTasks: JSON.stringify(calendarModel.state.calendarTasks),
  });
});

app.post("/calendar/previous", checkAuthentication, async function (req, res) {
  const currentMonth = req.body.viewedMonth;
  const currentYear = req.body.viewedYear;

  calendarModel.previous(currentMonth, currentYear);

  const firstDay = `${calendarModel.state.viewedYear}-${calendarModel.state.viewedMonthNumber}-01`;
  const lastDay = `${calendarModel.state.viewedYear}-${calendarModel.state.viewedMonthNumber}-${calendarModel.state.viewedDaysInMonth}`;

  await calendarModel.loadCalendarActiveTasks(
    firstDay,
    lastDay,
    req.user.userID
  );

  res.render("calendar", {
    viewedMonth: calendarModel.state.viewedMonthName,
    viewedYear: calendarModel.state.viewedYear,
    viewedDays: calendarModel.state.viewedCalendarDays,
    viewedTotalDays: calendarModel.state.viewedDaysInMonth,
    monthTasks: JSON.stringify(calendarModel.state.calendarTasks),
  });
});

app.post("/calendar/next", checkAuthentication, async function (req, res) {
  const currentMonth = req.body.viewedMonth;
  const currentYear = req.body.viewedYear;

  calendarModel.next(currentMonth, currentYear);

  const firstDay = `${calendarModel.state.viewedYear}-${calendarModel.state.viewedMonthNumber}-01`;
  const lastDay = `${calendarModel.state.viewedYear}-${calendarModel.state.viewedMonthNumber}-${calendarModel.state.viewedDaysInMonth}`;

  await calendarModel.loadCalendarActiveTasks(
    firstDay,
    lastDay,
    req.user.userID
  );

  res.render("calendar", {
    viewedMonth: calendarModel.state.viewedMonthName,
    viewedYear: calendarModel.state.viewedYear,
    viewedDays: calendarModel.state.viewedCalendarDays,
    viewedTotalDays: calendarModel.state.viewedDaysInMonth,
    monthTasks: JSON.stringify(calendarModel.state.calendarTasks),
  });
});

/* My Info
------------------------------------------------*/
app.get("/myInfo", checkAuthentication, function (req, res) {
  const userName = req.user.userName;

  res.render("myInfo", { userName: userName });
});

app.post("/updateInfo", checkAuthentication, async function (req, res) {
  const userID = req.user.userID;
  const userName = req.body.userName;
  const password = req.body.password;

  let userInfo = {
    userID: userID,
    userName: userName,
    password: password,
  };

  if (password.trim() !== "") {
    const hashedPassword = await bcrypt.hash(password, 10);
    userInfo.password = hashedPassword;
    await userModel.updateUser(userInfo, true);
  }

  if (password.trim() === "") {
    await userModel.updateUser(userInfo);
  }

  // Update the session to include the new user name, if changed.
  if (req.user.userName !== req.body.userName) {
    let updatedUser = req.user;
    updatedUser.userName = userInfo.userName;
    req.login(updatedUser, function (error) {
      if (error) console.log(error);
    });
  }

  res.redirect("/");
});

/* Task Types
------------------------------------------------*/
app.get("/taskTypes", checkAuthentication, async function (req, res) {
  await taskTypeModel.loadTaskTypes(req.user.userID);

  res.render("taskTypes", { taskTypes: taskTypeModel.state.taskTypes });
});

/* Add Task Type Modal
------------------------------------------------*/
app.get("/modals/addType", checkAuthentication, function (req, res) {
  res.render("modals/addType");
});

app.post("/submitType", checkAuthentication, async function (req, res) {
  const typeDescription = req.body.typeDescription;
  const userID = req.user.userID;
  await taskTypeModel.createNewType(userID, typeDescription);

  res.redirect("taskTypes");
});

/* Edit Task Type Modal
------------------------------------------------*/
app.get("/modals/editType/:typeID", checkAuthentication, function (req, res) {
  const selectedTypeID = req.params.typeID;
  taskTypeModel.loadSelectedType(selectedTypeID);

  const selectedType = taskTypeModel.state.selectedType;

  res.render("modals/editType", { selectedType: selectedType });
});

app.post("/updateType", checkAuthentication, async function (req, res) {
  const selectedTypeID = taskTypeModel.state.selectedType.typeID;
  const typeDescription = req.body.typeDescription;

  await taskTypeModel.updateType(selectedTypeID, typeDescription);

  res.redirect("taskTypes");
});

/* Delete Task Type Modal
------------------------------------------------*/
app.get(
  "/modals/deleteType/:typeID",
  checkAuthentication,
  async function (req, res) {
    const selectedTypeID = req.params.typeID;
    taskTypeModel.loadSelectedType(selectedTypeID);

    const selectedType = taskTypeModel.state.selectedType;

    res.render("modals/deleteType", { typeInfo: selectedType });
  }
);

app.post("/deleteType", checkAuthentication, async function (req, res) {
  await taskTypeModel.deleteType();

  res.redirect("taskTypes");
});

/* Logout
------------------------------------------------*/
app.post("/logout", function (req, res) {
  req.logOut();
  res.redirect("./");
});

app.listen(port, () => console.log("Listening at http://localhost:" + port));
