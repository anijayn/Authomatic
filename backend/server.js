import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connect from "./db/connect.js";
import cookieParser from "cookie-parser";
import fs from "node:fs";

const app = express();
dotenv.config();
const port = process.env.PORT || 5001;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // Allows cookies & creds to be included in CORS requests
  })
);
app.use(express.json()); // Parses JSON body in requests automatically and makes it available in req.body
app.use(
  express.urlencoded({
    // Parses URL encoded data and makes it available in req.body
    extended: true, // Enables extensive parsing
  })
);
app.use(cookieParser()); // Parses cookies

// Routes
const routeFiles = fs.readdirSync("./src/routes"); // Returns the *Routes.js file names as an array
routeFiles.forEach((file) => {
  import(`./src/routes/${file}`) // Dynamically imports every route module
    .then((route) => {
      app.use("/api/v1", route.default); //Mounts every single route to /api/v1
    })
    .catch((error) => {
      console.log(`ERROR: Importing routes failed with ${error.message}`);
    });
});

const server = async () => {
  try {
    await connect();
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.log(`ERROR: Server failed to start with ${error.message}`);
    process.exit(1);
  }
};

server();
