import { Request, Response, NextFunction } from "express";
import { forgotValidationSchema, loginValidationSchema, resetValidationSchema, userValidationSchema } from "./userValidationSchema.js";
import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { Hash } from "../utils/hashPassword.js";
import { sendMail } from "../utils/sendMail.js";
import crypto from "crypto";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/token.js";

export const registerHandler = async function (req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body;

    const result = userValidationSchema.safeParse(body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid Inputs, Please Check!",
        errors: result.error.flatten(),
      });
    }

    const { username, email, password, gender } = result.data;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await userModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(403).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashPassword = await Hash(password, 10);

    const user = new userModel({
      username,
      email: normalizedEmail,
      password: hashPassword,
      gender,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const rawToken = crypto.randomBytes(10).toString("hex");

    const hashTokenForStorage = crypto.createHash("sha256").update(rawToken).digest("hex");

    // console.log("rawToken", rawToken);
    // console.log("hashTokenForStorage", hashTokenForStorage);

    // const verifyUrl = `${process.env.APP_URL}/api/v1/auth/verify-email?token=${rawToken.toString("hex")}`;

    const verifyUrl = `${process.env.APP_URL}/api/v1/auth/verify-email?token=${rawToken}`;

    // console.log("verifyUrl:", verifyUrl);

    user.verifyToken = hashTokenForStorage;
    user.verifyTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    const html = `
    <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: sans-serif; background-color: #f4f4f4; padding: 20px; }
            .container { max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; }
            .button { background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
              <h2>Confirm Your Account</h2>
              <p>Hi ${user.username},</p>
              <p>Please click the button below to verify your email address.</p>
              <a href=${verifyUrl} class="button">Verify Email</a>
          </div>
        </body>
      </html>`;

    // const mailResponse = await sendMail(
    //   normalizedEmail,
    //   "Hello from Mailtrap Node.js",
    //   `<h1>Plain text body</h1>
    //   <a href=${verifyUrl}>${verifyUrl}</a>
    //   `,
    // );

    const mailResponse = await sendMail(normalizedEmail, "Email Verification", html);

    console.log("MailResponse", mailResponse);

    await user.save();

    res.cookie("accessToken", accessToken, { maxAge: 10 * 60 * 1000, httpOnly: true, secure: true });

    res.cookie("refreshToken", refreshToken, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true });

    return res.status(200).json({
      success: true,
      message: "Success: Registerd User!",
      // accessToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        gender: user.gender,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Fail: Register User!",
      error,
    });
  }
};

export const verifyUserEmailHandler = async function (req: Request, res: Response, next: NextFunction) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Verify Token missing",
    });
  }

  try {
    const userPayload = req.user;

    if (!userPayload) {
      return res.status(400).json({
        success: false,
        message: "Fail: Authentication failed!",
      });
    }

    const user = await userModel.findById(userPayload._id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Fail: User Not Found!",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Warning: User already verified",
      });
    }

    if (new Date(Date.now()) > user.verifyTokenExpires!) {
      return res.status(400).json({
        success: false,
        message: "Fail: Reset Token Expired",
      });
    }

    // console.log("verifyTOken", user.verifyToken);
    // console.log(
    //   "hashToken",
    //   crypto
    //     .createHash("sha256")
    //     .update(token as string)
    //     .digest("hex"),
    // );

    // console.log(
    //   "CHECK TOKEN",
    //   user.verifyToken !==
    //     crypto
    //       .createHash("sha256")
    //       .update(token as string)
    //       .digest("hex"),
    // );

    if (
      user.verifyToken !==
      crypto
        .createHash("sha256")
        .update(token as string)
        .digest("hex")
    ) {
      return res.status(400).json({
        success: false,
        message: "Fail: Invalid Token!",
      });
    }

    user.isEmailVerified = true;

    user.verifyToken = null;
    user.verifyTokenExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Success: User Verified",
    });
  } catch (error) {
    console.log("Err Verify User:", error);
    return res.status(500).json({
      success: false,
      message: "Fail: Verify User!",
      error,
    });
  }
};

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = loginValidationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid Inputs, Please Check!",
        errors: result.error.flatten(),
      });
    }

    const { email, password } = result.data;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await userModel.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Fail: User not found!",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Fail: Please Verify Your Email Before Login!",
      });
    }

    const verifyPassword = await bcrypt.compare(password, user.password);

    // console.log(verifyPassword, "verifyPassword");

    if (!verifyPassword) {
      return res.status(400).json({
        success: false,
        message: "Fail: Incorrect Email or Password.",
      });
    }

    // const token = jwt.sign({ sub: user._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("accessToken", accessToken, { maxAge: 10 * 60 * 1000, httpOnly: true, secure: true });

    res.cookie("refreshToken", refreshToken, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true });

    return res.status(200).json({
      success: true,
      message: "Success: login",
      // accessToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        role: user.role,
        auth2f: user.auth2F,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Fail: login",
    });
  }
}

