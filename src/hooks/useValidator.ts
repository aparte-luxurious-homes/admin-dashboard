import { useState } from "react";
import SimpleReactValidator from "simple-react-validator";

const useValidator = (customMessage: Record<string, string> = {}, customValidator: Record<string, any> = {}) => {
  const [show, setShow] = useState(false);

  const validator = new SimpleReactValidator({
    className: "text-[#DD514D]",
    messages: customMessage,
    validators: customValidator,
  });

  const triggerValidation = () => {
    setShow(true);
  };

  if (show) {
    validator.showMessages();
  }

  return [validator, triggerValidation] as const;
};

export default useValidator;