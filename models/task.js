function createTaskObjects(tasks) {
  const taskArray = [];

  tasks.forEach((task) => {
    const taskID = task.task_id ? task.task_id : null;
    const taskTitle = task.task_title ? task.task_title : null;
    const taskDescription = task.task_description
      ? task.task_description
      : null;
    const taskTypeID = task.task_type_id ? task.task_type_id : null;
    const taskStart = task.task_start ? task.task_start : null;
    const taskEnd = task.task_end ? task.task_end : null;
    const taskStartDisplay = task.task_start_display
      ? task.task_start_display
      : null;
    const taskEndDisplay = task.task_end_display ? task.task_end_display : null;
    const taskType = task.type_description ? task.type_description : null;
    const completedDateDisplay = task.completed_date_display
      ? task.completed_date_display
      : null;

    const taskObject = {
      taskID: taskID,
      taskTitle: taskTitle,
      taskDescription: taskDescription,
      taskTypeID: taskTypeID,
      taskStart: taskStart,
      taskEnd: taskEnd,
      taskStartDisplay: taskStartDisplay,
      taskEndDisplay: taskEndDisplay,
      taskType: taskType,
      taskCompletedDisplay: completedDateDisplay ? completedDateDisplay : null,
    };

    taskArray.push(taskObject);
  });

  return taskArray;
}

module.exports = {
  createTaskObjects: createTaskObjects,
};
