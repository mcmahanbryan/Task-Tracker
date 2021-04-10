const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const calendarModel = require("../models/calendar");

/* Calender GET
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
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

/* Calender Previous POST
------------------------------------------------*/
router.post("/previous", checkAuthentication, async function (req, res) {
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

/* Calender Next POST
------------------------------------------------*/
router.post("/next", checkAuthentication, async function (req, res) {
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

module.exports = router;
