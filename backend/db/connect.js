import mongoose from "mongoose";

const connect = async (req, res) => {
  try {
    console.log("Connecting to the database...");
    mongoose.connect(process.env.MONGO_URI, {});
    console.log("INFO: Connected to the database!");
  } catch (error) {
    console.log(`ERROR: Connecting to database failed with ${error.message}`);
    process.exit(1);
  }
};

export default connect;
