const express = require("express");
const Task = require("../models/Tasks.js");
const auth = require("../middleware/auth.js");
const taskRouter = new express.Router();
const User = require("../models/User");
//Fetch all tasks
///tasks?sortedBy=createdAt_asc/desc
/* we have to break the sortby option to get the property and value  and desc=-1 & asc=1*/
taskRouter.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split("_"); //Parts is an array of strings
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  if (req.query.completed) {
    match.completed = req.query.completed === "true"; //req.query.completed returns the string "true" so we have to compare the string to true
  }
  try {
    const currUser = await User.findById(req.user._id);
    await currUser.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });
    res.status(200).send(currUser.tasks);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Fetch a task
taskRouter.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    /* Check if the task you are getting is owned by you*/
    const foundTask = await Task.findOne({
      _id,
      owner: req.user._id,
    });
    if (!foundTask) return res.status(404).send();
    res.status(200).send(foundTask);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Create a new task
taskRouter.post("/tasks", auth, async (req, res) => {
  const newTask = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await newTask.save();
    res.status(200).send(newTask);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Patch a task
taskRouter.patch("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  const updates = Object.keys(req.body);
  const validUpdate = ["description", "completed"];
  const isValidUpdate = updates.every((update) => validUpdate.includes(update));
  if (!isValidUpdate) {
    return res.status(404).send("Invalid Updates");
  }
  try {
    const task = await Task.findOne({ _id, owner: req.user._id });
    if (!task) res.status(404).send();
    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (error) {
    res.status(500).send(error);
  }
});

//delete a task
taskRouter.delete("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id,
      owner: req.user._id,
    });
    if (!deletedTask) return res.status(404).send();
    res.status(200).send(deletedTask);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = taskRouter;
