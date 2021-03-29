const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

function initialize(passport, getUserByUsername, getUserById) {
  const authenticateUser = async (userName, password, done) => {
    const user = await getUserByUsername(userName);
    if (user == null) {
      return done(null, false, { message: "Incorrect username or password." });
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      } else {
        return done(null, false, {
          message: "Incorrect username or password.",
        });
      }
    } catch (e) {
      return done(e);
    }
  };

  passport.use(
    new LocalStrategy({ usernameField: "userName" }, authenticateUser)
  );
  passport.serializeUser((user, done) => done(null, user.userID));
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id));
  });
}

module.exports = initialize;
