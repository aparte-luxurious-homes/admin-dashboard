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
    const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
    const safeItemsPerPage = Number.isFinite(itemsPerPage) && itemsPerPage > 0 ? itemsPerPage : 1;
    const lastPage = Math.max(firstPage, Math.ceil(safeTotal / safeItemsPerPage));
    const safeCurrentPage = Math.min(Math.max(currentPage, firstPage), lastPage);

    const generatePages = () => {
        let pages: (number | string)[] = [firstPage];

        if (safeCurrentPage > firstPage + 2) pages.push("...");
        if (safeCurrentPage > firstPage + 1) pages.push(safeCurrentPage - 1);
        if (safeCurrentPage !== firstPage && safeCurrentPage !== lastPage) pages.push(safeCurrentPage);
        if (safeCurrentPage < lastPage - 1) pages.push(safeCurrentPage + 1);
        if (safeCurrentPage < lastPage - 2) pages.push("...");
        if (lastPage !== firstPage) pages.push(lastPage);

        return pages.filter((item, index, arr) => item !== arr[index - 1]);
    };

    return (
        <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{safeTotal === 0 ? 0 : Math.min((safeCurrentPage - firstPage) * safeItemsPerPage + 1, safeTotal)}</span> to{" "}
                <span className="font-medium">{safeTotal === 0 ? 0 : Math.min(safeCurrentPage * safeItemsPerPage, safeTotal)}</span> of{" "}
                <span className="font-medium">{safeTotal}</span> results
            </div>
            
            <div className="flex items-center gap-1">
                <button
                    className={`px-3 py-1.5 rounded-lg border border-gray-300 flex items-center gap-1 text-sm ${
                        safeCurrentPage === firstPage 
                            ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400' 
                            : 'cursor-pointer bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => safeCurrentPage > firstPage && setPage(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === firstPage}
                >
                    <ArrowIcon className="w-3.5 h-3.5" color="currentColor" />
                    <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                    {generatePages().map((page, index) => (
                        <button
                            key={index}
                            className={`min-w-[2.5rem] h-9 rounded-lg text-sm font-medium ${
                                page === "..." 
                                    ? "text-gray-400 cursor-default" 
                                    : safeCurrentPage === page
                                        ? "bg-primary text-white"
                                        : "text-gray-700 hover:bg-gray-100 cursor-pointer"
                            }`}
                            onClick={() => typeof page === "number" && setPage(page)}
                            disabled={page === "..."}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <button
                    className={`px-3 py-1.5 rounded-lg border border-gray-300 flex items-center gap-1 text-sm ${
                        safeCurrentPage === lastPage 
                            ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400' 
                            : 'cursor-pointer bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => safeCurrentPage < lastPage && setPage(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === lastPage}
                >
                    <span>Next</span>
                    <ArrowIcon className="w-3.5 h-3.5 rotate-180" color="currentColor" />
                </button>
            </div>
        </div>
    );
}