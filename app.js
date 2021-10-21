if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");

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

// Routes
const dashboardRouter = require("./routes/dashboard");
const loginRouter = require("./routes/login");
const registerRouter = require("./routes/register");
const taskRouter = require("./routes/tasks");
const completedTasksRouter = require("./routes/completed-tasks");
const calendarRouter = require("./routes/calendar");
const taskTypesRouter = require("./routes/task-types");
const myInfoRouter = require("./routes/my-info");
const logoutRouter = require("./routes/logout");
const unauthorizedRouter = require("./routes/unauthorized");

app.use("/", loginRouter);
app.use("/register", registerRouter);
app.use("/dashboard", dashboardRouter);
app.use("/tasks", taskRouter);
app.use("/viewCompleted", completedTasksRouter);
app.use("/calendar", calendarRouter);
app.use("/taskTypes", taskTypesRouter);
app.use("/myInfo", myInfoRouter);
app.use("/logout", logoutRouter);
app.use("/unauthorized", unauthorizedRouter);

app.listen(port, () => console.log("Listening at http://localhost:" + port));
