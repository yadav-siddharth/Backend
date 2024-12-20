import mongoose, { Schema } from "mongoose";
import { jwt } from "jsonwebtoken";
import bcrypt from "bcryptjs";

const studentSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
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
      requried: true,
    },
    parentName: {
      type: String,
      required: true,
    },
    parentEmail: {
      type: String,
    },
    studentAge: {
      type: Number,
      required: true,
    },
    ParentMobile: {
      type: Number,
      required: true,
    },
    schoolName: {
      type: String,
      required: true,
    },
    studentPhoto: {
      type: String,
    },
    studentStd: {
      type: String,
      required: true,
    },
    studentBoard: {
      type: String,
    },
    studentBatch: {
      type: String,
    },
    TeacherName: [
      {
        type: Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],
  },
  { timestamps: true }
);

studentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

studentSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

studentSchema.methods.generateAccesToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      fullName: this.fullName,
      parentName: this.parentName,
      studentStd: this.studentStd,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

studentSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

export const Student = mongoose.model("Student", studentSchema);
