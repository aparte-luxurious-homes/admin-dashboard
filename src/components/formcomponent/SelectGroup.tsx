import React, { ReactNode } from "react";

interface SelectGroup {
    label?: string;
    required?: boolean;
    children: ReactNode;
}

const SelectGroup: React.FC<SelectGroup> = ({
    label = "",
    required = false,
    children
}) => {
  return (
    <div className="text-left">
     {label && (
        <p className="text-[#101928] mb-0 text-sm font-medium mt-1">
          {label} {required ? <span className="text-[#DD514D] text-base ml-[3px] mt-1">*</span> : null}
        </p>
      )}
      {children}
    </div>
  );
}

export default SelectGroup;