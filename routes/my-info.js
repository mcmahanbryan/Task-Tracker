const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");
const userModel = require("../models/user");
const bcrypt = require("bcrypt");

/* My Info GET
------------------------------------------------*/
router.get("/", checkAuthentication, function (req, res) {
  const userName = req.user.userName;

  res.render("myInfo", { userName: userName });
});

/* My Info POST
------------------------------------------------*/
router.post("/updateInfo", checkAuthentication, async function (req, res) {
  const userID = req.user.userID;
  const userName = req.body.userName;
  const password = req.body.password;

  let userInfo = {
    userID: userID,
    userName: userName,
    password: password,
  };

  if (password.trim() !== "") {
    const hashedPassword = await bcrypt.hash(password, 10);
    userInfo.password = hashedPassword;
    await userModel.updateUser(userInfo, true);
  }

  if (password.trim() === "") {
    await userModel.updateUser(userInfo);
  }

  // Update the session to include the new user name, if changed.
  if (req.user.userName !== req.body.userName) {
    let updatedUser = req.user;
    updatedUser.userName = userInfo.userName;

    req.login(updatedUser, function (error) {
      if (error) console.log(error);
    });
  }

  res.redirect("../../");
});

module.exports = router;
