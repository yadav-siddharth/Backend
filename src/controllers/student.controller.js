import { asyncHandler } from "../utils/asyncHandler.js";
import { Student } from "../models/student.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// register student controller
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
    role: role.toLowerCase(),
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

// genreate access and refresh token when login
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

// login controller
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

// logout controller
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

// get data controller
const getStudent = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.student, "Student data fetched!"));
});

// refresh access token controller

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, "Unauthorized request Please try to login!");
  }

  try {
    const decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);

    const student = await UserActivation.findById(decoded?._id);

    if (!student) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingToken !== decoded?.refreshToken) {
      throw new ApiError(401, "Refresh token could not be matched or expired!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } = await generateAccessRefreshToken(
      student._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token refreshed !"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// change current password

const changePassword = asyncHandler(async (req, res) => {
  const { password, newPassword } = req.body;

  if (!(password || newPassword)) {
    throw new ApiError(401, "Paasword is required !");
  }

  const student = await Student.findById(req.student._id);
  const isPasswordVaild = await student.isPasswordCorrect(password);
  if (!isPasswordVaild) {
    throw new ApiError(401, "Invalid password");
  }

  student.password = newPassword;
  await student.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully!"));
});

// update profile student

const updateStudentProfile = asyncHandler(async (req, res) => {
  const {
    fullName,
    parentName,
    parentEmail,
    studentAge,
    parentMobile,
    schoolName,
    studentStd,
    studentBoard,
    studentBatch,
  } = req.body;

  if (!(fullName || schoolName || parentMobile || studentAge || studentStd)) {
    throw new ApiError(401, "All fileds are required!");
  }

  const student = await Student.findByIdAndUpdate(
    req.student._id,
    {
      $set: {
        fullName: fullName,
        schoolName: schoolName,
        parentMobile: parentMobile,
        studentAge: studentAge,
        studentStd: studentStd,
        studentBoard: studentBoard,
        studentBatch: studentBatch,
        parentName: parentName,
        parentEmail: parentEmail,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(200, student, "Student profile updated succesfully !")
    );
});

export {
  registerStudent,
  loginStudent,
  logoutStudent,
  getStudent,
  refreshAccessToken,
  changePassword,
  updateStudentProfile,
};
