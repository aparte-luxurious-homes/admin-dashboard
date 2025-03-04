import { IoLocationOutline } from "react-icons/io5";
import { CalendarIcon, ClockIcon, UsersIcon } from "../icons";

export default function BookingDetailView({ bookingId }: { bookingId: number }) {
    return(
        <div className="p-10 w-full">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl p-10 min-h-[50vh]">
                <div className="w-full mt-10 items-center">
                    <h3 className="text-2xl font-normal text-zinc-800 leading-3 my-4">
                        Magodo Crystal Springs Hotel and Resort
                    </h3>
                    <div className="flex gap-2 items-center mt-2 text-sm text-zinc-500">
                        <IoLocationOutline />
                        <p>
                            17a Abdulrahman Sanni St. Alagbado, Lagos 102213, Lagos.
                        </p>
                    </div>
                </div>

                <div className="h-px bg-zinc-100 w-full my-5" />

                <div className="w-full flex items-center gap-10 my-3 mx-0">
                    <div className="flex items-center " >
                        <p className="text-zinc-500 text-base">PropertyID</p>
                        <p className="text-zinc-900 text-base ml-3">APT203-13</p>
                    </div>
                    <div className="flex items-center" >
                        <p className="text-zinc-500 text-sm">Status</p>
                        <p className="text-zinc-600 text-sm ml-3 px-4 py-1 bg-zinc-300 rounded-lg">Canceled</p>
                    </div>
                    <div className="flex items-center" >
                        <CalendarIcon color="#a6a4a4"/>
                        <p className="text-zinc-900 text-sm ml-2">24th November, 2024</p>
                    </div>
                    <div className="flex items-center" >
                        <p className="text-zinc-500 text-base">Property Type</p>
                        <p className="text-zinc-900 text-base ml-3">Duplex</p>
                    </div>
                    <div className="flex items-center" >
                        <p className="text-zinc-500 text-base">Agent</p>
                        <p className="text-zinc-900 text-base ml-3">Duplex</p>
                    </div>
                </div>

                <section className="w-full my-5">
                    <div className="w-full p-5 bg-zinc-300 flex gap-3">
                        <UsersIcon color='#8a8a8a'/>
                        <p className="text-base ">
                            Guest Information
                        </p>
                    </div>
                    <div className="mt-2 p-5">
                        <div className="grid grid-cols-3 grid-cols grid-flow-row">
                            <div>
                                <div>
                                    
                                </div>
                            </div>

                        </div>

                    </div>
                </section>
            </div>
        </div>
    );
};