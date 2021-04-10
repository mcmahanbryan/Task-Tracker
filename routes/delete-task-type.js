const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskTypeModel = require("../models/task-type");

/* Delete Task Type Modal GET
------------------------------------------------*/
router.get("/:typeID", checkAuthentication, async function (req, res) {
  const selectedTypeID = req.params.typeID;
  taskTypeModel.loadSelectedType(selectedTypeID);

  const selectedType = taskTypeModel.state.selectedType;

  res.render("modals/deleteType", { typeInfo: selectedType });
});

/* Delete Task Type Modal POST
------------------------------------------------*/
router.post("/delete", checkAuthentication, async function (req, res) {
  await taskTypeModel.deleteType();

  res.redirect("../../taskTypes");
});

module.exports = router;
