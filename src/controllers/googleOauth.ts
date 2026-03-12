import dotenv from "dotenv";
dotenv.config();

import { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import userModel from "../models/userModel.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

//1. First we need to create a GOOGLE OAUTH CLIENT.

//OAuth2Client is a object that provides methods.
//googleClient.generateAuthUrl() > this create google login url. like this

//and it accepts 3 parameters -> clientId, Secret and Redirect URI.
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

// 2.
export async function oAuthHandler(req: Request, res: Response, next: NextFunction) {
  const authURL = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile", "openid"],
    prompt: "consent",
  });

  console.log(authURL);

  //   res.redirect(authURL);

  res.status(200).json({
    success: true,
    message: "Success: Url Generated succeessfully",
    authURL,
  });
}

// 3.
export async function googleCallbackHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.query;

    console.log("Received Code From Google:", code);

    if (!code) {
      return res.status(403).json({
        success: false,
        message: "Fail: Something Went Wrong!",
      });
    }

    const { tokens } = await googleClient.getToken(code as string);

    console.log("TOKEN", tokens);

    if (!tokens) {
      return res.status(403).json({
        success: false,
        message: "Fail: Google Token is missing",
      });
    }

    // Verify the token and gets to Read user data

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // console.log("TICKET", ticket);

    const payload = ticket.getPayload();

    // console.log("PAYLOAD:", payload);

    if (!payload?.email_verified) {
      return res.status(403).json({
        success: false,
        message: "Fail: Please Verify Your Email!",
      });
    }

    const existingUser = await userModel.findOne({ email: payload.email });

    if (existingUser) {
      if (!existingUser?.googleId) {
        return res.status(403).json({
          success: false,
          message: "Fail: Email Already In Use, Please login",
        });
      }

      const user = {
        _id: existingUser._id,
        role: existingUser.role,
      };

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      res.cookie("accessToken", accessToken, { maxAge: 10 * 60 * 1000, httpOnly: true, secure: true });
      res.cookie("refreshToken", refreshToken, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true });

      return res.status(200).json({
        success: false,
        message: "Success: Login Successfully",
        user,
      });
    }

    const user = new userModel({
      username: payload.name,
      email: payload.email,
      isEmailVerified: payload.email_verified,
      googleId: payload.sub,
    });

    console.log("USER:", user);

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("accessToken", accessToken, { maxAge: 10 * 60 * 1000, httpOnly: true, secure: true });
    res.cookie("refreshToken", refreshToken, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: true });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Success: Registered Successfull",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    });

    // res.redirect("http://localhost:6173/api/v1/users");
  } catch (error) {
    console.log(error);

    return res.status(404).json({
      success: false,
      message: "Fail: Fetch User Fail",
    });
  }
}
