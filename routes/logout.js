const express = require("express");
const router = express.Router();

/* Logout POST
------------------------------------------------*/
router.post("/", function (req, res) {
  req.logOut();
  res.redirect("../../");
});

module.exports = router;
