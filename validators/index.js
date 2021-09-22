const EMAIL_REGEXP = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
const PASSWORD_UPPER_REGEXP = /[A-Z]+/;
const PASSWORD_LOWER_REGEXP = /[a-z]+/;
const PASSWORD_NUMBER_REGEXP = /[0-9]+/
const PASSWORD_SPECIAL_REGEXP = /[\W_]+/;

module.exports = {
  register: {
    email: function (email) {
      return EMAIL_REGEXP.test(email);
    },
    password: function (password) {
      return password.length >= 8
        && PASSWORD_UPPER_REGEXP.test(password)
        && PASSWORD_LOWER_REGEXP.test(password)
        && PASSWORD_NUMBER_REGEXP.test(password)
        && PASSWORD_SPECIAL_REGEXP.test(password)
    }
  }
};
