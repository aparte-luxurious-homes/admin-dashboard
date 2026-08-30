"use client";

import { MESSAGES } from '@/src/lib/messages';
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  AccountBalance as BankIcon,
  AccountBalanceWallet as WalletIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { useAuth } from "@/src/hooks/useAuth";
import toast from "react-hot-toast";

interface Wallet {
  id: string;
  balance: string | number;
  currency: string;
  pending_cash?: string | number;
}

interface PayoutAccount {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_verified: boolean;
}

interface Bank {
  id: string;
  name: string;
  code: string;
}

const formatCurrency = (
  amount: string | number | undefined,
  currency = "NGN",
) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
  }).format(Number(amount || 0));
};

const WalletPage = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [payoutAccounts, setPayoutAccounts] = useState<PayoutAccount[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isAddBankOpen, setIsAddBankOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  // Delete dialog state
  const [deleteAccount, setDeleteAccount] = useState<PayoutAccount | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Add bank form states
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bvn, setBvn] = useState("");
  const [hasBvn, setHasBvn] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [addBankError, setAddBankError] = useState("");
  const [addBankSuccess, setAddBankSuccess] = useState("");

  // Withdraw form states
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedPayoutId, setSelectedPayoutId] = useState("");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalLimitStatus, setWithdrawalLimitStatus] = useState(false);

  const amount = Number(withdrawAmount);
  useEffect(() => {
    if (amount === 0) {
      setWithdrawalLimitStatus(false);
    } else if (amount < 5000) {
      setWithdrawalLimitStatus(true);
    } else {
      setWithdrawalLimitStatus(false);
    }
  }, [withdrawAmount,amount]);

  const formatError = (err: any): string => {
    const detail = err?.response?.data?.detail || err?.message || err;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail.map((e: any) => e.msg || JSON.stringify(e)).join(", ");
    }
    if (typeof detail === "object") {
      return detail.message || detail.msg || JSON.stringify(detail);
    }
    return "An unexpected error occurred";
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const walletRes = await axiosRequest.get(API_ROUTES.wallet.base);
      const wallets = walletRes?.data?.data?.items || [];
      const ngnWallet =
        wallets.find((w: any) => w.currency === "NGN") || wallets[0];
      setWallet(ngnWallet);

      if (ngnWallet) {
        const payoutRes = await axiosRequest.get(
          API_ROUTES.wallet.payoutAccounts.base(ngnWallet.id),
        );
        setPayoutAccounts(payoutRes?.data?.data?.items || []);
      }

      const banksRes = await axiosRequest.get("/wallets/banks");
      setBanks(banksRes?.data?.data || []);

      const profileRes = await axiosRequest.get("/profile");
      setHasBvn(!!profileRes?.data?.data?.profile?.bvn);
    } catch (err: any) {
      setError(formatError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-resolve account name when account number + bank + bvn are ready
  useEffect(() => {
    const effectiveBvn = hasBvn
      ? undefined
      : bvn.length === 11
        ? bvn
        : undefined;
    if (accountNumber.length === 10 && bankCode && (hasBvn || effectiveBvn)) {
      setIsResolving(true);
      setAddBankError("");
      const params = new URLSearchParams({
        account_number: accountNumber,
        bank_code: bankCode,
      });
      if (effectiveBvn) params.append("bvn", effectiveBvn);
      axiosRequest
        .get(`/wallets/resolve-account?${params.toString()}`)
        .then((res) => {
          if (res.data?.data?.account_name)
            setAccountName(res.data.data.account_name);
        })
        .catch((err: any) => {
          setAddBankError(formatError(err));
        })
        .finally(() => setIsResolving(false));
    }
  }, [accountNumber, bankCode, bvn, hasBvn]);

  const handleAddBank = async () => {
    if (!wallet) return;
    setAddBankError("");
    setAddBankSuccess("");

    const selectedBank = banks.find((b) => b.code === bankCode);

    try {
      const res = await axiosRequest.post(
        API_ROUTES.wallet.payoutAccounts.base(wallet.id),
        {
          account_name: accountName,
          account_number: accountNumber,
          bank_name: selectedBank?.name || "Unknown Bank",
          bank_code: bankCode,
          wallet_id: wallet.id,
          user_id: user?.id,
          ...(!hasBvn && bvn ? { bvn } : {}),
        },
      );

      setAddBankSuccess("Bank account added successfully!");

      if (res.data?.data?.id) {
        try {
          await axiosRequest.post(
            API_ROUTES.wallet.payoutAccounts.verify(
              wallet.id,
              res.data.data.id,
            ),
          );
        } catch (e: any) {
          toast.error(
            e?.response?.data?.detail ||
              "An error occurred while verifying the bank account",
          );
        }
      }

      setTimeout(() => {
        setIsAddBankOpen(false);
        setBankCode("");
        setAccountNumber("");
        setAccountName("");
        setBvn("");
        setAddBankSuccess("");
        fetchData();
      }, 1500);
    } catch (err: any) {
      setAddBankError(formatError(err));
    }
  };

  const handleVerifyBank = async (accountId: string) => {
    if (!wallet) return;
    try {
      await axiosRequest.post(
        API_ROUTES.wallet.payoutAccounts.verify(wallet.id, accountId),
      );
      fetchData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ||
          "An error occurred while verifying the bank account",
      );
    }
  };

  // Delete: open confirmation dialog
  const handleOpenDelete = (acc: PayoutAccount) => {
    setDeleteAccount(acc);
  };

  const handleCloseDelete = () => {
    setDeleteAccount(null);
  };

  const handleConfirmDelete = async () => {
    if (!wallet || !deleteAccount) return;
    setIsDeleting(true);
    try {
      await axiosRequest.delete(
        API_ROUTES.wallet.payoutAccounts.details(wallet.id, deleteAccount.id),
      );
      toast.success(MESSAGES.MSG_BANK_ACCOUNT_REMOVED_SUCCESSFULLY);
      handleCloseDelete();
      fetchData();
    } catch (err: any) {
      toast.error(formatError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!wallet || !user) return;
    setWithdrawError("");
    setWithdrawSuccess("");
    setIsWithdrawing(true);

    if (amount < 5000) return;

    try {
      await axiosRequest.post(API_ROUTES.wallet.withdraw(wallet.id), {
        amount: withdrawAmount,
        payout_id: selectedPayoutId,
        currency: wallet.currency || "NGN",
        description: "Wallet Withdrawal",
        user_id: user.id,
        wallet_id: wallet.id,
      });

      setWithdrawSuccess("Withdrawal initiated successfully!");
      setTimeout(() => {
        setIsWithdrawOpen(false);
        setWithdrawAmount("");
        setSelectedPayoutId("");
        setWithdrawSuccess("");
        fetchData();
      }, 2000);
    } catch (err: any) {
      setWithdrawError(formatError(err));
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={fetchData} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#333" }}
      >
        My Wallet
      </Typography>

      <Grid container spacing={3}>
        {/* Balance Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: "linear-gradient(135deg, #028090 0%, #005662 100%)",
              color: "white",
              borderRadius: 3,
              boxShadow: "0 8px 20px rgba(2, 128, 144, 0.2)",
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{ opacity: 0.9, mb: 1 }}
              >
                <WalletIcon />
                <Typography variant="subtitle1">Available Balance</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: "bold", mb: 2 }}>
                {formatCurrency(wallet?.balance, wallet?.currency)}
              </Typography>
              <Button
                variant="contained"
                onClick={() => setIsWithdrawOpen(true)}
                disabled={!wallet || parseFloat(wallet.balance as string) <= 0}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                  textTransform: "none",
                  fontWeight: "bold",
                  px: 4,
                }}
              >
                Withdraw Funds
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Saved Banks Card */}
        <Grid item xs={12} md={6}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#028090" }}
            >
              Saved Bank Accounts
            </Typography>
            <Button
              startIcon={<AddIcon />}
              variant="outlined"
              size="small"
              onClick={() => setIsAddBankOpen(true)}
              sx={{ color: "#028090", borderColor: "#028090" }}
            >
              Add Bank
            </Button>
          </Box>
          <Card
            sx={{ borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
          >
            <List sx={{ p: 0 }}>
              {payoutAccounts.length === 0 ? (
                <ListItem>
                  <ListItemText
                    primary="No bank accounts added yet"
                    secondary="Add an account to enable withdrawals"
                  />
                </ListItem>
              ) : (
                payoutAccounts.map((acc, index) => (
                  <React.Fragment key={acc.id}>
                    {index > 0 && (
                      <Box sx={{ borderTop: "1px solid rgba(0,0,0,0.05)" }} />
                    )}
                    <ListItem
                      sx={{ py: 2, pr: 1 }}
                      secondaryAction={
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {!acc.is_verified && (
                            <Button
                              size="small"
                              onClick={() => handleVerifyBank(acc.id)}
                              sx={{ mr: 0.5, fontSize: "0.75rem" }}
                            >
                              Verify
                            </Button>
                          )}
                          <Tooltip title="Remove bank account">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDelete(acc)}
                              sx={{
                                color: "text.secondary",
                                "&:hover": { color: "error.main" },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <BankIcon
                              fontSize="small"
                              sx={{ color: "action.active" }}
                            />
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 500 }}
                            >
                              {acc.bank_name}
                            </Typography>
                            {acc.is_verified ? (
                              <Chip
                                label="Verified"
                                size="small"
                                color="success"
                                sx={{ height: 20, fontSize: "0.7rem" }}
                              />
                            ) : (
                              <Chip
                                label="Unverified"
                                size="small"
                                color="warning"
                                sx={{ height: 20, fontSize: "0.7rem" }}
                              />
                            )}
                          </Box>
                        }
                        secondary={`${acc.account_number} • ${acc.account_name}`}
                      />
                    </ListItem>
                  </React.Fragment>
                ))
              )}
            </List>
          </Card>
        </Grid>
      </Grid>

      {/* Add Bank Dialog */}
      <Dialog
        open={isAddBankOpen}
        onClose={() => {
          setIsAddBankOpen(false);
          setBvn("");
          setAddBankError("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Add Bank Account</DialogTitle>
        <DialogContent>
          {addBankError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {addBankError}
            </Alert>
          )}
          {addBankSuccess && (
            <Alert severity="success" sx={{ mb: 2, mt: 1 }}>
              {addBankSuccess}
            </Alert>
          )}

          <TextField
            select
            fullWidth
            label="Select Bank"
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            margin="normal"
          >
            {banks.map((b) => (
              <MenuItem key={b.code} value={b.code}>
                {b.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Account Number"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            margin="normal"
            inputProps={{ maxLength: 10 }}
            InputProps={{
              endAdornment: isResolving && <CircularProgress size={20} />,
            }}
          />

          <TextField
            fullWidth
            label="Account Name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            margin="normal"
            disabled={isResolving}
            helperText="Must match your bank record exactly"
          />

          {!hasBvn && (
            <TextField
              fullWidth
              label="BVN (Bank Verification Number)"
              value={bvn}
              onChange={(e) =>
                setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              margin="normal"
              inputProps={{ maxLength: 11 }}
              helperText="Your 11-digit BVN needed for account verification."
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setIsAddBankOpen(false);
              setBvn("");
              setAddBankError("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddBank}
            disabled={
              isResolving ||
              !bankCode ||
              accountNumber.length < 10 ||
              !accountName
            }
            sx={{ bgcolor: "#028090", "&:hover": { bgcolor: "#006d7b" } }}
          >
            Save Account
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteAccount}
        onClose={handleCloseDelete}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>
          Remove Bank Account
        </DialogTitle>
        <DialogContent>
          {deleteAccount && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Are you sure you want to remove this bank account? This action
                cannot be undone.
              </Typography>
              <Box
                sx={{
                  p: 2,
                  bgcolor: "#fff5f5",
                  border: "1px solid #fecaca",
                  borderRadius: 1,
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <BankIcon fontSize="small" sx={{ color: "#ef4444" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {deleteAccount.bank_name}
                  </Typography>
                  {deleteAccount.is_verified && (
                    <Chip
                      label="Verified"
                      size="small"
                      color="success"
                      sx={{ height: 18, fontSize: "0.65rem" }}
                    />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {deleteAccount.account_number} • {deleteAccount.account_name}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDelete} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Remove Account"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog
        open={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: "bold" }}>Withdraw Funds</DialogTitle>
        <DialogContent>
          {withdrawError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {withdrawError}
            </Alert>
          )}
          {withdrawSuccess && (
            <Alert severity="success" sx={{ mb: 2, mt: 1 }}>
              {withdrawSuccess}
            </Alert>
          )}

          <Box
            sx={{
              mb: 3,
              mt: 1,
              p: 2,
              bgcolor: "rgba(2, 128, 144, 0.05)",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Available Balance
            </Typography>
            <Typography
              variant="h5"
              color="#028090"
              sx={{ fontWeight: "bold" }}
            >
              {formatCurrency(wallet?.balance, wallet?.currency)}
            </Typography>
          </Box>

          <TextField
            fullWidth
            label="Amount to Withdraw"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>,
            }}
          />
          {withdrawalLimitStatus && (
            <p className="text-red-500 text-sm my-1">
              Minimum withdrawal amount is ₦5,000.
            </p>
          )}

          <TextField
            select
            fullWidth
            label="Select Payout Account"
            value={selectedPayoutId}
            onChange={(e) => setSelectedPayoutId(e.target.value)}
            margin="normal"
          >
            {payoutAccounts
              .filter((a) => a.is_verified)
              .map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  {acc.bank_name} - {acc.account_number}
                </MenuItem>
              ))}
            {payoutAccounts.filter((a) => a.is_verified).length === 0 && (
              <MenuItem disabled value="">
                No verified accounts found
              </MenuItem>
            )}
          </TextField>

          {payoutAccounts.length > 0 &&
            payoutAccounts.filter((a) => a.is_verified).length === 0 && (
              <Typography
                variant="caption"
                color="warning.main"
                sx={{ mt: 1, display: "block" }}
              >
                You need a verified bank account to withdraw funds.
              </Typography>
            )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setIsWithdrawOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleWithdraw}
            disabled={isWithdrawing || !withdrawAmount || !selectedPayoutId}
            sx={{ bgcolor: "#028090", "&:hover": { bgcolor: "#006d7b" } }}
          >
            {isWithdrawing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Confirm Withdrawal"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WalletPage;
