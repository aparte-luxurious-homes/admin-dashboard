import useStyles from "./styles";
import PropTypes from "prop-types";
import classNames from "classnames";
import { FC, ReactNode } from "react";

interface ButtonProps {
  buttonName?: string;
  buttonIcon?: ReactNode;
  color?: "btndefault" | "btnblack" | "btnfontprimary" | "btnfontsecondary" | "btndanger" | "btnsuccess";
  variant?: "primary" | "danger" | "primaryoutline" | "dangeroutline" | "success";
  buttonSize?: "small" | "medium" | "large" | "fluid" | "full";
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const Button: FC<ButtonProps> = ({ buttonName, buttonIcon, color, variant, buttonSize, onClick, disabled, isLoading }) => {
  const classes = useStyles();
  
  const getButtonSize = () => {
    switch (buttonSize) {
      case "small":
        return classes.buttonsm;
      case "medium":
        return classes.buttonmd;
      case "large":
        return classes.buttonlg;
      case "fluid":
        return classes.buttonfluid;
      case "full":
        return classes.buttonfull;
      default:
        return "";
    }
  };

  const getButtonVariant = () => {
    switch (variant) {
      case "primary":
        return classes.primary;
      case "danger":
        return classes.danger;
      case "primaryoutline":
        return classes.primaryOutline;
      case "dangeroutline":
        return classes.dangerOutline;
      case "success":
        return classes.success;
      default:
        return "";
    }
  };

  const getButtonColor = () => {
    switch (color) {
      case "btndefault":
        return classes.btnwhite;
      case "btnblack":
        return classes.btnblack;
      case "btnfontprimary":
        return classes.btnfontprimary;
      case "btnfontsecondary":
        return classes.btnfontsecondary;
      case "btndanger":
        return classes.btndanger;
      case "btnsuccess":
        return classes.btnsuccess;
      default:
        return "";
    }
  };

  return (
    <button className={classNames(classes.button, getButtonVariant(), getButtonColor(), getButtonSize())} onClick={onClick} disabled={disabled}>
      {isLoading ? "Please wait..." : <>{buttonIcon}{buttonName}</>}
    </button>
  );
};

Button.propTypes = {
  buttonSize: PropTypes.oneOf(["small", "medium", "large", "fluid", "full"]),
  variant: PropTypes.oneOf(["primary", "danger", "primaryoutline", "dangeroutline", "success"]),
  buttonName: PropTypes.string,
  buttonIcon: PropTypes.object,
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool
};

export default Button;
