const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { checkNoAuthentication } = require("../js/user-authentication");
const userModel = require("../models/user");

/* Registration GET
------------------------------------------------*/
router.get("/", checkNoAuthentication, async function (req, res) {
  res.render("register", { error: "" });
});

/* Registration POST
------------------------------------------------*/
router.post("/", checkNoAuthentication, async function (req, res) {
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const userName = req.body.userName;

  await userModel.loadAllUsers("userName");
  const usersList = userModel.state.users;

  if (usersList.includes(userName)) {
    res.render("register", {
      error: "Username taken, please try another.",
    });
  } else {
    await userModel.createNewUser(userName, hashedPassword);
    res.redirect("./");
  }
});

module.exports = router;
