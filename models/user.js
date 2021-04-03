/**
 *  Creates user object based on the data received from the database.
 * @param {Array} users An array of the user objects that comes from the database.
 * @param {String} requiredInfo Marks whether this function should return all of the user's information('all') or just the user names ('userName').
 * @returns An array of objects with all of the user's information or an array with just the user names.
 */
function createUserObjects(users, requiredInfo = "all") {
  const listOfUsers = [];

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

  return listOfUsers;
}

module.exports = {
  createUserObjects: createUserObjects,
};
