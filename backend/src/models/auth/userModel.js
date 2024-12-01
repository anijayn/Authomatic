import mongoose from "mongoose";
import bcrypt from "bcrypt";

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

// Pre-save hook. Gets executed before every save operation
userSchema.pre("save", async function (next) {
  // Checks if password is modified. If not, prevents rehashing and moves to the save operation
  if (!this.isModified("password")) {
    return next();
  }

  // Generate salt, hash the password and replace it in the schema
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;

  //Proceeds to the save operation
  next();
});

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
