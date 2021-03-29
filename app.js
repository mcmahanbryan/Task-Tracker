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
const dateFormat = require("./js/dateFormat");
const calendarFunctions = require("./js/calendarFunctions");

//Passport setup
const initializePassport = require("./js/passport-config");
const { checkAuthentication } = require("./js/userAuthentication");
const { checkNoAuthentication } = require("./js/userAuthentication");
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

// MySQL Setup
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.SQL_PASSWORD,
  database: "tasktracker",
});
con.connect((err) => {
  if (err) console.log(err);
  console.log("Connected!");
});

// Body-parser setup
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// GLobal variables
const usersList = [];

con.query("SELECT user_name FROM user WHERE active = 1", (err, users) => {
  if (err) console.log(err);

  users.forEach((user) => {
    usersList.push(user.userName);
  });
});

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
app.get("/register", checkNoAuthentication, function (req, res) {
  res.render("./register");
});

app.post("/register", checkNoAuthentication, async function (req, res) {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const userName = req.body.userName;

    if (usersList.includes(userName)) {
      res.redirect("./register");
    } else {
      con.query(
        "INSERT INTO user (user_name, password) VALUES (?, ?);",
        [userName, hashedPassword],
        (err) => {
          if (err) console.log(err);
        }
      );

      res.redirect("./");
    }
  } catch {
    res.redirect("./register");
  }
});

/* Home Page
------------------------------------------------*/
app.get("/dashboard", checkAuthentication, function (req, res) {
  const query = sqlQueries.getUsersTodayTasks(req.user.userID);

  const apiKey = process.env.OPEN_WEATHER_API;

  query
    .then(function (todaysTasks) {
      res.render("index", { todaysTasks: todaysTasks, apiKey: apiKey });
    })
    .catch((error) => {
      console.log(error);
    });
});

/* Tasks Page
------------------------------------------------*/
app.get("/tasks", checkAuthentication, function (req, res) {
  const query = sqlQueries.getUsersActiveTasks(req.user.userID);

  query
    .then(function (activeTasks) {
      res.render("tasks", { dateFormat: dateFormat, activeTasks: activeTasks });
    })
    .catch((error) => {
      console.log(error);
    });
});

/* View Completed Tasks Page
------------------------------------------------*/
app.get("/viewCompleted", checkAuthentication, function (req, res) {
  let query = sqlQueries.getUsersActiveTasks(req.user.userID, 1);

  query
    .then(function (completedTasks) {
      res.render("viewCompleted", {
        dateFormat: dateFormat,
        completedTasks: completedTasks,
      });
    })
    .catch((error) => {
      console.log(error);
    });
});

/* Add Task Modal
------------------------------------------------*/
app.get("/modals/addTask", checkAuthentication, function (req, res) {
  const activeTypes = new Array();

  con.query(
    "SELECT id as type_id, type_description FROM task_type WHERE active = 1 ORDER BY type_description asc",
    (err, types) => {
      if (err) {
        console.log(err);
      }

      types.forEach((type) => {
        const type_id = type.type_id;
        const type_description = type.type_description;

        typeInfo = {
          typeID: type_id,
          typeDescription: type_description,
        };

        activeTypes.push(typeInfo);
      });

      res.render("modals/addTask", {
        dateFormat: dateFormat,
        activeTypes: activeTypes,
      });
    }
  );
});

app.post("/submitTask", checkAuthentication, function (req, res) {
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

  con.query("INSERT INTO task SET ?", taskInfo, (err) => {
    if (err) console.log(err);
  });

  res.redirect("tasks");
});

