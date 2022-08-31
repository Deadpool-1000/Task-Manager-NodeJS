const express = require("express");
require("./db/mongoose.js");
require("dotenv").config();

const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

//express config
const port = process.env.PORT || 3000;
const app = express();
app.use(express.json());

app.use(userRouter);
app.use(taskRouter);

//start server
app.listen(port, () => {
  console.log("Listening at port: " + port);
});
