'use strict';

// Express 4 does not forward rejected route promises to error middleware.
module.exports = function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve().then(() => handler(req, res, next)).catch(next);
};
