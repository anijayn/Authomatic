import crypto from "node:crypto";

export const hashToken = (token) => {
  // Creates a SHA-256 hash and then uses it to hash the token and finally returns it in hexadecimal
  return crypto.createHash("sha256").update(token.toString()).digest("hex");
};
