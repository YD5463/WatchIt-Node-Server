const config = require("config");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const winston = require("winston");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  forgotPasswordToken: String,
  isAdmin: Boolean,
});

userSchema.methods.sendEmail = function (token) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.get("appEmailAddress"),
      pass: config.get("appEmailPassword"),
    },
  });

  const mailOptions = {
    from: "WatchIt@gmail.com",
    to: this.email,
    subject: "Reset your password",
    html: `<a href="http://localhost:3000/login/${token}">click here</a> `,
  };
  transporter.sendMail(mailOptions, function (error, info) {
    winston.info(error || info.response);
  });
};
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      isAdmin: this.isAdmin,
    },
    config.get("jwtPrivateKey")
  );
  return token;
};

const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = {
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  };

  return Joi.validate(user, schema);
}

exports.User = User;
exports.validate = validateUser;
