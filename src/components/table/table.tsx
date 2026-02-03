import React from "react";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";

interface TableProps<T> {
  columns: GridColDef[];
  rows: T[];
  getRowId: (row: T) => number | string;
  pagination?: boolean;
  loading?: boolean;
  rowCount?: number;
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  paginationMode?: "client" | "server";
}

const Table = <T,>({
  columns,
  rows,
  getRowId,
  pagination = false,
  loading = false,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  paginationMode = "client",
}: TableProps<T>) => {
  return (
    <Paper elevation={0} sx={{ border: "none", boxShadow: "none", width: "100%", overflow: "hidden" }}>
      {/* Mobile: Horizontal scroll wrapper with indicators */}
      <div className="relative w-full overflow-x-auto 
                      [&::-webkit-scrollbar]:h-2 
                      [&::-webkit-scrollbar-track]:bg-gray-100 
                      [&::-webkit-scrollbar-thumb]:bg-gray-300 
                      [&::-webkit-scrollbar-thumb]:rounded-full
                      md:[&::-webkit-scrollbar]:h-3">
        {/* Scroll shadow indicators */}
        <div className="md:hidden absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"></div>
        <div className="md:hidden absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"></div>

        <DataGrid
          rows={rows}
          columns={columns.map((col) => ({
            ...col,
            sortable: col.sortable ?? true,
            disableColumnMenu: false,
            headerClassName: "premium-table-header",
            minWidth: col.minWidth || 100, // Ensure minimum width for mobile
          }))}
          getRowId={getRowId}
          loading={loading}
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={onPaginationModelChange}
          paginationMode={paginationMode}
          {...(pagination && { pagination: true })}
          pageSizeOptions={[5, 10, 25, 50]}
          hideFooter={!pagination}
          disableRowSelectionOnClick
          sx={{
            border: 0,
            minWidth: { xs: '600px', sm: '100%' }, // Force horizontal scroll on mobile
            "& .MuiDataGrid-main": {
              borderRadius: "12px",
            },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: "#F9FAFB",
              borderBottom: "1px solid #EAECF0",
            },
            "& .premium-table-header": {
              color: "#475467",
              fontSize: { xs: "11px", sm: "12px" },
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid #EAECF0",
              color: "#344054",
              fontSize: { xs: "13px", sm: "14px" },
              padding: { xs: "8px", sm: "16px" },
            },
            "& .MuiDataGrid-row": {
              minHeight: { xs: "48px !important", sm: "52px !important" }, // Better touch targets
              "&:hover": {
                backgroundColor: "#F9FAFB",
              },
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "1px solid #EAECF0",
              minHeight: { xs: "48px", sm: "52px" },
            },
            "& .MuiTablePagination-root": {
              color: "#475467",
            },
            "& .MuiTablePagination-toolbar": {
              minHeight: { xs: "48px", sm: "52px" },
            },
            "& .MuiTablePagination-actions button": {
              minWidth: "44px",
              minHeight: "44px", // Touch-friendly pagination buttons
            },
          }}
        />
      </div>
    </Paper>
  );
};

export default Table;
