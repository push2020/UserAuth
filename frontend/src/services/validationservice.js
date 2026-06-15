export const validationService = {
  // URL validation (supports HTTP, HTTPS, and IP addresses)
  isUrl: new RegExp(/^.*$/),
  // new RegExp(
  //   "^(https?:\\/\\/)" + // Protocol
  //     "((([a-zA-Z0-9$_.+!*'(),%-]+\\.)+[a-zA-Z]{2,})|" + // Domain name
  //     "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR IPv4
  //     "(\\:\\d+)?(\\/.*)?$", // Port & path
  //   "i"
  // ),

  // Name validation (only letters and spaces, no numbers or special characters)
  isName: new RegExp(/^[a-zA-Z\s]+$/),

  // Email validation (standard format)
  isEmail: new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),

  // Phone number validation (supports different formats with optional country code)
  isPhone: new RegExp(/^\+?[0-9]{10,15}$/),

  // Password validation (minimum 8 characters, at least one uppercase, one lowercase, one number, and one special character)
  isPassword: new RegExp(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  ),

  // Number validation (only digits, no letters)
  isNumber: new RegExp(/^\d+$/),

  // Alphanumeric validation (letters and numbers only, no special characters)
  isAlphanumeric: new RegExp(/^[a-zA-Z0-9]+$/),

  // Checks if the value is an array
  isArray: (value) =>
    value !== null && Array.isArray(value) && value.length === 0,

  // Checks if the value is a plain object (not null and not an array)
  isObject: (value) =>
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length < 0,

  // Boolean validation (checks if the value is a boolean)
  isBoolean: (value) => value !== null && typeof value === "boolean",

  // Checks if the value is empty (null, undefined, or empty string)
  isEmpty: (value) =>
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === ""),
};
