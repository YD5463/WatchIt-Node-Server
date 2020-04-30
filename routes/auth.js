const Joi = require("joi");
const bcrypt = require("bcrypt");
const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("config");

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email or password.");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid email or password.");

  const token = user.generateAuthToken();
  res.send(token);
});

router.post("/sendEmail", async (req, res) => {
  const { error } = Joi.validate(req.body, {
    email: Joi.string().email().required().max(255),
  });
  if (error) return res.status(400).send("email is required!");

  const user = await User.findOne({ email: req.body.email });
  const token = jwt.sign({ _id: this._id }, config.get("jwtPrivateKey"), {
    expiresIn: "1h",
  });
  user.forgotPasswordToken = token;
  await user.save();
  if (user) user.sendEmail(token);
  res.status(200).send("Email sent!");
});

router.post("/resetPassword", async (req, res) => {
  const user = await User.findOne({ forgotPasswordToken: req.body.token });
  console.log(user);
  if (!user) return res.status(400).send("Invaild token");
  jwt.verify(
    user.forgotPasswordToken,
    config.get("jwtPrivateKey"),
    (err, decode) => {
      if (err) return res.status(400).send("Token expired");
    }
  );
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  user.forgotPasswordToken = undefined;
  await user.save();
  res.status(200).send("password changed");
});

function validate(req) {
  const schema = {
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  };

  return Joi.validate(req, schema);
}

module.exports = router;
