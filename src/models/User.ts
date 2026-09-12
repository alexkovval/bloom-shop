import { Schema, model, models, type Document, type Model } from "mongoose";

export interface UserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// `models.User` guards against Mongoose recompiling the model on every hot
// reload in dev, which would otherwise throw "Cannot overwrite `User` model".
// (Annotating the const directly — rather than casting via
// `ReturnType<typeof model<T>>` — avoids a TS overload-resolution error
// against newer Mongoose typings; `typeof model<T>` outside a real call
// doesn't resolve overloads the way an actual call does.)
export const User: Model<UserDocument> = models.User || model<UserDocument>("User", userSchema);
