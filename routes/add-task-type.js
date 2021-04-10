const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const taskTypeModel = require("../models/task-type");

/* Add Task Type Modal GET
------------------------------------------------*/
router.get("/", checkAuthentication, function (req, res) {
  res.render("modals/addType");
});

/* Add Task Type Modal POST
------------------------------------------------*/
router.post("/submitType", checkAuthentication, async function (req, res) {
  const typeDescription = req.body.typeDescription;
  const userID = req.user.userID;
  await taskTypeModel.createNewType(userID, typeDescription);

  res.redirect("../../taskTypes");
});

module.exports = router;
