import { Schema, model, models, type Document } from "mongoose";

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
export const User = (models.User as ReturnType<typeof model<UserDocument>>) || model<UserDocument>("User", userSchema);
