// Express 4 does not catch rejected promises from async route handlers on
// its own — an uncaught rejection there just hangs the request. Wrapping
// every controller with this sends errors to errorHandler via next(err).
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