/* Edit Task Modal
------------------------------------------------*/
app.get(
  "/modals/editTask/:taskID/:from",
  checkAuthentication,
  function (req, res) {
    let activeTypes = new Array();
    const selectedTaskID = req.params.taskID;
    const from = req.params.from;

    con.query(
      "SELECT id as type_id, type_description FROM task_type WHERE active = 1 ORDER BY type_description asc",
      (err, types) => {
        if (err) {
          console.log(err);
        }

        types.forEach((type) => {
          const type_id = type.type_id;
          const type_description = type.type_description;

          typeInfo = {
            typeID: type_id,
            typeDescription: type_description,
          };

          activeTypes.push(typeInfo);
        });

        let selectedTask = {};

        con.query(
          `SELECT id as task_id, task_title, task_description, task_type_id, DATE_FORMAT(task_start, "%Y-%m-%d") 
    as task_start, DATE_FORMAT(task_end, "%Y-%m-%d") as task_end
    FROM task WHERE id = ?`,
          selectedTaskID,
          (err, tasks) => {
            if (err) {
              console.log(err);
            }

            tasks.forEach((task) => {
              const task_id = task.task_id;
              const task_title = task.task_title;
              const task_description = task.task_description;
              const task_type_id = task.task_type_id;
              const task_start = task.task_start;
              const task_end = task.task_end;

              selectedTask = {
                taskID: task_id,
                taskTitle: task_title,
                taskDescription: task_description,
                taskTypeID: task_type_id,
                taskStart: task_start,
                taskEnd: task_end,
                taskStart: task_start,
                taskEnd: task_end,
                selectedTaskType: task_type_id,
                from: from,
              };
            });

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
      }
    );
  }
);

/* Edit Completed Task Modal
------------------------------------------------*/
app.get(
  "/modals/editCompletedTask/:taskID/:from",
  checkAuthentication,
  function (req, res) {
    let activeTypes = new Array();
    const selectedTaskID = req.params.taskID;
    const from = req.params.from;

    con.query(
      "SELECT id as type_id, type_description FROM task_type WHERE active = 1 ORDER BY type_description asc",
      (err, types) => {
        if (err) {
          console.log(err);
        }

        types.forEach((type) => {
          const type_id = type.type_id;
          const type_description = type.type_description;

          typeInfo = {
            typeID: type_id,
            typeDescription: type_description,
          };

          activeTypes.push(typeInfo);
        });

        let selectedTask = {};

        con.query(
          `SELECT id as task_id, task_title, task_description, task_type_id, DATE_FORMAT(task_start, "%Y-%m-%d") 
    as task_start, DATE_FORMAT(task_end, "%Y-%m-%d") as task_end, DATE_FORMAT(completed_date, "%Y-%m-%d") as completed_date
    FROM task WHERE id = ?`,
          selectedTaskID,
          (err, tasks) => {
            if (err) {
              console.log(err);
            }

            tasks.forEach((task) => {
              const task_id = task.task_id;
              const task_title = task.task_title;
              const task_description = task.task_description;
              const task_type_id = task.task_type_id;
              const task_start = task.task_start;
              const task_end = task.task_end;
              const completed_date = task.completed_date;

              selectedTask = {
                taskID: task_id,
                taskTitle: task_title,
                taskDescription: task_description,
                taskTypeID: task_type_id,
                taskStart: task_start,
                taskEnd: task_end,
                taskStart: task_start,
                taskEnd: task_end,
                completedDate: completed_date,
                selectedTaskType: task_type_id,
                from: from,
              };
            });

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
      }
    );
  }
);

app.post("/updateTask", checkAuthentication, function (req, res) {
  const selectedID = req.body.selectedID;
  const title = req.body.taskTitle;
  const taskDescription = req.body.taskDescription;
  const taskType = req.body.taskType;
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;
  const from = req.body.from;

  if (req.body.hasOwnProperty("complete")) {
    con.query(
      "UPDATE task SET complete = 1, completed_date = now() WHERE id = ?",
      selectedID,
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
  } else {
    con.query(
      "UPDATE task SET task_title = ?,  task_description = ?, task_type_id = ?, task_start = ?, task_end = ? WHERE id = ?",
      [title, taskDescription, taskType, startDate, endDate, selectedID],
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }

  // From will be set by the url parameter, it will be 0 if the modal was opened from Home, 1 if it was opened from Tasks.
  if (from === 0) {
    res.redirect("/");
  } else {
    res.redirect("tasks");
  }
});

/* Delete Task Modal
------------------------------------------------*/
app.get("/modals/deleteTask/:taskID", checkAuthentication, function (req, res) {
  const selectedTaskID = req.params.taskID;

  let taskInfo = {};

  con.query(
    `SELECT id AS task_id, task_title FROM task WHERE id = ?`,
    selectedTaskID,
    (err, tasks) => {
      if (err) {
        console.log(err);
      }

      tasks.forEach((task) => {
        const task_id = task.task_id;
        const title = task.task_title;

        taskInfo = {
          taskID: task_id,
          taskTitle: title,
        };
      });

      res.render("modals/deleteTask", { taskInfo: taskInfo });
    }
  );
});

app.post("/deleteTask", checkAuthentication, function (req, res) {
  const selectedTaskID = req.body.selectedID;

  con.query(
    `UPDATE task SET active = 0 WHERE id = ?`,
    selectedTaskID,
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );

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

  if (password != "") {
    const hashedPassword = await bcrypt.hash(password, 10);
    con.query(
      `UPDATE user SET user_name = ?, password = ? WHERE id = ?`,
      [userName, hashedPassword, userID],
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );

    res.redirect("/");
  } else {
    con.query(
      `UPDATE user SET user_name = ? WHERE id = ?`,
      [userName, userID],
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );

    res.redirect("/");
  }
});

/* Task Types
------------------------------------------------*/
app.get("/taskTypes", checkAuthentication, function (req, res) {
  const query = sqlQueries.getTaskTypes(req.user.userID);

  query
    .then(function (taskTypes) {
      res.render("taskTypes", { taskTypes: taskTypes });
    })
    .catch((error) => {
      console.log(error);
    });
});

/* Add Task Type Modal
------------------------------------------------*/
app.get("/modals/addType", checkAuthentication, function (req, res) {
  res.render("modals/addType");
});

app.post("/submitType", checkAuthentication, function (req, res) {
  const type_description = req.body.typeDescription;
  const user_id = req.user.userID;

  typeInfo = {
    type_description: type_description,
    user_id: user_id,
  };

  con.query("INSERT INTO task_type SET ?", typeInfo, (err) => {
    if (err) console.log(err);
  });

  res.redirect("taskTypes");
});

/* Edit Task Type Modal
------------------------------------------------*/
app.get("/modals/editType/:typeID", checkAuthentication, function (req, res) {
  const selectedTypeID = req.params.typeID;

  let selectedType = {};

  con.query(
    "SELECT type_description FROM task_type WHERE id = ?",
    selectedTypeID,
    (err, type) => {
      if (err) {
        console.log(err);
      }

      const typeDescription = type[0].type_description;

      selectedType = {
        typeID: selectedTypeID,
        typeDescription: typeDescription,
      };

      res.render("modals/editType", { selectedType: selectedType });
    }
  );
});

app.post("/updateType", checkAuthentication, function (req, res) {
  const selectedTypeID = req.body.selectedID;
  const typeDescription = req.body.typeDescription;

  con.query(
    "UPDATE task_type SET type_description = ? WHERE id = ?",
    [typeDescription, selectedTypeID],
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );

  res.redirect("taskTypes");
});

/* Delete Task Type Modal
------------------------------------------------*/
app.get("/modals/deleteType/:typeID", checkAuthentication, function (req, res) {
  const selectedTypeID = req.params.typeID;

  let typeInfo = {};

  con.query(
    `SELECT * FROM task_type WHERE id = ?`,
    selectedTypeID,
    (err, type) => {
      if (err) {
        console.log(err);
      }

      typeInfo = {
        typeID: selectedTypeID,
        typeDescription: type[0].type_description,
      };

      res.render("modals/deleteType", { typeInfo: typeInfo });
    }
  );
});

app.post("/deleteType", checkAuthentication, function (req, res) {
  const selectedTypeID = req.body.selectedID;

  con.query(
    `UPDATE task_type SET active = 0 WHERE id = ?`,
    selectedTypeID,
    (err) => {
      if (err) {
        console.log(err);
      }
    }
  );

  res.redirect("taskTypes");
});

/* Logout
------------------------------------------------*/
app.post("/logout", function (req, res) {
  req.logOut();
  res.redirect("./");
});

app.listen(port, () => console.log("Listening at http://localhost:" + port));
