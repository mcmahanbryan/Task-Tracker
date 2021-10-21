const express = require("express");
const router = express.Router();
const { checkAuthentication } = require("../js/user-authentication");

/* Unauthorized Page
------------------------------------------------*/
router.get("/", checkAuthentication, async function (req, res) {
    res.render("unauthorized");
});

module.exports = router;