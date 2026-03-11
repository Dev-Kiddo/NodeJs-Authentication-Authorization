import { Types } from "mongoose";

export interface USER {
  _id: Types.ObjectId;
  role?: string;
}
