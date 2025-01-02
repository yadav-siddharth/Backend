import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const teacherSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    teacherAge: {
      type: Number,
      required: true,
    },
    teacherMobile: {
      type: Number,
      required: true,
    },
    subjectSpecific: [
      {
        type: String,
      },
    ],
    teacherEmail: {
      type: String,
    },
    teacherFees: {
      type: Number,
    },
    timeAvailable: {
      type: String,
    },
    teacherPhoto: {
      type: String,
    },
    student: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

teacherSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

teacherSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

teacherSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      fullName: this.fullName,
      teacherAge: this.teacherAge,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

teacherSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const Teacher = mongoose.model("Teacher", teacherSchema);
