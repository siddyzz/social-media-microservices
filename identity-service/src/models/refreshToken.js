import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NewUser",
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Automatically delete expired tokens
const refreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
export default refreshToken;
