import jwt from "jsonwebtoken";
import { USER } from "../types/generateTokenTypes.js";

export function generateAccessToken(user: USER) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET env not set");
  }

  return jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: "10m" });
}

export function generateRefreshToken(user: USER) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET env not set");
  }

  return jwt.sign({ _id: user._id }, process.env.JWT_SECRET as string, { expiresIn: "3d" });
}

export function verifyToken(tokenStr: string) {
  const verify = jwt.verify(tokenStr, process.env.JWT_SECRET!) as jwt.JwtPayload;

  return verify;
}
