import { useState } from "react";

interface Option {
  label: string;
  value: string;
}

interface MultipleChoiceProps {
  options: string[];
  selected?: string[] | null;
  onChange: (value: string[]) => void;
}

export default function MultipleChoice({ options, selected = null, onChange }: MultipleChoiceProps) {
  const [selectedArray, setSelectedArray] = useState<string[]>([]);

  function toggleSelection(option: string) {
    setSelectedArray(prev => {
        const newSelection = prev.includes(option)
            ? prev.filter(item => item !== option) // Remove the item
            : [...prev, option]; // Add the item

        onChange(newSelection); // Only call onChange once with the correct updated list
        return newSelection;
    });
  }


  return (
    <div className="flex gap-3">
      {options.map((option, index) => (
        <p
          key={index}
          className={`w-fit h-12 flex items-center justify-center p-5 border rounded-lg transition-all cursor-pointer font-medium
            ${selectedArray.includes(option)
              ? "bg-primary/90 text-white border-primary/90" 
              : "border-gray-300 text-gray-700 hover:border-primary hover:text-primary"}
          `}
          onClick={() => toggleSelection(option)} 
        >
          {option}
        </p>
      ))}
    </div>
  );
}
