const express = require("express");
const router = express.Router();
const passport = require("passport");
const { checkNoAuthentication } = require("../js/user-authentication");
const initializePassport = require("../js/passport-config");
const userModel = require("../models/user");

/* Login GET
------------------------------------------------*/
router.get("/", checkNoAuthentication, async function (req, res) {
  await userModel.loadAllUsers();
  const foundUsers = userModel.state.users;

  initializePassport(
    passport,
    (userName) => foundUsers.find((user) => user.userName === userName),
    (id) => foundUsers.find((user) => user.userID === id)
  );

  res.render("login");
});

/* Login POST
------------------------------------------------*/
router.post(
  "/",
  checkNoAuthentication,
  passport.authenticate("local", {
    successRedirect: "./dashboard",
    failureRedirect: "./",
    failureFlash: true,
  })
);

module.exports = router;
