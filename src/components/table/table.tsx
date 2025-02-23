import React from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";

interface TableProps<T> {
  columns: GridColDef[];
  rows: T[];
  getRowId: (row: T) => string;
  pagination: boolean
}

const Table = <T,>({ columns, rows, getRowId, pagination = false }: TableProps<T>) => {
  return (
    <Paper  elevation={0} sx={{ border: "none", boxShadow: "none" }}>
      <DataGrid
        rows={rows}
        columns={columns.map((col) => ({ ...col, sortable: false, disableColumnMenu: true }))} 
        getRowId={getRowId}
        pagination={pagination ? true : undefined}
        pageSizeOptions={pagination ? [5, 10] : undefined}
        paginationMode={pagination ? "client" : undefined}
        hideFooter={!pagination}
        disableColumnFilter={!pagination}
        checkboxSelection={false}
        sx={{
          border: 0,
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "rgba(2, 128, 144)",
            color: "#028090",
            fontSize: "12px",
            fontWeight: 500,
          },
          "& .MuiDataGrid-columnSeparator": {
            display: "none",
          },
          "& .MuiCheckbox-root": {
            padding: "0px",
          },
          "& .MuiSvgIcon-root": {
            fontSize: "12px",
          },
        }}
      />
    </Paper>
  );
};

export default Table;
