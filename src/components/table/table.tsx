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
      <DataGrid
        rows={rows}
        columns={columns.map((col) => ({
          ...col,
          sortable: col.sortable ?? true,
          disableColumnMenu: false,
          headerClassName: "premium-table-header",
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
          "& .MuiDataGrid-main": {
            borderRadius: "12px",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#F9FAFB",
            borderBottom: "1px solid #EAECF0",
          },
          "& .premium-table-header": {
            color: "#475467",
            fontSize: "12px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #EAECF0",
            color: "#344054",
            fontSize: "14px",
          },
          "& .MuiDataGrid-row:hover": {
            backgroundColor: "#F9FAFB",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #EAECF0",
          },
          "& .MuiTablePagination-root": {
            color: "#475467",
          },
        }}
      />
    </Paper>
  );
};

export default Table;
