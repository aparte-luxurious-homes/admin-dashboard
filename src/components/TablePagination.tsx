import { ArrowIcon } from "./icons";

export default function TablePagination({
    total,
    firstPage = 1,
    itemsPerPage,
    setPage,
    currentPage,
}: {
    total: number,
    firstPage?: number,
    itemsPerPage: number,
    setPage: (page: number) => void,
    currentPage: number,
}) {
    const lastPage = Math.ceil(total / itemsPerPage);

    const generatePages = () => {
        let pages: (number | string)[] = [firstPage];

        if (currentPage > firstPage + 2) pages.push("...");
        if (currentPage > firstPage + 1) pages.push(currentPage - 1);
        if (currentPage !== firstPage && currentPage !== lastPage) pages.push(currentPage);
        if (currentPage < lastPage - 1) pages.push(currentPage + 1);
        if (currentPage < lastPage - 2) pages.push("...");
        if (lastPage !== firstPage) pages.push(lastPage);

        return pages.filter((item, index, arr) => item !== arr[index - 1]);
    };

    return (
        <div className="mt-10 w-1/3 mx-auto">
            <div className="w-full flex justify-between items-center">
                <div 
                    className={`bg-zinc-900 hover:bg-black p-2 rounded-md ${currentPage === firstPage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
                    onClick={() => currentPage > firstPage && setPage(currentPage - 1)}
                >
                    <ArrowIcon className="w-4" color="white" />
                </div>

                {generatePages().map((page, index) => (
                    <div
                        key={index}
                        className={`p-2 rounded-md ${page === "..." ? "text-zinc-700" : "cursor-pointer text-zinc-700 hover:text-zinc-900 hover:font-medium"} ${currentPage === page ? "text-zinc-900 font-bold" : ""}`}
                        onClick={() => typeof page === "number" && setPage(page)}
                    >
                        <p className="text-sm font-normal">{page}</p>
                    </div>
                ))}

                <div 
                    className={`bg-zinc-900 hover:bg-black p-2 rounded-md ${currentPage === lastPage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} 
                    onClick={() => currentPage < lastPage && setPage(currentPage + 1)}
                >
                    <ArrowIcon className="w-4 rotate-180" color="white" />
                </div>
            </div>
        </div>
    );
}