const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const calendarModel = require("../models/calendar");
const taskModel = require("../models/task");

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

  const htmlText = _generateCalendarHtml();

  res.render("calendar", {
    viewedMonth: calendarModel.state.viewedMonthName,
    viewedYear: calendarModel.state.viewedYear,
    viewedDays: calendarModel.state.viewedCalendarDays,
    viewedTotalDays: calendarModel.state.viewedDaysInMonth,
    //monthTasks: JSON.stringify(calendarModel.state.calendarTasks),
    htmlText: htmlText,
  });
});

/* Calender Populate Side Nav POST
------------------------------------------------*/
router.post("/populateSideNav/", checkAuthentication, async function (req, res) {
  const htmlText = _populateSideNavHtml(req.body.selectedDay)

  res.send(htmlText);
});

/* Calender Change Month POST
------------------------------------------------*/
router.post("/changeMonth", checkAuthentication, async function (req, res) {
  const currentMonth = calendarModel.state.viewedMonthName;
  const currentYear = calendarModel.state.viewedYear;

  if (req.body.direction === 'previous') {
    calendarModel.previous(currentMonth, currentYear);
  } 

  if (req.body.direction === 'next') {
    calendarModel.next(currentMonth, currentYear);
  }

  const firstDay = `${calendarModel.state.viewedYear}-${calendarModel.state.viewedMonthNumber}-01`;
  const lastDay = `${calendarModel.state.viewedYear}-${calendarModel.state.viewedMonthNumber}-${calendarModel.state.viewedDaysInMonth}`;

  await calendarModel.loadCalendarActiveTasks(
    firstDay,
    lastDay,
    req.user.userID
  );

  const tableHtml = _generateCalendarHtml();

  const htmlText = {
    tableHtml: tableHtml,
    month: calendarModel.state.viewedMonthName,
    year: calendarModel.state.viewedYear
  }

  res.send(htmlText);
});


/* Calendar Edit Task Modal POST
------------------------------------------------*/
router.post("/submitUpdatedTask", checkAuthentication, async function (req, res) {
  const newTaskInfo = {
    selectedID: req.body.selectedID,
    title: req.body.taskTitle,
    task_description: req.body.taskDescription,
    task_type: req.body.taskType,
    task_start: req.body.startDate,
    task_end: req.body.endDate,
    complete: req.body.complete,
  };

  const responseData = {
    errors: [],
    htmlText: '',
  };

  const dataErrors = taskModel.isValidData(newTaskInfo);

  if (dataErrors.flat(1).length > 0) {
    dataErrors.forEach(error => {
      responseData.errors.push(error);
    })

    res.send(responseData);
  } else {
    await taskModel.updateUserTask(newTaskInfo);
    await taskModel.loadUsersTodayTasks(req.user.userID);
  
    const firstDay = `${calendarModel.state.viewedYear}-${calendarModel.state.viewedMonthNumber}-01`;
    const lastDay = `${calendarModel.state.viewedYear}-${calendarModel.state.viewedMonthNumber}-${calendarModel.state.viewedDaysInMonth}`;
  
    await calendarModel.loadCalendarActiveTasks(
      firstDay,
      lastDay,
      req.user.userID
    );
  
    responseData.htmlText = _generateCalendarHtml();
    res.send(responseData);
  }
});


module.exports = router;


const _generateCalendarHtml = function() {
  const dayNumbers = calendarModel.state.viewedCalendarDays;
  let count = 0;
  
  let htmlText = '';

  for (let week = 1; week <= 6; week++) {
      htmlText += `<tr class="row${week} calendar-table-row">`;

      for (let day = 1; day <= 7; day++) {
          htmlText += `
            <td class="${dayNumbers[count]} calendar-cell">
              <p class="calendar-day-number">${dayNumbers[count]}</p>
          `
          if (dayNumbers[count] === ' ') {
            count++;
            continue;
          } else {
            htmlText += _generateCalendarDayTasksHtml(dayNumbers[count]);
          }
          count++;
      }

      htmlText += `</tr>`;
  }

  return htmlText;
}


const _generateCalendarDayTasksHtml = function (currentCalendarDay) {
  const viewedMonth = calendarModel.state.viewedMonthName;
  const tasks = calendarModel.state.calendarTasks;
  let count = 0;
  let htmlText = '';

  if(tasks.length === 0) {
    return '';
  }
      
  tasks.forEach((element) => { 
    if (element.taskStart <= currentCalendarDay && currentCalendarDay <= element.taskEnd) { 
      if(count < 4) {
        htmlText += `<a title="${element.taskTitle}" `;  

        if(element.taskComplete === 0) {
          htmlText += `class="calendar-task-row-active edit-modal" 
            href="/tasks/${element.taskID}/2">`;
        } else {
          htmlText += `class="calendar-task-row-complete edit-completed-modal" 
            href="./viewCompleted/${element.taskID}/2">`;
        }

        let title = '';
        title = (element.taskTitle.length > 27) ? 
          title = element.taskTitle.slice(0,27) + '...' :
          title = element.taskTitle;

        htmlText += `${title}</a>`;
                  
      } else if(count === 4) {
        htmlText += `<p title="Expand Day" class="calendar-task-overflow" 
          id="${viewedMonth} ${currentCalendarDay}">........</p>`;
      }

      count++; 
    } 
  }) 


  return htmlText;
} 

const _populateSideNavHtml = function (selectedDay) {
  const tasks = calendarModel.state.calendarTasks;
  const day = selectedDay;
  const month = calendarModel.state.viewedMonthName;
  const returnData = {"header": `${month} ${day}`, "html": ""};
  let htmlText = '';

  tasks.forEach((task) => { 
    if (task.taskStart <= day && day <= task.taskEnd) {
      let title = '';
      title = (task.taskTitle.length > 40) 
        ? title = task.taskTitle.slice(0,40) + '...' 
        : title = task.taskTitle;

      if (task.taskComplete === 0) {
        htmlText += `<tr class="today-table-row-sidenav">
          <td>
            <a href="/tasks/${task.taskID}/2" class="edit-modal-sidenav">* ${title}</a>
          </td>
          <td class="white-divider">
            <a href="/tasks/${task.taskID}/2" class="edit-modal-sidenav">${task.typeDescription}</a>
          </td>`
        ;
      } else {
        htmlText += `<tr class="today-table-row-sidenav-completed">
          <td>
            <a href="./viewCompleted/${task.taskID}/2" class="edit-completed-modal-sidenav">* ${title}</a>
          </td>
          <td class="white-divider">
            <a href="./viewCompleted/${task.taskID}/2" class="edit-completed-modal-sidenav">${task.typeDescription}</a>
          </td>`;
      }
    }
  });

  returnData.html = htmlText;
  return returnData;
}
        
