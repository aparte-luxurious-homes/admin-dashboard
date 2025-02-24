// components/AlertDialogProvider.tsx
"use client";

import { useSelector, useDispatch } from "react-redux";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { RootState } from "@/src/lib/store";
import { closeAlert } from "@/src/lib/slices/alertDialogSlice";

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
      <AlertDialogContent className="text-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={`text-zinc-800 border border-zinc-500 hover:bg-zinc-500 hover:text-white`}
            onClick={() => dispatch(closeAlert())}>
            {cancelText || "Cancel"}
          </AlertDialogCancel>
          <AlertDialogAction
            className={`
              text-white 
              ${confirmText && confirmText === 'Delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary/85 hover:bg-primary'}
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
