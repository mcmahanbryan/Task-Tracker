function createTypeObjects(types) {
  const taskTypes = [];

  types.forEach((type) => {
    const typeID = type.id;
    const typeDescription = type.type_description;
    const custom = type.custom;

    const typeTask = {
      typeID: typeID,
      typeDescription: typeDescription,
      custom: custom,
    };

    taskTypes.push(typeTask);
  });

  return taskTypes;
}

function moveSelectedTaskToTop(taskTypes, selectedTaskTypeID) {
  // Taking the task's existing type and moving it to the top of the list because I could not
  // find a better way to do it while loading the modal and setting the existing type as selected.
  const matchingIndex = taskTypes.findIndex(
    (type) => type.typeID == selectedTaskTypeID
  );

  let removedType = taskTypes.splice(matchingIndex, 1);

  return removedType.concat(taskTypes);
}

module.exports = {
  createTypeObjects: createTypeObjects,
  moveSelectedTaskToTop: moveSelectedTaskToTop,
};
