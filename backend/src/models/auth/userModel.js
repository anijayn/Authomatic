import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"], // 2nd value is a custom error when field is absent
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      trim: true, //Removes whitespaces at beginning and end
      match: [
        /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password!"],
    },
    photo: {
      type: String,
      default: "https://avatars.githubusercontent.com/u/19819005?v=4",
    },
    bio: {
      type: String,
      default: "I am a new user.",
    },
    role: {
      type: String,
      enum: ["user", "admin", "creator"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, minimize: true } // Adds automatic timestamping and prevents empty objects to be saved
);

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
