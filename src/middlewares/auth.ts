import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function auth(req: Request, res: Response, next: NextFunction) {
  // const authHeader = req.headers.authorization;
  // console.log("authHeader", authHeader);

  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Fail: Authentication Missing, Please Login!",
    });
  }

  const verifyToken = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

  if (!verifyToken) {
    return res.status(401).json({
      success: false,
      message: "Fail: Invalid or Expired Token",
    });
  }

  req.user = verifyToken;

  next();
}
