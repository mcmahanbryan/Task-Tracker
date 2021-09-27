const taskTypeQueries = require("../data/task-type");

const state = {
  taskTypes: [],
  selectedType: {},
};

/**
 * Private function to create a task type object based on a database row.
 * @param {*} type Task Type row returned from the database.
 * @returns Task Type object.
 */
const _createTypeObject = function (type) {
  return {
    typeID: type.id,
    typeDescription: type.type_description,
    custom: type.custom,
  };
};

/**
 * Loads default task types and the active custom task types for the passed in user ID.
 * @param {*} userID User ID making the request for their task types.
 */
const loadTaskTypes = async function (userID) {
  state.taskTypes = [];
  const data = await taskTypeQueries.getTaskTypes(userID);

  data.forEach((type) => {
    const taskType = _createTypeObject(type);
    state.taskTypes.push(taskType);
  });
};

/**
 * Loads the task type and sets it to the selected type for the state.
 * @param {*} selectedTypeID Task Type ID that is set for the selected task.
 */
const loadSelectedType = function (selectedTypeID) {
  const selectedType = state.taskTypes.find(
    (type) => type.typeID === +selectedTypeID
  );

  if (!selectedType) {
    console.log("No task type found with that ID.");
    return;
  }

  state.selectedType = selectedType;
};

/**
 * Creates a new task type in the database.
 * @param {*} user_id User ID that is creating the custom task type.
 * @param {*} type_description Task Type Description that is being created.
 */
const createNewType = async function (user_id, type_description) {
  const taskType = {
    user_id,
    type_description,
  };

  await taskTypeQueries.createTaskType(taskType);
};

/**
 * Updates a task type in the database.
 * @param {*} typeID Task Type ID that is being updated.
 * @param {*} typeDescription Task Type Description that the Task Type needs to be changed to.
 */
const updateType = async function (typeID, typeDescription) {
  await taskTypeQueries.updateTaskType(typeID, typeDescription);
  state.selectedType = {};
};

/**
 * Deletes the selected task type.
 */
const deleteType = async function () {
  await taskTypeQueries.deleteTaskType(state.selectedType.typeID);
  state.selectedType = {};
};

/**
 * Moves the task's selected task type to the top of the drop-down.
 */
const moveSelectedTaskTypeToTop = function () {
  // Taking the task's existing type and moving it to the top of the list because I could not
  // find a better way to do it while loading the modal and setting the existing type as selected.
  const matchingIndex = state.taskTypes.findIndex(
    (type) => type.typeID === state.selectedType.typeID
  );
  let removedType = state.taskTypes.splice(matchingIndex, 1);
  state.taskTypes = removedType.concat(state.taskTypes);
};

/**
 * Checks the task type to validate the created type.
 * @param {*} data Type Description that has been entered to be added.
 * @returns Array with found validation errors.
 */
const isValidData = function (data) {
  const errors = [];

  state.taskTypes.forEach(type => {
    if (type.typeDescription === data) {
      errors.push(["typeDescription", "Type already created"]);
    };
  })

  return errors;
} 

module.exports = {
  state: state,
  loadTaskTypes: loadTaskTypes,
  loadSelectedType: loadSelectedType,
  createNewType: createNewType,
  updateType: updateType,
  deleteType: deleteType,
  moveSelectedTaskTypeToTop: moveSelectedTaskTypeToTop,
  isValidData: isValidData,
};
