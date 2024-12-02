import mongoose from "mongoose";

const TokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserModel",
    required: true,
  },
  verificationToken: {
    type: String,
    default: "",
  },
  resetPasswordToken: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const TokenModel = mongoose.model("Token", TokenSchema);

export default TokenModel;
