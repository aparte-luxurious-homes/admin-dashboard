import React from 'react';

interface InputGroupProps {
  inputType?: string;
  label?: string;
  required?: boolean;
  value?: string | number;
  inputName?: string;
  placeHolder?: string;
  inputMin?: string | number;
  inputMax?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  defaultValue?: string | number;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
}

const InputGroup: React.FC<InputGroupProps> = ({
  inputType = "",
  label = "",
  required = false,
  multiline = false,
  value,
  inputName = "",
  onChange,
  inputMin,
  inputMax,
  placeHolder = "",
  defaultValue,
  disabled = false,
  rows = 4,
}) => {
  return (
    <div className="text-left">
      {label && (
        <p className="text-[#101928] mb-0 text-sm font-medium mt-1">
          {label} {required ? <span className="text-[#DD514D] text-base ml-[3px] mt-1">*</span> : null}
        </p>
      )}
      {multiline ? (
        <textarea
        className="w-full h-[70px] border border-[#D0D5DD] rounded-lg p-1.5 text-[#667185]"
         defaultValue={defaultValue} rows={rows} value={value} name={inputName} onChange={onChange} placeholder={placeHolder} disabled={disabled} />
      ) : (
        <input
          type={inputType}
          name={inputName}
          value={value}
          onChange={onChange}
          min={inputMin}
          max={inputMax}
          placeholder={placeHolder}
          defaultValue={defaultValue}
          disabled={disabled}
          className="w-full h-[46px] box-border pl-2.5 pr-2.5 border border-[#d1d5db] mt-1 rounded-lg bg-white text-[#667185]"
        />
      )}
    </div>
  );
};

export default InputGroup;
