const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.SECRET); //Gives {_id,iat}
    /* Find user and check if they still have that token with them */
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error();
    }

    req.token = token; //Token we got from the header is fitted to the request body so we can delete it
    /*As we have found the user there is no need for further searching therefore we add user to req object */
    req.user = user;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please Authenticate yourself" });
  }
};
module.exports = auth;
