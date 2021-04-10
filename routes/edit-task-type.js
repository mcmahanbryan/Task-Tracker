const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskTypeModel = require("../models/task-type");

/* Edit Task Type Modal GET
------------------------------------------------*/
router.get("/:typeID", checkAuthentication, async function (req, res) {
  const selectedTypeID = req.params.typeID;
  taskTypeModel.loadSelectedType(selectedTypeID);

  const selectedType = taskTypeModel.state.selectedType;

  res.render("modals/editType", { selectedType: selectedType });
});

/* Edit Task Type Modal POST
------------------------------------------------*/
router.post("/updateType", checkAuthentication, async function (req, res) {
  const selectedTypeID = taskTypeModel.state.selectedType.typeID;
  const typeDescription = req.body.typeDescription;

  await taskTypeModel.updateType(selectedTypeID, typeDescription);

  res.redirect("../../taskTypes");
});

module.exports = router;
