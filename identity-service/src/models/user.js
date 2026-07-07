import mongoose from "mongoose";
import argon2 from "argon2";

const newUserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);
newUserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    try {
      this.password = await argon2.hash(this.password); // hash the password before saving
    } catch (err) {
      return next(err);
    }
  }
});
newUserSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await argon2.verify(this.password, candidatePassword); // compare the password with the hashed password
  } catch (err) {
    throw err;
  }
};
newUserSchema.index({ username: "text" });
const NewUser = mongoose.model("NewUser", newUserSchema);
export default NewUser;
