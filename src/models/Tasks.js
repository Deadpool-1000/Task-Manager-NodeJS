const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    description: {
      type: "string",
      required: true,
      trim: true,
      toLowerCase: true,
    },
    completed: {
      type: "boolean",
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
