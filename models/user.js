const userQueries = require("../data/user");

const state = {
  users: [],
  foundUser: {},
};

/**
 *  Creates user object based on the data received from the database.
 * @param {Array} users An array of the user objects that comes from the database.
 * @param {String} requiredInfo Marks whether this function should return all of the user's information('all') or just the user names ('userName').
 * @returns An array of objects with all of the user's information or an array with just the user names.
 */
function _createUserObject(user, requiredInfo) {
  if (requiredInfo === "all") {
    return {
      userID: user.id,
      userName: user.user_name,
      password: user.password,
    };
  }

  if (requiredInfo === "userName") {
    return user.user_name;
  }
}

/**
 * 
 * @param {*} requiredInfo 
 */
const loadAllUsers = async function (requiredInfo = "all") {
  state.users = [];
  const data = await userQueries.getAllUsers();

  data.forEach((user) => {
    const userInfo = _createUserObject(user, requiredInfo);
    state.users.push(userInfo);
  });
};

/**
 * 
 * @param {*} userName 
 * @param {*} hashedPassword 
 */
const createNewUser = async function (userName, hashedPassword) {
  await userQueries.createUser(userName, hashedPassword);
};

/**
 * 
 * @param {*} userInfo 
 * @param {*} password 
 */
const updateUser = async function (userInfo, password) {
  await userQueries.updateUser(userInfo, password);
};

module.exports = {
  state: state,
  loadAllUsers: loadAllUsers,
  createNewUser: createNewUser,
  updateUser: updateUser,
};
