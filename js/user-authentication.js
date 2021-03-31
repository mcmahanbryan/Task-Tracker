// Checks if the user is signed in or not. If they are not, we will
// redirect them to the login page.
function checkAuthentication(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("./");
  }
}

// Checks if the user is signed in or not. If they are and they to
// go to the login or register page, we redirect them to the home page.
function checkNoAuthentication(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/dashboard");
  } else {
    next();
  }
}

module.exports = {
  checkAuthentication: checkAuthentication,
  checkNoAuthentication: checkNoAuthentication,
};
