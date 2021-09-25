const taskTypeQueries = require("../queries/task-type");

const state = {
  taskTypes: [],
  selectedType: {},
};


/**
 * 
 * @param {*} type 
 * @returns 
 */
const _createTypeObject = function (type) {
  return {
    typeID: type.id,
    typeDescription: type.type_description,
    custom: type.custom,
  };
};

/**
 * 
 * @param {*} userID 
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
 * 
 * @param {*} selectedTypeID 
 * @returns 
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
 * 
 * @param {*} user_id 
 * @param {*} type_description 
 */
const createNewType = async function (user_id, type_description) {
  const taskType = {
    user_id,
    type_description,
  };

  await taskTypeQueries.createTaskType(taskType);
};

/**
 * 
 * @param {*} typeID 
 * @param {*} typeDescription 
 */
const updateType = async function (typeID, typeDescription) {
  await taskTypeQueries.updateTaskType(typeID, typeDescription);
  state.selectedType = {};
};

/**
 * 
 */
const deleteType = async function () {
  await taskTypeQueries.deleteTaskType(state.selectedType.typeID);
  state.selectedType = {};
};

/**
 * 
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
 * 
 * @param {*} data 
 * @returns 
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
