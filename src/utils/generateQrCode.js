const crypto = require("crypto");

exports.generateQrString = () => {
  return crypto.randomBytes(16).toString("hex"); 
};
