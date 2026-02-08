import { useState, useEffect, useRef } from "react";
import Spinner from "./Spinner";

type CustomDropdownProps = {
    placeholder: string;
    handleSelection: (option: string) => void;
    options: string[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    isLoading: boolean;
    disabled?: boolean;
};

export default function CustomDropdown({
    searchTerm,
    setSearchTerm,
    placeholder,
    options,
    handleSelection,
    isLoading,
    disabled,
}: CustomDropdownProps) {
    const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter options when typing
    useEffect(() => {
        setFilteredOptions(
            options?.filter(option => option && option.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, options]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => !disabled && setIsOpen(true)}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full border border-zinc-400 rounded-lg p-4 h-14 text-lg ${disabled ? 'bg-zinc-100 cursor-not-allowed' : ''}`}
            />
            {isOpen && !disabled && (
                <div
                    className="absolute w-full bg-white border border-zinc-400 rounded-lg mt-1 z-50 shadow-md 
                    max-h-40 overflow-auto transition-all ease-in-out duration-200"
                >
                    {isLoading ? (
                        <div className="flex justify-center items-center h-16">
                            <Spinner />
                        </div>
                    ) : (
                        filteredOptions?.length > 0 ? (
                            filteredOptions?.map((option, index) => (
                                <p
                                    key={index}
                                    onClick={() => {
                                        handleSelection(option);
                                        setIsOpen(false);
                                        setSearchTerm(option);
                                    }}
                                    className="p-3 text-left text-lg hover:bg-zinc-300 cursor-pointer"
                                >
                                    {option}
                                </p>
                            ))
                        ) : (
                            <p className="p-3 text-center text-lg text-gray-500">No results found</p>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

// // Placeholder Spinner component (replace with your actual spinner)
// function Spinner() {
//     return <div className="w-6 h-6 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>;
// }
