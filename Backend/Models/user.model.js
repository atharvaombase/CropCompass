const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter your name"],
      maxLength: [30, "Please Enter the valid name"],
      minLength: [2, "Name should have more than 5 characters"],
    },
    country: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true,
    },
    password: {
      type: String,
      required: true,
      minLength: [6, "Password should have more than 6 characters"],
    },
    avatar: {
      type: String,
      default: "/images/profile.jpeg",
    },
    role: { type: String, enum: ["farmer", "admin"], default: "farmer" },
    farms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Farm" }],

    resetPasswordToken: String,
    resetPasswordExpiry: Date,
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateRefreshToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.REFRESH_TOKEN_SECRET
    // {
    //   expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    // }
  );
};

userSchema.methods.getResetPassword = async function () {
  // Generating token
  const resetToken = await crypto.randomBytes(20).toString("hex");

  // Hashing and adding reset password token to userschema

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordExpiry = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
