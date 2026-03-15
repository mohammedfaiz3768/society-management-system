const crypto = require("crypto");

exports.generatePassCode = () => {
  return crypto.randomBytes(8).toString("hex"); 
};
