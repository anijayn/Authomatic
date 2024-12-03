// If the response headers are already sent, this error middlleware passes the error
// to the next middleware. If not, it ensures to send consistent status codes
// and also provides useful debugging in non-prod environments
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  const statusCode =
    res.statusCode && res.statusCode >= 400 ? res.statusCode : 500;
  res.status(statusCode);

  const env = process.env.NODE_ENV;
  if (env !== "production") {
    console.log(err);
  }
  res.json({
    message: err.mesage,
    stack: env === "production" ? null : err.stack,
  });
};

export default errorHandler;
