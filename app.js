if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const sqlQueries = require("./js/sql-queries");
const dateFormat = require("./js/date-format");
const calendarFunctions = require("./js/calendar-functions");

//Passport setup
const initializePassport = require("./js/passport-config");
const { checkAuthentication } = require("./js/user-authentication");
const { checkNoAuthentication } = require("./js/user-authentication");
const { getAllUsers } = require("./js/sql-queries");

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
  const foundUsers = await getAllUsers();

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

  const usersList = await getAllUsers("userName");

  if (usersList.includes(userName)) {
    res.redirect("./register");
  } else {
    await sqlQueries.createUser(userName, hashedPassword);
    res.redirect("./");
  }
});

/* Home Page
------------------------------------------------*/
app.get("/dashboard", checkAuthentication, async function (req, res) {
  const todaysTasks = await sqlQueries.getUsersTodayTasks(req.user.userID);

  res.render("index", {
    todaysTasks: todaysTasks,
    apiKey: process.env.OPEN_WEATHER_API,
  });
});

/* Tasks Page
------------------------------------------------*/
app.get("/tasks", checkAuthentication, async function (req, res) {
  const activeTasks = await sqlQueries.getUsersActiveTasks(req.user.userID);

  res.render("tasks", { dateFormat: dateFormat, activeTasks: activeTasks });
});

/* View Completed Tasks Page
------------------------------------------------*/
app.get("/viewCompleted", checkAuthentication, async function (req, res) {
  const completedTasks = await sqlQueries.getUsersActiveTasks(
    req.user.userID,
    1
  );

  res.render("viewCompleted", {
    dateFormat: dateFormat,
    completedTasks: completedTasks,
  });
});

/* Add Task Modal
------------------------------------------------*/
app.get("/modals/addTask", checkAuthentication, async function (req, res) {
  const activeTypes = await sqlQueries.getTaskTypes(req.user.userID);

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

  await sqlQueries.createNewTask(taskInfo);

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

    let activeTypes = await sqlQueries.getTaskTypes(req.user.userID);
    const selectedTask = await sqlQueries.getUserTask(selectedTaskID, from);

    // Taking the task's existing type and moving it to the top of the list because I could not
    // find a better way to do it while loading the modal and setting the existing type as selected.
    const matchingIndex = activeTypes.findIndex(
      (type) => type.typeID == selectedTask.taskTypeID
    );
    let removedType = activeTypes.splice(matchingIndex, 1);
    activeTypes = removedType.concat(activeTypes);

    res.render("modals/editTask", {
      dateFormat: dateFormat,
      activeTypes: activeTypes,
      selectedTask: selectedTask,
    });
  }
);
/*}
    );
  }
);*/

