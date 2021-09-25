const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskTypeModel = require("../models/task-type");

/* Task Types GET
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
  await taskTypeModel.loadTaskTypes(req.user.userID);

  const htmlText = _generateHtml(taskTypeModel.state.taskTypes);

  res.render("taskTypes", { 
    htmlText: htmlText });
});

/* Add Task Type Modal GET
------------------------------------------------*/
router.get("/addType", checkAuthentication, function (req, res) {
  res.render("modals/addType");
});

/* Add Task Type Modal POST
------------------------------------------------*/
router.post("/submitType", checkAuthentication, async function (req, res) {
  const typeDescription = req.body.typeDescription;
  const userID = req.user.userID;
  const responseData = {
    errors: [],
    htmlText: '',
  };

  const dataErrors = taskTypeModel.isValidData(typeDescription);

  if (dataErrors.flat(1).length > 0) {
    dataErrors.forEach(error => {
      responseData.errors.push(error);
    })

    res.send(responseData);
  } else {
    await taskTypeModel.createNewType(userID, typeDescription);
    await taskTypeModel.loadTaskTypes(req.user.userID);
    
    responseData.htmlText = _generateHtml(taskTypeModel.state.taskTypes);
  
    res.send(responseData);
  }
});

/* Edit Task Type Modal GET
------------------------------------------------*/
router.get("/editType/:typeID", checkAuthentication, async function (req, res) {
  const selectedTypeID = req.params.typeID;
  taskTypeModel.loadSelectedType(selectedTypeID);

  const selectedType = taskTypeModel.state.selectedType;

  res.render("modals/editType", { selectedType: selectedType });
});

/* Edit Task Type Modal POST
------------------------------------------------*/
router.post("/updateType", checkAuthentication, async function (req, res) {
  const typeID = taskTypeModel.state.selectedType.typeID;
  const typeDescription = req.body.typeDescription;
  const responseData = {
    errors: [],
    htmlText: '',
  };

  const dataErrors = taskTypeModel.isValidData(typeDescription);

  if (dataErrors.flat(1).length > 0) {
    dataErrors.forEach(error => {
      responseData.errors.push(error);
    })

    res.send(responseData);
  } else {
    await taskTypeModel.updateType(typeID, typeDescription);
    await taskTypeModel.loadTaskTypes(req.user.userID);
    responseData.htmlText = _generateHtml(taskTypeModel.state.taskTypes);
  
    res.send(responseData);
  }
});

/* Delete Task Type Modal GET
------------------------------------------------*/
router.get("/deleteType/:typeID", checkAuthentication, async function (req, res) {
  const selectedTypeID = req.params.typeID;
  taskTypeModel.loadSelectedType(selectedTypeID);

  const selectedType = taskTypeModel.state.selectedType;

  res.render("modals/deleteType", { typeInfo: selectedType });
});

/* Delete Task Type Modal POST
------------------------------------------------*/
router.post("/submitDelete", checkAuthentication, async function (req, res) {
  await taskTypeModel.deleteType();
  await taskTypeModel.loadTaskTypes(req.user.userID);
  const htmlText = _generateHtml(taskTypeModel.state.taskTypes);

  res.send(htmlText);
});

module.exports = router;


/**
 * 
 * @param {*} userTaskTypes 
 * @returns 
 */
const _generateHtml = function(userTaskTypes) {
  let htmlText = '';

  if (userTaskTypes.length > 0) {
    userTaskTypes.forEach((row) => {
      htmlText += `
        <tr>
        <td>${row.typeDescription}</td>
        <td>`;
          
      if(row.custom == 1) {
        htmlText += `
          <a href="./taskTypes/editType/${row.typeID}"
            title="Edit Type"
            class="btn btn-success btn-sm edit-modal">
            <i class="far fa-edit"></i>
          </a>
          <a href="./taskTypes/deleteType/${row.typeID}"
            title="Delete Type"
            class="btn btn-danger btn-sm delete-modal">
            <i class="fas fa-trash-alt"></i>
          </a>`;
      }

      htmlText += `
          </td>
        </tr>`;

    })
  } else {
    htmlText += `
    <tr>
      <td>No active types</td>
    </tr>`;
  };

  return htmlText;
}