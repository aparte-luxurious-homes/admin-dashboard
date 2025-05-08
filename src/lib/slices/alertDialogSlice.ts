// store/slices/alertDialogSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Type for alert options
type AlertDialogState = {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
};

// Initial state
const initialState: AlertDialogState = {
  isOpen: false,
};

// Slice definition
const alertDialogSlice = createSlice({
  name: "alertDialog",
  initialState,
  reducers: {
    showAlert: (state, action: PayloadAction<Omit<AlertDialogState, "isOpen">>) => {
      return { ...action.payload, isOpen: true };
    },
    closeAlert: (state) => {
      return { ...state, isOpen: false };
    },
  },
});

// Export actions
export const { showAlert, closeAlert } = alertDialogSlice.actions;
export default alertDialogSlice.reducer;
