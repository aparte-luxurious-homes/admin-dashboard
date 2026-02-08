// components/AlertDialogProvider.tsx
"use client";

import { useSelector, useDispatch } from "react-redux";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { RootState } from "@/src/lib/store";
import { closeAlert } from "@/src/lib/slices/alertDialogSlice";

const redButtons = [
  'Delete',
  'Reject',
]

export const AlertDialogProvider = () => {
  const dispatch = useDispatch();
  const { 
    isOpen, 
    title, 
    description, 
    confirmText, 
    cancelText, 
    onConfirm
} = useSelector((state: RootState) => state.alertDialog);

  if (!isOpen) return null; // Only render when open

  return (
    <AlertDialog open={isOpen} onOpenChange={() => dispatch(closeAlert())}>
      <AlertDialogContent className="text-zinc-800 text-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-base mt-2 text-zinc-800">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={`text-white bg-zinc-500 hover:bg-zinc-600 font-medium rounded-lg px-5 py-2.5 text-lg mt-2 mr-1`}
            onClick={() => dispatch(closeAlert())}>
            {cancelText || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            className={`
              text-white font-medium rounded-lg px-5 py-2.5 text-lg
              ${confirmText && redButtons.includes(confirmText) ? 'bg-red-600 hover:bg-red-700' : 'bg-primary/90 hover:bg-primary'}
            `}
            onClick={() => {
              if (onConfirm) onConfirm();
              dispatch(closeAlert());
            }}
          >
            {confirmText || "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
