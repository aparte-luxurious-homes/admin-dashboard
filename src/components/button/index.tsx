import useStyles from "./styles";
import classNames from "classnames";
import { FC, ReactNode } from "react";

interface ButtonProps {
  buttonName?: string | ReactNode;
  color?: "btndefault" | "btnblack" | "btnfontprimary" | "btnfontsecondary" | "btndanger" | "btnsuccess" | "btnwhite";
  variant?: "primary" | "danger" | "primaryoutline" | "dangeroutline" | "success";
  buttonSize?: "small" | "medium" | "large" | "fluid" | "full";
  onClick?: (event: React.MouseEvent<HTMLButtonElement> | React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  isLoading?: boolean;
  type?: "button" | "submit" | "reset";
}

const Button: FC<ButtonProps> = ({ buttonName, color, variant, buttonSize, onClick, disabled, isLoading, type }) => {
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
    <button className={classNames(classes.button, getButtonVariant(), getButtonColor(), getButtonSize())} onClick={onClick} disabled={disabled} type={type}>
      {isLoading ? "Please wait..." : <>{buttonName}</>}
    </button>
  );
};

export default Button;
