"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

const FIELD_LABELS: Record<string, string> = {
  email: "Email address",
  phone: "Phone number",
  first_name: "First name",
  last_name: "Last name",
  dob: "Date of birth",
  gender: "Gender",
};

export const humanizeProfileField = (name: string): string =>
  FIELD_LABELS[name] ?? name.replace(/_/g, " ");

interface Props {
  open: boolean;
  missingFields: string[];
  onClose?: () => void;
}

const IncompleteProfileDialog: React.FC<Props> = ({
  open,
  missingFields,
  onClose,
}) => {
  const router = useRouter();

  const handleGoToSettings = () => {
    router.push("/settings/personal-info?from=incomplete");
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
      return;
    }
    router.back();
  };

  return (
    <Dialog
      open={open}
      disableEscapeKeyDown
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose?.();
      }}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        Complete your profile to continue
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Before you can list properties or onboard guests, please fill in the
          following details on your profile:
        </Typography>
        <ul className="list-disc pl-5 space-y-1">
          {missingFields.length === 0 ? (
            <li className="text-sm text-zinc-700">Your profile is missing required details.</li>
          ) : (
            missingFields.map((field) => (
              <li key={field} className="text-sm text-zinc-800">
                {humanizeProfileField(field)}
              </li>
            ))
          )}
        </ul>
        <Typography variant="caption" sx={{ mt: 2, display: "block", color: "text.secondary" }}>
          You only need to do this once. Updating these fields will unlock host
          actions across the dashboard.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleBack} color="inherit">
          Back
        </Button>
        <Button
          onClick={handleGoToSettings}
          variant="contained"
          color="primary"
          autoFocus
        >
          Go to Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IncompleteProfileDialog;
