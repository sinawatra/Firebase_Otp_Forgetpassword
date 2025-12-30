const { sendOtp } = require("./services/sendOtp");
const { resetPassword } = require("./services/resetPassword");

exports.sendOtp = sendOtp;
exports.resetPassword = resetPassword;
