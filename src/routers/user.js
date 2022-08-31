const express = require("express");
const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth.js");
const multer = require("multer");
const sharp = require("sharp");
//Router
const userRouter = new express.Router();

//multer config
const uploads = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Only images are allowed"));
    }
    cb(undefined, true);
  },
});

//Create a new User
userRouter.post("/users", async (req, res) => {
  const newUser = new User(req.body);
  try {
    await newUser.save();
    const token = await newUser.generateAuthToken();
    res.status(201).send({ newUser, token }); //PReviously send {newUser,token}
  } catch (error) {
    res.status(500).send(error);
  }
});

//fetching your profile
userRouter.get("/users/me", auth, async (req, res) => {
  /*Sends the user we found in the express middleware auth */
  res.send(req.user);
});

//Patch User
userRouter.patch("/users/me", auth, async (req, res) => {
  const _id = req.user._id;
  //Update keys like name,pwd,email what client has decided
  const updates = Object.keys(req.body);
  const validUpdate = ["name", "email", "password", "age"];

  //Basic check to find any unnecessary update key like weight,height that is not in the schema
  const isValidUpdate = updates.every((update) => validUpdate.includes(update));
  if (!isValidUpdate) {
    return res.status(404).send("Invalid updates");
  }
  try {
    /*below line bypasses the schema middleware we created to hash password therefore we need to manually update the user*/
    // const foundUser= await User.findByIdAndUpdate(_id,req.body,{new:true,runValidators:true});
    // const foundUser= await User.findById(_id);
    updates.forEach((update) => {
      req.user[update] = req.body[update];
    });
    await req.user.save();
    res.status(200).send(req.user);
  } catch (error) {
    res.status(500).send(error);
  }
});

//delete a User
userRouter.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.status(200).send(req.user);
  } catch (error) {
    res.status(500).send(error);
  }
});

//Logging in user
userRouter.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (err) {
    res.status(404).send();
  }
});

//Logging out a user
userRouter.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token; //filtering out all the unused token
    });
    await req.user.save();
    res.status(200).send("You have successfully logged out!");
  } catch (e) {
    res.status(500).send("Error in logging out!");
  }
});

//Logout from all devices
/*Basically wiping out the whole token array*/
userRouter.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.status(200).send("You have successfully logged out from all devices");
  } catch (e) {
    res.status(500).send("Error could not logout from all devices");
  }
});

userRouter.post(
  "/users/me/avatar",
  [auth, uploads.single("avatar")],
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send("hello");
  },
  (err, req, res, next) => {
    res.status(400).send({ error: err.message });
  }
);

userRouter.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.status(200).send("Successfully deleted your avatar");
});

userRouter.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error("Avatar does not exist");
    }
    res.set("content-type", "image/png");
    res.send(user.avatar);
  } catch (error) {
    res.status(404).send(error.message);
  }
});

module.exports = userRouter;
