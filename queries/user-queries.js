if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const mysql = require("mysql");

// MySQL Setup
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.SQL_PASSWORD,
  database: "tasktracker",
});

con.connect((err) => {
  if (err) console.log(err);
});

/**
 * Creates a new user.
 * @param {String} userName The name of the user.
 * @param {String} password The hashed password of the user.
 * @returns N/A
 */
function createUser(userName, password) {
  return new Promise(function (resolve, reject) {
    con.query(
      "INSERT INTO user (user_name, password) VALUES (?, ?);",
      [userName, password],
      (err) => {
        if (err) {
          reject(err);
        }

        resolve();
      }
    );
  });
}

/**
 * Updates a specific user's information.
 * @param {Object} userInfo An object with all the user's information.
 * @param {Boolean} password Marks whether the user is changing their password or not. Defaults to false.
 * @returns N/A
 */
function updateUser(userInfo, password = false) {
  return new Promise(function (resolve, reject) {
    if (password) {
      con.query(
        `UPDATE user SET user_name = ?, password = ? WHERE id = ?`,
        [userInfo.userName, userInfo.password, userInfo.userID],
        (err) => {
          if (err) {
            reject(err);
          }

          resolve();
        }
      );
    }

    if (!password) {
      con.query(
        `UPDATE user SET user_name = ? WHERE id = ?`,
        [userInfo.userName, userInfo.userID],
        (err) => {
          if (err) {
            reject(err);
          }

          resolve();
        }
      );
    }
  });
}

/**
 *  Gets all active users.
 * @param {String} requiredInfo Marks whether this function should return all of the user's information('all') or just the user names ('userName').
 * @returns An array of objects with all of the user's information or an array with just the user names.
 */
const getAllUsers = async function (requiredInfo = "all") {
  return new Promise(function (resolve, reject) {
    const listOfUsers = [];
    con.query(
      "SELECT id, user_name, password FROM user WHERE active = 1",
      (err, users) => {
        if (err) reject(err);

        users.forEach((user) => {
          if (requiredInfo === "all") {
            listOfUsers.push({
              userID: user.id,
              userName: user.user_name,
              password: user.password,
            });
          }

          if (requiredInfo === "userName") {
            listOfUsers.push(user.user_name);
          }
        });
      }
    );

    resolve(listOfUsers);
  });
};

module.exports = {
  createUser: createUser,
  updateUser: updateUser,
  getAllUsers: getAllUsers,
};
