import { useEffect, useRef, useState } from "react";
import { ArrowIcon } from "../icons";

export default function CustomDropdown({ selected, handleSelection, options }: { selected: string, handleSelection: (option: any) => void; options: any[] }) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        // Add event listener only when dropdown is open
        if (isOpen) {
            document.addEventListener("click", handleClickOutside);
        } else {
            document.removeEventListener("click", handleClickOutside);
        }

        return () => document.removeEventListener("click", handleClickOutside);
    }, [isOpen]); // Depend on isOpen state

    return(
        <div className="relative" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)} className="relative w-full border border-zinc-400 rounded-lg p-5 h-14 mt-2 text-lg flex justify-start items-center cursor-pointer">
                <span>
                    {selected}
                </span>
                <ArrowIcon
                    className={`absolute top-[36%] right-4 transition-all ease-in-out ${isOpen ? 'rotate-[90deg]' : 'rotate-[270deg]'} `}
                    color="#A1A1AA"
                />
            </div>
            <div
                className={`
                    absolute top-[4rem] w-full shadow-zinc-300/70 shadow-md
                    flex flex-col bg-white z-50 rounded-lg border border-zinc-400 transition-all ease-in-out duration-200 
                    ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'} overflow-auto [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-400
                `}
            >
                {
                    options.map((option, index) => (
                        <p 
                            key={index}
                            onClick={() => {
                                handleSelection(option);
                                setIsOpen(false);
                            }}
                            className={`p-4 text-left text-lg hover:bg-zinc-200 text-zinc-900 cursor-pointer ${selected === option && 'bg-zinc-200'}`}
                        >
                            {option}
                        </p>
                    ))
                }
            </div>
        </div>
    );
}