import userModel from "../models/userModel.js";
import { Request, Response, NextFunction } from "express";

export const fetchUsersHandler = async function (req: Request, res: Response, next: NextFunction) {
  try {
    const users = await userModel.find().select("_id username email gender role isEmailVerified");

    return res.status(200).json({
      success: true,
      message: "Success: Fetch Users",
      numOfUsers: users.length,
      users,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: "Fail: Fetch Users",
    });
  }
};

export async function fetchUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const user = await userModel.findById({ _id: id });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Fail: User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Success: Fetch User Successfully",
      user,
    });
  } catch (error) {
    console.log(error);

    return res.status(404).json({
      success: false,
      message: "Fail: Fetch User Fail",
    });
  }
}

export async function deleteUserhandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const user = await userModel.findById({ _id: id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Fail: User Not Found",
      });
    }

    await userModel.findByIdAndDelete({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Success: Delete User Successfully",
      user,
    });
  } catch (error) {
    console.log(error);

    return res.status(404).json({
      success: false,
      message: "Fail: Delete User Fail",
    });
  }
}