/* Edit Completed Task Modal
------------------------------------------------*/
app.get(
  "/modals/editCompletedTask/:taskID/:from",
  checkAuthentication,
  async function (req, res) {
    const selectedTaskID = req.params.taskID;
    const from = req.params.from;

    let activeTypes = await sqlQueries.getTaskTypes(req.user.userID);
    const selectedTask = await sqlQueries.getUserTask(selectedTaskID, from, 1);

    // Taking the task's existing type and moving it to the top of the list because I could not
    // find a better way to do it while loading the modal and setting the existing type as selected.
    const matchingIndex = activeTypes.findIndex(
      (type) => type.typeID == selectedTask.taskTypeID
    );
    let removedType = activeTypes.splice(matchingIndex, 1);
    activeTypes = removedType.concat(activeTypes);

    res.render("modals/editCompletedTask", {
      dateFormat: dateFormat,
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

  await sqlQueries.updateUserTask(newTaskInfo);

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

    const taskInfo = await sqlQueries.getUserTask(selectedTaskID);

    res.render("modals/deleteTask", { taskInfo: taskInfo });
  }
);

app.post("/deleteTask", checkAuthentication, async function (req, res) {
  const selectedTaskID = req.body.selectedID;

  await sqlQueries.deleteUserTask(selectedTaskID);

  res.redirect("tasks");
});

/* Calender
------------------------------------------------*/
app.get("/calendar", checkAuthentication, function (req, res) {
  const viewed = calendarFunctions.currentDate();
  const firstDay = `${viewed.year}-${viewed.monthNumber}-01`;
  const lastDay = `${viewed.year}-${viewed.monthNumber}-${viewed.lastDay}`;

  const query = sqlQueries.getCalendarActiveTasks(
    firstDay,
    lastDay,
    req.user.userID
  );

  query.then((monthTasks) => {
    res.render("calendar", {
      viewedMonth: viewed.month,
      viewedYear: viewed.year,
      viewedDays: viewed.days,
      viewedTotalDays: viewed.lastDay,
      monthTasks: JSON.stringify(monthTasks),
    });
  });
});

app.post("/calendar/previous", checkAuthentication, function (req, res) {
  const currentMonth = req.body.viewedMonth;
  const currentYear = req.body.viewedYear;
  const viewed = calendarFunctions.previous(currentMonth, currentYear);
  const firstDay = `${viewed.year}-${viewed.monthNumber}-01`;
  const lastDay = `${viewed.year}-${viewed.monthNumber}-${viewed.lastDay}`;

  const query = sqlQueries.getCalendarActiveTasks(
    firstDay,
    lastDay,
    req.user.userID
  );

  query
    .then(function (monthTasks) {
      res.render("calendar", {
        viewedMonth: viewed.month,
        viewedYear: viewed.year,
        viewedDays: viewed.days,
        viewedTotalDays: viewed.lastDay,
        monthTasks: JSON.stringify(monthTasks),
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

app.post("/calendar/next", checkAuthentication, function (req, res) {
  const currentMonth = req.body.viewedMonth;
  const currentYear = req.body.viewedYear;
  const viewed = calendarFunctions.next(currentMonth, currentYear);
  const firstDay = `${viewed.year}-${viewed.monthNumber}-01`;
  const lastDay = `${viewed.year}-${viewed.monthNumber}-${viewed.lastDay}`;

  const query = sqlQueries.getCalendarActiveTasks(
    firstDay,
    lastDay,
    req.user.userID
  );

  query
    .then(function (monthTasks) {
      res.render("calendar", {
        viewedMonth: viewed.month,
        viewedYear: viewed.year,
        viewedDays: viewed.days,
        viewedTotalDays: viewed.lastDay,
        monthTasks: JSON.stringify(monthTasks),
      });
    })
    .catch((error) => {
      console.log(error);
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
    await sqlQueries.updateUser(userInfo, true);
  }

  if (password === "") {
    await sqlQueries.updateUser(userInfo);
  }

  res.redirect("/");
});

/* Task Types
------------------------------------------------*/
app.get("/taskTypes", checkAuthentication, async function (req, res) {
  const taskTypes = await sqlQueries.getTaskTypes(req.user.userID);

  res.render("taskTypes", { taskTypes: taskTypes });
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

  await sqlQueries.createTaskType(typeInfo);

  res.redirect("taskTypes");
});

/* Edit Task Type Modal
------------------------------------------------*/
app.get(
  "/modals/editType/:typeID",
  checkAuthentication,
  async function (req, res) {
    const selectedTypeID = req.params.typeID;

    const selectedType = await sqlQueries.getTaskType(selectedTypeID);

    res.render("modals/editType", { selectedType: selectedType });
  }
);

app.post("/updateType", checkAuthentication, async function (req, res) {
  const selectedTypeID = req.body.selectedID;
  const typeDescription = req.body.typeDescription;

  await sqlQueries.updateTaskType(selectedTypeID, typeDescription);

  res.redirect("taskTypes");
});

/* Delete Task Type Modal
------------------------------------------------*/
app.get(
  "/modals/deleteType/:typeID",
  checkAuthentication,
  async function (req, res) {
    const selectedTypeID = req.params.typeID;

    const typeInfo = await sqlQueries.getTaskType(selectedTypeID);

    res.render("modals/deleteType", { typeInfo: typeInfo });
  }
);

app.post("/deleteType", checkAuthentication, async function (req, res) {
  const selectedTypeID = req.body.selectedID;

  await sqlQueries.deleteTaskType(selectedTypeID);

  res.redirect("taskTypes");
});

/* Logout
------------------------------------------------*/
app.post("/logout", function (req, res) {
  req.logOut();
  res.redirect("./");
});

app.listen(port, () => console.log("Listening at http://localhost:" + port));
