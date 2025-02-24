import { useState } from "react";

interface CheckboxProps {
  label?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function CustomCheckbox({ label, checked = false, onChange }: CheckboxProps) {
  const [isChecked, setIsChecked] = useState(checked);

  const handleChange = () => {
    setIsChecked(!isChecked);
    if (onChange) onChange(!isChecked);
  };

  return (
    <label className="flex items-center gap-x-4 cursor-pointer">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className="hidden"
      />
      <div
        className={`size-6 border-2 rounded-md flex items-center justify-center transition-all ${
          isChecked ? "bg-primary border-primary" : "border-gray-400"
        }`}
      >
        {isChecked && (
          <svg
            className="size-6 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      {label && <span className="text-gray-800 text-xl">{label}</span>}
    </label>
  );
}
