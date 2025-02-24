import { useState, useEffect, useRef } from "react";

type CustomDropdownProps = {
    placeholder: string;
    handleSelection: (option: string) => void;
    options: string[];
    selected: string;
};

export default function CustomDropdown({ selected, placeholder, options, handleSelection }: CustomDropdownProps) {
    const [searchTerm, setSearchTerm] = useState<string>(selected??'');
    const [filteredOptions, setFilteredOptions] = useState<string[]>(options);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter options when typing
    useEffect(() => {
        setFilteredOptions(
            options?.filter(option => option.toLowerCase().includes(searchTerm.toLowerCase()))
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
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder} 
                className="w-full border border-zinc-400 rounded-lg p-4 h-14 text-lg"
            />
            {isOpen && filteredOptions?.length > 0 && (
                <div 
                    className={`
                        absolute w-full bg-white border border-zinc-400 rounded-lg mt-1 z-50 transition-all ease-in-out duration-200 
                        shadow-md ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'} overflow-auto 
                        [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-400
                    `}
                >
                    {filteredOptions?.map((option, index) => (
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
                    ))}
                </div>
            )}
        </div>
    );
}