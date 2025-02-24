import { ArrowIcon, DotsIcon, FilterIcon, PrinterIcon, SearchIcon } from "../icons";

export default function ListPropertiesView() {
    return (
        <div className="w-full">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl px-6 py-7 min-h-[70vh] flex flex-col items-center">
                <div className="w-full flex justify-between items-center">
                    <div className="w-1/2 flex items-center gap-5">
                        <div className="relative w-[60%]">
                            <input type="text" className="border border-zinc-500/20 bg-background rounded-lg w-full h-10 p-3 pl-10" placeholder="Search properties "/>
                            <SearchIcon className="absolute top-[25%] left-3 w-5" color="black" />
                        </div>
                        <div className="flex justify-center items-center gap-2 border border-zinc-500/20 bg-background hover:bg-zinc-300/70 cursor-pointer rounded-lg h-10 px-3 w-[20%]">
                            <p className="text-zinc-700 text-base">
                                Filter
                            </p>
                            <FilterIcon className="w-5" color="black" />
                        </div>
                    </div>
                    <button className="bg-primary hover:bg-primary/95 text-background hover:bg-teal-900/ flex justify-center items-center gap-1 rounded-lg w-48 p-1.5">
                        <p className="text-sm">
                            Print CSV
                        </p>
                        <PrinterIcon className="w-4" color="white"/>
                    </button>
                </div>
                <div className="w-full mt-6">
                    <table className="w-full border-collapse">
                        <thead className="">
                            <tr className="text-teal-600 text-[12px]">
                                <th className="bg-[#0280901A] h-10 p-5 flex justify-start items-center gap-3 rounded-tl-xl rounded-bl-xl font-medium w-full">
                                    <input 
                                        type="checkbox"
                                        className={`
                                            size-4 border-2 border-teal-600 rounded-md bg-transparent appearance-none
                                            checked:bg-teal-600 checked:border-teal-600 checked:text-[#0280901A]
                                        `}
                                    />
                                    <p>
                                        Property ID
                                    </p>
                                </th>
                                <th className="bg-[#0280901A] h-10 font-medium text-left">
                                    <p>
                                        Property Name
                                    </p>
                                </th>
                                <th className="bg-[#0280901A] h-10 font-medium text-left">
                                    <p>
                                        Property Type
                                    </p>
                                </th>
                                <th className="bg-[#0280901A] h-10 font-medium text-left">
                                    <p>
                                        {"Owner's Name"}
                                    </p>
                                </th>
                                <th className="bg-[#0280901A] h-10 font-medium text-center">
                                    <p>
                                        Verification status
                                    </p>
                                </th>
                                <th className="bg-[#0280901A] h-10 font-medium text-left">
                                    <p>
                                        Assigned agent
                                    </p>
                                </th>
                                <th className="bg-[#0280901A] h-10 font-medium  text-left">
                                    <p className="pr-2">
                                        Submission date
                                    </p>
                                </th>
                                <th className="bg-[#0280901A] h-10 rounded-tr-xl rounded-br-xl"></th>
                            </tr>
                        </thead>
                        <tbody className="text-[13px]">
                            <tr className="hover:bg-background">
                                <td className="flex items-center px-5 py-4 gap-3 border-b-2 border-b-gray-200">
                                    <input 
                                        type="checkbox"
                                        className={`
                                            size-4 border-2 border-zinc-800 rounded-md bg-transparent appearance-none
                                            checked:bg-zinc-800 checked:border-zinc-800 checked:text-zinc-200
                                        `}
                                    />
                                    <p className="pt-1">
                                        APT203-13
                                    </p>  
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 truncate max-w-[13rem]">
                                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis deleniti veniam molestias consequuntur quibusdam, delectus ea iste reprehenderit exercitationem illo tenetur deserunt sunt animi iusto, voluptatem laborum similique modi eveniet.
                                    </p>   
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 font-medium">
                                        Bungalow
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 ">
                                        Olaleye Daniel
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <div className="bg-yellow-200 text-yellow-600 rounded-lg py-1.5 w-1/2 m-auto text-center">
                                        Pending
                                    </div>
                                </td>
                                <td className="border-b-2 border-b-gray-200">Susan Esosa</td>
                                <td className="border-b-2 border-b-gray-200">5th Septmber, 2025</td>
                                <td className="border-b-2 border-b-gray-200">
                                    <DotsIcon className="w-5 -ml-12 cursor-pointer" color="black" />
                                </td>
                            </tr>
                            <tr className="hover:bg-background">
                                <td className="flex items-center px-5 py-4 gap-3 border-b-2 border-b-gray-200">
                                    <input 
                                        type="checkbox"
                                        className={`
                                            size-4 border-2 border-zinc-800 rounded-md bg-transparent appearance-none
                                            checked:bg-zinc-800 checked:border-zinc-800 checked:text-zinc-200
                                        `}
                                    />
                                    <p className="pt-1">
                                        APT203-13
                                    </p>  
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 truncate max-w-[13rem]">
                                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis deleniti veniam molestias consequuntur quibusdam, delectus ea iste reprehenderit exercitationem illo tenetur deserunt sunt animi iusto, voluptatem laborum similique modi eveniet.
                                    </p>   
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 font-medium">
                                        Bungalow
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 ">
                                        Olaleye Daniel
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <div className="bg-yellow-200 text-yellow-600 rounded-lg py-1.5 w-1/2 m-auto text-center">
                                        Pending
                                    </div>
                                </td>
                                <td className="border-b-2 border-b-gray-200">Susan Esosa</td>
                                <td className="border-b-2 border-b-gray-200">5th Septmber, 2025</td>
                                <td className="border-b-2 border-b-gray-200">
                                    <DotsIcon className="w-5 -ml-12 cursor-pointer" color="black" />
                                </td>
                            </tr>
                            <tr className="hover:bg-background">
                                <td className="flex items-center px-5 py-4 gap-3 border-b-2 border-b-gray-200">
                                    <input 
                                        type="checkbox"
                                        className={`
                                            size-4 border-2 border-zinc-800 rounded-md bg-transparent appearance-none
                                            checked:bg-zinc-800 checked:border-zinc-800 checked:text-zinc-200
                                        `}
                                    />
                                    <p className="pt-1">
                                        APT203-13
                                    </p>  
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 truncate max-w-[13rem]">
                                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis deleniti veniam molestias consequuntur quibusdam, delectus ea iste reprehenderit exercitationem illo tenetur deserunt sunt animi iusto, voluptatem laborum similique modi eveniet.
                                    </p>   
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 font-medium">
                                        Duplex
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 ">
                                        Olaleye Daniel
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <div className="bg-red-200 text-red-600 rounded-lg py-1.5 w-1/2 m-auto text-center">
                                        Rejected
                                    </div>
                                </td>
                                <td className="border-b-2 border-b-gray-200">Chinedu Okafor</td>
                                <td className="border-b-2 border-b-gray-200">5th Septmber, 2025</td>
                                <td className="border-b-2 border-b-gray-200">
                                    <DotsIcon className="w-5 -ml-12 cursor-pointer" color="black" />
                                </td>
                            </tr>
                            <tr className="hover:bg-background">
                                <td className="flex items-center px-5 py-4 gap-3 border-b-2 border-b-gray-200">
                                    <input 
                                        type="checkbox"
                                        className={`
                                            size-4 border-2 border-zinc-800 rounded-md bg-transparent appearance-none
                                            checked:bg-zinc-800 checked:border-zinc-800 checked:text-zinc-200
                                        `}
                                    />
                                    <p className="pt-1">
                                        APT203-13
                                    </p>  
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 truncate max-w-[13rem]">
                                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis deleniti veniam molestias consequuntur quibusdam, delectus ea iste reprehenderit exercitationem illo tenetur deserunt sunt animi iusto, voluptatem laborum similique modi eveniet.
                                    </p>   
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 font-medium">
                                        Hotel
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 ">
                                        Olaleye Daniel
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <div className="bg-green-200 text-green-600 rounded-lg py-1.5 w-1/2 m-auto text-center">
                                        Verified
                                    </div>
                                </td>
                                <td className="border-b-2 border-b-gray-200">Adewale Jiminus</td>
                                <td className="border-b-2 border-b-gray-200">5th Septmber, 2025</td>
                                <td className="border-b-2 border-b-gray-200">
                                    <DotsIcon className="w-5 -ml-12 cursor-pointer" color="black" />
                                </td>
                            </tr>
                            <tr className="hover:bg-background">
                                <td className="flex items-center px-5 py-4 gap-3 border-b-2 border-b-gray-200">
                                    <input 
                                        type="checkbox"
                                        className={`
                                            size-4 border-2 border-zinc-800 rounded-md bg-transparent appearance-none
                                            checked:bg-zinc-800 checked:border-zinc-800 checked:text-zinc-200
                                        `}
                                    />
                                    <p className="pt-1">
                                        APT203-13
                                    </p>  
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 truncate max-w-[13rem]">
                                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis deleniti veniam molestias consequuntur quibusdam, delectus ea iste reprehenderit exercitationem illo tenetur deserunt sunt animi iusto, voluptatem laborum similique modi eveniet.
                                    </p>   
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 font-medium">
                                        Hotel
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 ">
                                        Olaleye Daniel
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <div className="bg-green-200 text-green-600 rounded-lg py-1.5 w-1/2 m-auto text-center">
                                        Verified
                                    </div>
                                </td>
                                <td className="border-b-2 border-b-gray-200">Adewale Jiminus</td>
                                <td className="border-b-2 border-b-gray-200">5th Septmber, 2025</td>
                                <td className="border-b-2 border-b-gray-200">
                                    <DotsIcon className="w-5 -ml-12 cursor-pointer" color="black" />
                                </td>
                            </tr>
                            <tr className="hover:bg-background">
                                <td className="flex items-center px-5 py-4 gap-3 border-b-2 border-b-gray-200">
                                    <input 
                                        type="checkbox"
                                        className={`
                                            size-4 border-2 border-zinc-800 rounded-md bg-transparent appearance-none
                                            checked:bg-zinc-800 checked:border-zinc-800 checked:text-zinc-200
                                        `}
                                    />
                                    <p className="pt-1">
                                        APT203-13
                                    </p>  
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 truncate max-w-[13rem]">
                                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis deleniti veniam molestias consequuntur quibusdam, delectus ea iste reprehenderit exercitationem illo tenetur deserunt sunt animi iusto, voluptatem laborum similique modi eveniet.
                                    </p>   
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 font-medium">
                                        Duplex
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 ">
                                        Olaleye Daniel
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <div className="bg-red-200 text-red-600 rounded-lg py-1.5 w-1/2 m-auto text-center">
                                        Rejected
                                    </div>
                                </td>
                                <td className="border-b-2 border-b-gray-200">Mike Tyson</td>
                                <td className="border-b-2 border-b-gray-200">5th Septmber, 2025</td>
                                <td className="border-b-2 border-b-gray-200">
                                    <DotsIcon className="w-5 -ml-12 cursor-pointer" color="black" />
                                </td>
                            </tr>
                            <tr className="hover:bg-background">
                                <td className="flex items-center px-5 py-4 gap-4 border-b-2 border-b-gray-200">
                                    <input 
                                        type="checkbox"
                                        className={`
                                            size-4 border-2 border-zinc-800 rounded-md bg-transparent appearance-none
                                            checked:bg-zinc-800 checked:border-zinc-800 checked:text-zinc-200
                                        `}
                                    />
                                    <p className="pt-1">
                                        APT203-13
                                    </p>  
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 truncate max-w-[13rem]">
                                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis deleniti veniam molestias consequuntur quibusdam, delectus ea iste reprehenderit exercitationem illo tenetur deserunt sunt animi iusto, voluptatem laborum similique modi eveniet.
                                    </p>   
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 font-medium">
                                        Duplex
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 ">
                                        Olaleye Daniel
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <div className="bg-green-200 text-green-600 rounded-lg py-1.5 w-1/2 m-auto text-center">
                                        Verified
                                    </div>
                                </td>
                                <td className="border-b-2 border-b-gray-200">Christopher Robinson</td>
                                <td className="border-b-2 border-b-gray-200">5th Septmber, 2025</td>
                                <td className="border-b-2 border-b-gray-200">
                                    <DotsIcon className="w-5 -ml-12 cursor-pointer" color="black" />
                                </td>
                            </tr>
                            <tr className="hover:bg-background">
                                <td className="flex items-center px-5 py-4 gap-3 border-b-2 border-b-gray-200">
                                    <input 
                                        type="checkbox"
                                        className={`
                                            size-4 border-2 border-zinc-800 rounded-md bg-transparent appearance-none
                                            checked:bg-zinc-800 checked:border-zinc-800 checked:text-zinc-200
                                        `}
                                    />
                                    <p className="pt-1">
                                        APT203-13
                                    </p>  
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 truncate max-w-[13rem]">
                                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Blanditiis deleniti veniam molestias consequuntur quibusdam, delectus ea iste reprehenderit exercitationem illo tenetur deserunt sunt animi iusto, voluptatem laborum similique modi eveniet.
                                    </p>   
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 font-medium">
                                        Duplex
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <p className="pt-1 ">
                                        Olaleye Daniel
                                    </p>
                                </td>
                                <td className="border-b-2 border-b-gray-200">
                                    <div className="bg-yellow-200 text-yellow-600 rounded-lg py-1.5 w-1/2 m-auto text-center">
                                        Pending
                                    </div>
                                </td>
                                <td className="border-b-2 border-b-gray-200">Obi Peterson</td>
                                <td className="border-b-2 border-b-gray-200">5th Septmber, 2025</td>
                                <td className="border-b-2 border-b-gray-200">
                                    <DotsIcon className="w-5 -ml-12 cursor-pointer" color="black" />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="mt-10 w-1/3 mx-auto">
                <div className="w-full flex justify-between items-center">
                    <div className="bg-zinc-900 hover:bg-black p-2 rounded-md cursor-pointer">
                        <ArrowIcon className="w-4" color="white" />
                    </div>

                    <div className="cursor-pointer p-2 rounded-md">
                        <p className="text-zinc-900 text-sm font-bold">
                            1
                        </p>
                    </div>
                    <div className="cursor-pointer p-2 rounded-md">
                        <p className="text-zinc-700 hover:text-zinc-900 text-sm font-normal hover:font-medium">
                            2
                        </p>
                    </div>
                    <div className="cursor-pointer p-2 rounded-md">
                        <p className="text-zinc-700 hover:text-zinc-900 text-sm font-normal hover:font-medium">
                            3
                        </p>
                    </div>
                    <div className=" p-2 rounded-md">
                        <p className="text-zinc-700 text-sm font-normal">
                            ...
                        </p>
                    </div>
                    <div className="cursor-pointer p-2 rounded-md">
                        <p className="text-zinc-700 hover:text-zinc-900 hover:font-medium text-sm font-normal">
                            13
                        </p>
                    </div>

                    <div className="bg-zinc-900 hover:bg-black p-2 rounded-md cursor-pointer">
                        <ArrowIcon className="w-4 rotate-180" color="white" />
                    </div>
                </div>
            </div>
        </div>
    );
};