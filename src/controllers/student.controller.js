import { asyncHandler } from "../utils/asyncHandler.js";
import { Student } from "../models/student.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerStudent = asyncHandler(async (req, res) => {
  const {
    username,
    fullName,
    password,
    role,
    studentAge,
    schoolName,
    parentMobile,
    studentStd,
  } = req.body;

  if (
    [
      username,
      fullName,
      password,
      role,
      studentAge,
      schoolName,
      parentMobile,
      studentStd,
    ].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedStudent = await Student.findOne({ username });

  if (existedStudent) {
    throw new ApiError(409, "Student with username existed already !");
  }

  const student = await Student.create({
    username: username.toLowerCase(),
    fullName: fullName,
    password: password,
    role: role,
    studentAge: studentAge,
    schoolName: schoolName,
    parentMobile: parentMobile,
    studentStd: studentStd,
  });

  const createdStudent = await Student.findById(student._id).select(
    "-password -refreshToken"
  );

  if (!createdStudent) {
    throw new ApiError(500, "Something went wrong while registering Student!");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdStudent, "Student Registered Sucessfully!")
    );
});

const generateAccessRefreshToken = async (studentID) => {
  try {
    const student = await Student.findById(studentID);
    const accessToken = await student.generateAccesToken();
    const refreshToken = await student.generateRefreshToken();

    student.refreshToken = refreshToken;

    await student.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

const loginStudent = asyncHandler(async (req, res) => {
  const { username, role, password } = req.body;
  if (!(username || password)) {
    throw new ApiError(400, "All fields are required");
  }

  const student = await Student.findOne({ username });

  if (!student) {
    throw new ApiError(404, "We could not find user with given above details!");
  }

  const isPasswordVaild = await student.isPasswordCorrect(password);

  if (!isPasswordVaild) {
    throw new ApiError(404, "Your Password does not match!");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    student._id
  );

  const loggedInStudent = await Student.findById(student._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { student: loggedInStudent, accessToken, refreshToken },
        "Student Logged In Successfully!"
      )
    );
});

const logoutStudent = asyncHandler(async (req, res) => {
  await Student.findByIdAndUpdate(
    req.student._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Student Logout Successfully !"));
});

const getStudent = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.student, "Student data fetched!"));
});

export { registerStudent, loginStudent, logoutStudent, getStudent };
