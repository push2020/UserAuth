import React from "react";
import "./Radio.scss";

const Radio = ({
  className = "",
  styles = {},
  isChecked,
  message,
  value,
  onClick,
  readOnly = false,
  disabled,
}) => {
  const handleButtonClick = () => {
    console.log("value->", value);
    onClick(value);
  };

  return (
    <label
      className={`radiowrapper ${className} ${disabled ? "disable" : ""}`}
      onClick={handleButtonClick}
    >
      <input
        className="radiowrapper__button"
        type="radio"
        value={value}
        checked={isChecked}
        style={styles}
        onChange={() => {}}
      />
      {!readOnly && <span className="radio-mark"></span>}
      {message && <span className="radiowrapper__text">{message}</span>}
    </label>
  );
};

export default Radio;
