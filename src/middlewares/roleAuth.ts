import { Request, Response, NextFunction } from "express";

export function authorizeRoles(...authRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Fail: Authentication Missing, Please Login!",
      });
    }

    if (!authRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have permission `,
      });
    }

    next();
  };
}