export async function refreshTokenHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.cookies;

    // console.log("refreshToken", refreshToken);

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Fail: Invalid or Expired Token, Please Login!",
      });
    }

    const payload = verifyToken(refreshToken);

    if (!payload) {
      return res.status(400).json({
        success: false,
        message: "Fail: Invalid or Expired Token, Please Login!",
      });
    }

    const user = await userModel.findById(payload._id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Fail: User not found!",
      });
    }

    const accessToken = generateAccessToken({ _id: user?._id, role: user?.role });

    res.cookie("accessToken", accessToken, { maxAge: 10 * 60 * 1000, httpOnly: true, secure: true });

    return res.status(200).json({
      success: true,
      message: "Success: Refresh Token Generated",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Fail: Generate Access Token",
    });
  }
}

export async function logoutHandler(_req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });

    return res.status(200).json({
      success: true,
      message: "Success: Logout",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Fail: Logout",
    });
  }
}

export async function forgotPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = forgotValidationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid Inputs, Please Check!",
        errors: result.error.flatten(),
      });
    }

    const { email } = result.data;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Fail: Invalid Email",
      });
    }

    const rawToken = crypto.randomBytes(10).toString("hex");
    const hashToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    const forgtotPasswordUrl = `${process.env.APP_URL}/api/v1/auth/reset?token=${rawToken}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
    <style>
    body { font-family: sans-serif; background-color: #f4f4f4; padding: 20px; }
    .container { max-width: 500px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px; }
    .button { background-color: #ff9900; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
    </style>
    </head>
    <body>
    <div class="container">
    <h2>Forgot Password</h2>
    <p>Hi ${user.username},</p>
    <p>Please click the button below to reset you login password.</p>
    <a href=${forgtotPasswordUrl} class="button">Reset Password</a>
    <hr>
    <p>Note: The token is valid only for 10 minutes!</p>
    <p>Please ignore, if you're not trigger this mail!</p>
    </div>
    </body>
    </html>`;

    await sendMail(email, "Forgot Password", html);

    user.resetPasswordToken = hashToken;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);

    // console.log("user", user);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Success: Reset Password Link Sent Your Email",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Fail: Logout",
    });
  }
}

export async function resetPasswordHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = resetValidationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid Inputs, Please Check!",
        errors: result.error.flatten(),
      });
    }

    const { token } = req.query;

    const { password, confirmPassword } = result.data;

    if (password !== confirmPassword) {
      return res.status(403).json({
        success: false,
        message: "Fail: Password Doesn't Match, Please Check!",
      });
    }

    // console.log("TOKEN", token);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Fail: Invalid or Expired Token",
      });
    }

    const tokenVerify = crypto
      .createHash("sha256")
      .update(token as string)
      .digest("hex");

    const user = await userModel.findOne({ resetPasswordToken: tokenVerify });

    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Fail: Invalid User",
      });
    }

    if (user.resetPasswordExpires === null || user.resetPasswordExpires === undefined) {
      return res.status(400).json({
        success: false,
        message: "Fail: Invalid Token",
      });
    }

    if (new Date(Date.now()) > user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        message: "Fail: Expired Token",
      });
    }

    const hashPassword = await bcrypt.hash(confirmPassword, 10);

    user.password = hashPassword;

    user.resetPasswordExpires = null;
    user.resetPasswordToken = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Success: Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Fail: Password reset",
    });
  }
}
