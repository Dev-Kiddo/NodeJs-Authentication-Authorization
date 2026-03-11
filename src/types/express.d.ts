import USER from "./generateTokenTypes.ts";

declare global {
  namespace Express {
    interface Request {
      user?: USER;
    }
  }
}
