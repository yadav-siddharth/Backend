import { asyncHandler } from "../utils/asyncHandler.js";
import { Teacher } from "../models/teacher.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// register teacher controller
const registerTeacher = asyncHandler(async (req, res) => {
  const { password, username, role, fullName, teacherAge, teacherMobile } =
    req.body;

  if (
    [username, fullName, password, role, teacherAge, teacherMobile].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const existedTeacher = await Teacher.findOne({ username });

  if (existedTeacher) {
    throw new ApiError(400, "Teacher username already exists!");
  }

  const teacher = await Teacher.create({
    username: username.toLowerCase(),
    fullName: fullName,
    password: password,
    role: role.toLowerCase(),
    teacherAge: teacherAge,
    teacherMobile: teacherMobile,
  });
  const createdTeacher = await Teacher.findById(teacher._id).select(
    "-password -refreshToken"
  );

  if (!createdTeacher) {
    throw new ApiError(500, "Something went wrong while registering Student!");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(200, createdTeacher, "Student Registered Sucessfully!")
    );
});

// generate access token and refresh token on login
const generateAccessRefreshTokenTeacher = async (teacherID) => {
  try {
    const teacher = await Teacher.findById(teacherID);
    const accessToken = await teacher.generateAccessToken();
    const refreshToken = await teacher.generateRefreshToken();

    teacher.refreshToken = refreshToken;

    await teacher.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token",
      error
    );
  }
};

// login controller teacher
const loginTeacher = asyncHandler(async (req, res) => {
  const { username, role, password } = req.body;
  if (!(username || password)) {
    throw new ApiError(400, "All fields are required");
  }

  const teacher = await Teacher.findOne({ username });

  if (!teacher) {
    throw new ApiError(404, "We could not find user with given above details!");
  }

  const isPasswordVaild = await teacher.isPasswordCorrect(password);

  if (!isPasswordVaild) {
    throw new ApiError(404, "Your Password does not match!");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshTokenTeacher(
    teacher._id
  );

  const loggedInTeacher = await Teacher.findById(teacher._id).select(
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
        { teacher: loggedInTeacher },
        "Teacher Logged In Successfully!"
      )
    );
});

// logout controller
const logoutTeacher = asyncHandler(async (req, res) => {
  await Teacher.findByIdAndUpdate(
    req.teacher._id,
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
    .json(new ApiResponse(200, {}, "Teacher Logout Successfully !"));
});

// get data teacher
const getTeacher = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.teacher, "Teacher data fetched!"));
});

// refersh Acces token controller
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingToken = req.cookies?.refreshToken || req.body.refershToken;

  if (!incomingToken) {
    throw new ApiError(401, "Unauthorized request try to Login!");
  }

  try {
    const decoded = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);

    const teacher = await Teacher.findById(decoded._id);

    if (!teacher) {
      throw new ApiError(401, "Invalid Refresh token!");
    }

    if (incomingToken !== decoded?.refershToken) {
      throw new ApiError(401, "Refresh token could not matched or exipred!");
    }

    const { accessToken, newRefreshToken } =
      await generateAccessRefreshTokenTeacher(teacher._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed!"
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
    throw new ApiError(401, "Password is required!");
  }

  const teacher = await Teacher.findById(req.teacher._id);
  const isPasswordVaild = await teacher.isPasswordCorrect(password);

  if (!isPasswordVaild) {
    throw new ApiError(401, "Invalid password");
  }

  teacher.password = newPassword;
  await teacher.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully!"));
});

// update teacher profile

const updateTeacherProfile = asyncHandler(async (req, res) => {
  const {
    fullName,
    teacherAge,
    teacherMobile,
    subjectSpecific,
    teacherEmail,
    teacherFees,
    timeAvailable,
  } = req.body;

  if (
    !(
      fullName ||
      teacherAge ||
      teacherEmail ||
      teacherFees ||
      timeAvailable ||
      teacherMobile
    )
  ) {
    throw new ApiError(401, "All fields are required!");
  }

  const teacher = await Teacher.findByIdAndUpdate(
    req.teacher._id,
    {
      $set: {
        fullName: fullName,
        teacherAge: teacherAge,
        teacherEmail: teacherEmail,
        teacherFees: teacherFees,
        timeAvailable: timeAvailable,
        teacherMobile: teacherMobile,
        subjectSpecific: subjectSpecific,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, teacher, "Teacher profile updated!"));
});

// upload teacher photo
const uploadTeacherAvatar = asyncHandler(async (req, res) => {
  const avatarLocalFilePath = req.file?.path;

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar is Required!");
  }

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on cloudinary!");
  }

  const teacher = await Teacher.findByIdAndUpdate(
    req.teacher._id,
    {
      $set: {
        teacherPhoto: avatar?.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, teacher, "Teacher Photo Uploded Successfully!"));
});

export {
  registerTeacher,
  loginTeacher,
  logoutTeacher,
  getTeacher,
  refreshAccessToken,
  changePassword,
  updateTeacherProfile,
  uploadTeacherAvatar,
};
