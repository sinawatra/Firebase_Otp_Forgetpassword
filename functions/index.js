const { sendOtp } = require("./services/sendOtp");
const { resetPassword } = require("./services/resetPassword");
const { translateHttp } = require("./services/translateHtpp");

exports.sendOtp = sendOtp;
exports.resetPassword = resetPassword;
exports.translateHttp = translateHttp;
