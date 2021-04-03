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

// SQL Query Files
const calendarQueries = require("./queries/calendar");
const taskQueries = require("./queries/task");
const taskTypeQueries = require("./queries/task-type");
const userQueries = require("./queries/user");

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
  res.render("login");
  const data = await userQueries.getAllUsers();
  const foundUsers = userModel.createUserObjects(data);

  initializePassport(
    passport,
    (userName) => foundUsers.find((user) => user.userName === userName),
    (id) => foundUsers.find((user) => user.userID === id)
  );
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
  res.render("./register");
});

app.post("/register", checkNoAuthentication, async function (req, res) {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const userName = req.body.userName;

  const data = await userQueries.getAllUsers();
  const usersList = userModel.createUserObjects(data, "userName");

  if (usersList.includes(userName)) {
    res.redirect("./register");
  } else {
    await userQueries.createUser(userName, hashedPassword);
    res.redirect("./");
  }
});

/* Home Page
------------------------------------------------*/
app.get("/dashboard", checkAuthentication, async function (req, res) {
  const data = await taskQueries.getUsersTodayTasks(req.user.userID);
  const todaysTasks = taskModel.createTaskObjects(data);

  res.render("index", {
    todaysTasks: todaysTasks,
    apiKey: process.env.OPEN_WEATHER_API,
  });
});

/* Tasks Page
------------------------------------------------*/
app.get("/tasks", checkAuthentication, async function (req, res) {
  const data = await taskQueries.getUsersActiveTasks(req.user.userID);
  const activeTasks = taskModel.createTaskObjects(data);

  res.render("tasks", {
    activeTasks: activeTasks,
  });
});

/* View Completed Tasks Page
------------------------------------------------*/
app.get("/viewCompleted", checkAuthentication, async function (req, res) {
  const data = await taskQueries.getUsersActiveTasks(req.user.userID, 1);
  const completedTasks = taskModel.createTaskObjects(data);

  res.render("viewCompleted", {
    completedTasks: completedTasks,
  });
});

