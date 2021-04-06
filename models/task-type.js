const taskTypeQueries = require("../queries/task-type");

const state = {
  taskTypes: [],
  selectedType: {},
};

const _createTypeObject = function (type) {
  return {
    typeID: type.id,
    typeDescription: type.type_description,
    custom: type.custom,
  };
};

const loadTaskTypes = async function (userID) {
  state.taskTypes = [];
  const data = await taskTypeQueries.getTaskTypes(userID);

  data.forEach((type) => {
    const taskType = _createTypeObject(type);
    state.taskTypes.push(taskType);
  });
};

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

const createNewType = async function (user_id, type_description) {
  const taskType = {
    user_id,
    type_description,
  };

  await taskTypeQueries.createTaskType(taskType);
};

const updateType = async function (typeID, typeDescription) {
  await taskTypeQueries.updateTaskType(typeID, typeDescription);
  state.selectedType = {};
};

const deleteType = async function () {
  await taskTypeQueries.deleteTaskType(state.selectedType.typeID);
};

const moveSelectedTaskToTop = function () {
  // Taking the task's existing type and moving it to the top of the list because I could not
  // find a better way to do it while loading the modal and setting the existing type as selected.
  const matchingIndex = state.taskTypes.findIndex(
    (type) => type.typeID === state.selectedType.typeID
  );
  let removedType = state.taskTypes.splice(matchingIndex, 1);
  state.taskTypes = removedType.concat(state.taskTypes);
};

module.exports = {
  state: state,
  loadTaskTypes: loadTaskTypes,
  loadSelectedType: loadSelectedType,
  createNewType: createNewType,
  updateType: updateType,
  deleteType: deleteType,
  moveSelectedTaskToTop: moveSelectedTaskToTop,
};
