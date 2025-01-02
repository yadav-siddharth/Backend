import { asyncHandler } from "../utils/asyncHandler.js";
import { Teacher } from "../models/teacher.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    username: username,
    fullName: fullName,
    password: password,
    role: role,
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

const getTeacher = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.teacher, "Teacher data fetched!"));
});

export { registerTeacher, loginTeacher, logoutTeacher, getTeacher };