/* Add Task Modal
------------------------------------------------*/
app.get("/modals/addTask", checkAuthentication, async function (req, res) {
  const data = await taskTypeQueries.getTaskTypes(req.user.userID);
  const activeTypes = taskTypeModel.createTypeObjects(data);

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

  taskInfo = {
    task_title: title,
    task_description: taskDescription,
    task_type_id: taskType,
    task_start: startDate,
    task_end: endDate,
    created_by: createdBy,
  };

  await taskQueries.createNewTask(taskInfo);

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

    const typeData = await taskTypeQueries.getTaskTypes(req.user.userID);
    const activeTypes = taskTypeModel.createTypeObjects(typeData);
    const taskData = await taskQueries.getUserTask(selectedTaskID);
    const selectedTask = taskModel.createTaskObjects(taskData)[0];
    selectedTask.from = from;

    const typesList = taskTypeModel.moveSelectedTaskToTop(
      activeTypes,
      selectedTask.taskTypeID
    );

    res.render("modals/editTask", {
      activeTypes: typesList,
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

    const typeData = await taskTypeQueries.getTaskTypes(req.user.userID);
    const activeTypes = taskTypeModel.createTypeObjects(typeData);
    const taskData = await taskQueries.getUserTask(selectedTaskID, 1);
    const selectedTask = taskModel.createTaskObjects(taskData)[0];
    selectedTask.from = from;

    const typesList = taskTypeModel.moveSelectedTaskToTop(
      activeTypes,
      selectedTask.taskTypeID
    );

    res.render("modals/editCompletedTask", {
      activeTypes: typesList,
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

  await taskQueries.updateUserTask(newTaskInfo);

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

    const data = await taskQueries.getUserTask(selectedTaskID);
    const taskInfo = taskModel.createTaskObjects(data)[0];

    res.render("modals/deleteTask", { taskInfo: taskInfo });
  }
);

app.post("/deleteTask", checkAuthentication, async function (req, res) {
  const selectedTaskID = req.body.selectedID;

  await taskQueries.deleteUserTask(selectedTaskID);

  res.redirect("tasks");
});

/* Calender
------------------------------------------------*/
app.get("/calendar", checkAuthentication, async function (req, res) {
  const viewed = calendarModel.currentDate();
  const firstDay = `${viewed.year}-${viewed.monthNumber}-01`;
  const lastDay = `${viewed.year}-${viewed.monthNumber}-${viewed.lastDay}`;

  const data = await calendarQueries.getCalendarActiveTasks(
    firstDay,
    lastDay,
    req.user.userID
  );

  const monthTasks = calendarModel.getCalendarMonthTasks(
    firstDay,
    lastDay,
    data
  );

  res.render("calendar", {
    viewedMonth: viewed.month,
    viewedYear: viewed.year,
    viewedDays: viewed.days,
    viewedTotalDays: viewed.lastDay,
    monthTasks: JSON.stringify(monthTasks),
  });
});

app.post("/calendar/previous", checkAuthentication, async function (req, res) {
  const currentMonth = req.body.viewedMonth;
  const currentYear = req.body.viewedYear;
  const viewed = calendarModel.previous(currentMonth, currentYear);
  const firstDay = `${viewed.year}-${viewed.monthNumber}-01`;
  const lastDay = `${viewed.year}-${viewed.monthNumber}-${viewed.lastDay}`;

  const data = await calendarQueries.getCalendarActiveTasks(
    firstDay,
    lastDay,
    req.user.userID
  );

  const monthTasks = calendarModel.getCalendarMonthTasks(
    firstDay,
    lastDay,
    data
  );

  res.render("calendar", {
    viewedMonth: viewed.month,
    viewedYear: viewed.year,
    viewedDays: viewed.days,
    viewedTotalDays: viewed.lastDay,
    monthTasks: JSON.stringify(monthTasks),
  });
});

app.post("/calendar/next", checkAuthentication, async function (req, res) {
  const currentMonth = req.body.viewedMonth;
  const currentYear = req.body.viewedYear;
  const viewed = calendarModel.next(currentMonth, currentYear);
  const firstDay = `${viewed.year}-${viewed.monthNumber}-01`;
  const lastDay = `${viewed.year}-${viewed.monthNumber}-${viewed.lastDay}`;

  const data = await calendarQueries.getCalendarActiveTasks(
    firstDay,
    lastDay,
    req.user.userID
  );

  const monthTasks = calendarModel.getCalendarMonthTasks(
    firstDay,
    lastDay,
    data
  );

  res.render("calendar", {
    viewedMonth: viewed.month,
    viewedYear: viewed.year,
    viewedDays: viewed.days,
    viewedTotalDays: viewed.lastDay,
    monthTasks: JSON.stringify(monthTasks),
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

  if (password !== "") {
    const hashedPassword = await bcrypt.hash(password, 10);
    userInfo.password = hashedPassword;
    await userQueries.updateUser(userInfo, true);
  }

  if (password === "") {
    await userQueries.updateUser(userInfo);
  }

  res.redirect("/");
});

/* Task Types
------------------------------------------------*/
app.get("/taskTypes", checkAuthentication, async function (req, res) {
  const data = await taskTypeQueries.getTaskTypes(req.user.userID);
  const activeTypes = taskTypeModel.createTypeObjects(data);

  res.render("taskTypes", { taskTypes: activeTypes });
});

/* Add Task Type Modal
------------------------------------------------*/
app.get("/modals/addType", checkAuthentication, function (req, res) {
  res.render("modals/addType");
});

app.post("/submitType", checkAuthentication, async function (req, res) {
  const type_description = req.body.typeDescription;
  const user_id = req.user.userID;

  const typeInfo = {
    type_description: type_description,
    user_id: user_id,
  };

  await taskTypeQueries.createTaskType(typeInfo);

  res.redirect("taskTypes");
});

/* Edit Task Type Modal
------------------------------------------------*/
app.get(
  "/modals/editType/:typeID",
  checkAuthentication,
  async function (req, res) {
    const selectedTypeID = req.params.typeID;

    const data = await taskTypeQueries.getTaskTypes(req.user.userID);
    const selectedType = data.find((type) => type.id === +selectedTypeID);

    res.render("modals/editType", { selectedType: selectedType });
  }
);

app.post("/updateType", checkAuthentication, async function (req, res) {
  const selectedTypeID = req.body.selectedID;
  const typeDescription = req.body.typeDescription;

  await taskTypeQueries.updateTaskType(selectedTypeID, typeDescription);

  res.redirect("taskTypes");
});

/* Delete Task Type Modal
------------------------------------------------*/
app.get(
  "/modals/deleteType/:typeID",
  checkAuthentication,
  async function (req, res) {
    const selectedTypeID = req.params.typeID;

    const data = await taskTypeQueries.getTaskTypes(req.user.userID);
    const typeInfo = data.find((type) => type.id === +selectedTypeID);

    res.render("modals/deleteType", { typeInfo: typeInfo });
  }
);

app.post("/deleteType", checkAuthentication, async function (req, res) {
  const selectedTypeID = req.body.selectedID;

  await taskTypeQueries.deleteTaskType(selectedTypeID);

  res.redirect("taskTypes");
});

/* Logout
------------------------------------------------*/
app.post("/logout", function (req, res) {
  req.logOut();
  res.redirect("./");
});

app.listen(port, () => console.log("Listening at http://localhost:" + port));
