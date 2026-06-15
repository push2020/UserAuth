import React, { useState } from "react";
import OutSideClick from "../../hooks/useOutSideClick";
import {
  ic_chevron_down,
  ic_chevron_up,
  ic_help_outlined,
  ic_open_with,
} from "../../utils/iconSvg";
import Tooltip from "../Tooltip/Tooltip";
import "./DropdownInput.scss";
import Radio from "../Radio/Radio";
import AppConstants from "../../constants/AppConstants.js";

const DropdownInput = ({
  value,
  options,
  name,
  placeholder,
  label = "",
  required,
  statekey,
  handleOnChange,
  isRounded,
  classname,
  tooltipMessage,
  search,
  radioSelect = false,
  ...rest
}) => {
  const [searchTerm, setSearchTerm] = useState(search ? value : "");
  const [show, setShow] = useState(false);
  const filteredOptions = searchTerm
    ? options?.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const getSelectedValue = () => {
    let filteredValue = filteredOptions?.filter((item) =>
      statekey === "selected_product"
        ? item.name === value //only for product
        : item.value === value
    )?.[0];

    return filteredValue?.name;
  };

  // console.log("get selected value", getSelectedValue(), filteredOptions, value);

  const handleInputOnChange = (e) => {
    setSearchTerm(e.target.value);
    handleOnChange({ name: e.target.value, isTyping: true });
  };

  return (
    <OutSideClick
      onOutsideClick={() => {
        setShow(false);
      }}
      display="contents"
      classname={classname}
    >
      <div className={`container ${AppConstants.isViewMode && "readonly"}`}>
        {label && (
          <div className="container__detail">
            <span className="container__title">
              {label}
              {required ? "*" : ""}
            </span>
            <Tooltip message={tooltipMessage}>
              <span className="container__icon">{ic_help_outlined}</span>
            </Tooltip>
          </div>
        )}
        <div
          className={`inputContainer ${isRounded ? "rounded" : ""}`}
          onClick={() => setShow(!show)}
        >
          <input
            className={`input text-body-xs`}
            placeholder={placeholder}
            name={name}
            type="text"
            value={getSelectedValue() || searchTerm}
            onChange={handleInputOnChange}
            readOnly={!search}
          />
          <div className="dropdownicon">
            {!show ? <>{ic_chevron_down}</> : <>{ic_chevron_up}</>}
          </div>
          <div
            className={`menublockContainer  ${!show ? "hideMenuBlock" : ""}`}
          >
            {filteredOptions?.length > 0 ? (
              filteredOptions?.map((item, index) => {
                return (
                  <div
                    key={index}
                    className={`menublockitem ${
                      item.disabled ? "menublockitem__disabled" : ""
                    }`}
                    onClick={() => {
                      handleOnChange(item);
                    }}
                  >
                    {radioSelect ? (
                      <Radio
                        value={item?.name}
                        isChecked={value === item?.name}
                      />
                    ) : null}
                    <div className="menublockitem__list-text">
                      {item?.name}
                      <br />
                      <span
                        className={`menublockitem__list-supportText ${
                          item?.disabled ? "menublockitem__list-disabled" : ""
                        }`}
                      >
                        {item?.supportText}
                      </span>
                    </div>
                    {item.popup ? (
                      <a
                        className="menublockitem__list-openwith"
                        href="https://www.w3schools.com/"
                        target="_blank"
                      >
                        {ic_open_with}
                      </a>
                    ) : (
                      ""
                    )}
                  </div>
                );
              })
            ) : (
              <div className="menublockitem">No results found</div>
            )}
          </div>
        </div>
      </div>
    </OutSideClick>
  );
};

export default DropdownInput;
