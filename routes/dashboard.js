const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskModel = require("../models/task");

/* Home Page
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
  await taskModel.loadUsersTodayTasks(req.user.userID);
  const htmlText = _generateHtml(taskModel.state.tasks);

  res.render("index", {
    htmlText: htmlText,
  });
});

/* Home Page Edit Task Modal POST
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
    responseData.htmlText = _generateHtml(taskModel.state.tasks);
  
    res.send(responseData);
  }
});

module.exports = router;


const _generateHtml = function (todaysTasks) {
  let htmlText = '';

  if (todaysTasks.length > 0) {
    todaysTasks.forEach(row => {
      htmlText += `
        <tr
          class="today-table-row edit-modal"
          onclick='/tasks/${row.taskID}/0'
        > 
        <td>* ${row.taskTitle}</td>
        <td class="white-divider"> ${row.taskType}</td>
        <td class="white-divider"> ${row.taskEnd}</td>
      </tr>`;
    });
  } else {
    htmlText += `
      <tr>
        <td colspan="3" class="white-text">No Tasks Today</td>
      </tr>`;
  }

  return htmlText;
}