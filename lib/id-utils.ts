import mongoose from "mongoose";

export function toMongoId(id: string | number): mongoose.Types.ObjectId {
  try {
    if (typeof id === "number") {
      return new mongoose.Types.ObjectId(id.toString());
    }
    return new mongoose.Types.ObjectId(id);
  } catch (error) {
    throw new Error("Invalid ID format");
  }
}

export function isValidId(id: string | number): boolean {
  try {
    if (typeof id === "number") {
      return mongoose.Types.ObjectId.isValid(id.toString());
    }
    return mongoose.Types.ObjectId.isValid(id);
  } catch (error) {
    return false;
  }
}
