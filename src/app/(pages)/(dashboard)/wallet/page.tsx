"use client";

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
    ListItemSecondaryAction,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
} from "@mui/material";
import {
    Add as AddIcon,
    AccountBalance as BankIcon,
    AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { useAuth } from "@/src/hooks/useAuth";

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

    // Form states
    const [bankCode, setBankCode] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [isResolving, setIsResolving] = useState(false);
    const [addBankError, setAddBankError] = useState("");
    const [addBankSuccess, setAddBankSuccess] = useState("");

    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [selectedPayoutId, setSelectedPayoutId] = useState("");
    const [withdrawError, setWithdrawError] = useState("");
    const [withdrawSuccess, setWithdrawSuccess] = useState("");
    const [isWithdrawing, setIsWithdrawing] = useState(false);

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
            // Fetch Wallet
            const walletRes = await axiosRequest.get(API_ROUTES.wallet.base);
            const wallets = walletRes?.data?.data?.items || [];
            const ngnWallet = wallets.find((w: any) => w.currency === "NGN") || wallets[0];
            setWallet(ngnWallet);

            if (ngnWallet) {
                // Fetch Payout Accounts
                const payoutRes = await axiosRequest.get(API_ROUTES.wallet.payoutAccounts.base(ngnWallet.id));
                setPayoutAccounts(payoutRes?.data?.data?.items || []);
            }

            // Fetch Banks
            const banksRes = await axiosRequest.get("/wallets/banks"); // Assuming this is the endpoint
            setBanks(banksRes?.data?.data || []);

        } catch (err: any) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Account Resolution
    useEffect(() => {
        const resolveAccount = async () => {
            if (accountNumber.length === 10 && bankCode) {
                setIsResolving(true);
                setAddBankError("");
                try {
                    const res = await axiosRequest.get(
                        `/wallets/resolve-account?account_number=${accountNumber}&bank_code=${bankCode}`
                    );
                    if (res.data?.data?.account_name) {
                        setAccountName(res.data.data.account_name);
                    }
                } catch (err: any) {
                    setAddBankError(formatError(err));
                } finally {
                    setIsResolving(false);
                }
            }
        };
        resolveAccount();
    }, [accountNumber, bankCode]);

    const handleAddBank = async () => {
        if (!wallet) return;
        setAddBankError("");
        setAddBankSuccess("");

        const selectedBank = banks.find(b => b.code === bankCode);

        try {
            const res = await axiosRequest.post(API_ROUTES.wallet.payoutAccounts.base(wallet.id), {
                account_name: accountName,
                account_number: accountNumber,
                bank_name: selectedBank?.name || "Unknown Bank",
                bank_code: bankCode,
                wallet_id: wallet.id,
                user_id: user?.id
            });

            setAddBankSuccess("Bank account added successfully!");

            // Auto-verify
            if (res.data?.data?.id) {
                try {
                    await axiosRequest.post(API_ROUTES.wallet.payoutAccounts.verify(wallet.id, res.data.data.id));
                } catch (e) {
                    console.log("Auto-verify failed", e);
                }
            }

            setTimeout(() => {
                setIsAddBankOpen(false);
                setBankCode("");
                setAccountNumber("");
                setAccountName("");
                setAddBankSuccess("");
                fetchData(); // Refresh list
            }, 1500);
        } catch (err: any) {
            setAddBankError(formatError(err));
        }
    };

    const handleVerifyBank = async (accountId: string) => {
        if (!wallet) return;
        try {
            await axiosRequest.post(API_ROUTES.wallet.payoutAccounts.verify(wallet.id, accountId));
            fetchData();
        } catch (err: any) {
            alert(formatError(err));
        }
    };

    const handleWithdraw = async () => {
        if (!wallet || !user) return;
        setWithdrawError("");
        setWithdrawSuccess("");
        setIsWithdrawing(true);

        try {
            await axiosRequest.post(API_ROUTES.wallet.withdraw(wallet.id), {
                amount: withdrawAmount,
                payout_id: selectedPayoutId,
                currency: wallet.currency || "NGN",
                description: "Wallet Withdrawal",
                user_id: user.id,
                wallet_id: wallet.id
            });

            setWithdrawSuccess("Withdrawal initiated successfully!");
            setTimeout(() => {
                setIsWithdrawOpen(false);
                setWithdrawAmount("");
                setSelectedPayoutId("");
                setWithdrawSuccess("");
                fetchData(); // Refresh balance
            }, 2000);
        } catch (err: any) {
            setWithdrawError(formatError(err));
        } finally {
            setIsWithdrawing(false);
        }
    };

    const formatCurrency = (amount: string | number | undefined, currency = "NGN") => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: currency || "NGN",
        }).format(Number(amount || 0));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={4}>
                <Alert severity="error">{error}</Alert>
                <Button onClick={fetchData} sx={{ mt: 2 }}>Retry</Button>
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "#333" }}>
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
                            <Box display="flex" alignItems="center" gap={1} sx={{ opacity: 0.9, mb: 1 }}>
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
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#028090" }}>
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
                    <Card sx={{ borderRadius: 2, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
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
                                        {index > 0 && <Box sx={{ borderTop: "1px solid rgba(0,0,0,0.05)" }} />}
                                        <ListItem sx={{ py: 2 }}>
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        <BankIcon fontSize="small" sx={{ color: "action.active" }} />
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {acc.bank_name}
                                                        </Typography>
                                                        {acc.is_verified ? (
                                                            <Chip label="Verified" size="small" color="success" sx={{ height: 20, fontSize: "0.7rem" }} />
                                                        ) : (
                                                            <Chip label="Unverified" size="small" color="warning" sx={{ height: 20, fontSize: "0.7rem" }} />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={`${acc.account_number} • ${acc.account_name}`}
                                            />
                                            <ListItemSecondaryAction>
                                                {!acc.is_verified && (
                                                    <Button size="small" onClick={() => handleVerifyBank(acc.id)}>
                                                        Verify
                                                    </Button>
                                                )}
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    </React.Fragment>
                                ))
                            )}
                        </List>
                    </Card>
                </Grid>
            </Grid>

            {/* Add Bank Dialog */}
            <Dialog open={isAddBankOpen} onClose={() => setIsAddBankOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold" }}>Add Bank Account</DialogTitle>
                <DialogContent>
                    {addBankError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{addBankError}</Alert>}
                    {addBankSuccess && <Alert severity="success" sx={{ mb: 2, mt: 1 }}>{addBankSuccess}</Alert>}

                    <TextField
                        select
                        fullWidth
                        label="Select Bank"
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        margin="normal"
                    >
                        {banks.map((b) => (
                            <MenuItem key={b.code} value={b.code}>{b.name}</MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        fullWidth
                        label="Account Number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        margin="normal"
                        inputProps={{ maxLength: 10 }}
                        InputProps={{
                            endAdornment: isResolving && <CircularProgress size={20} />
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
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setIsAddBankOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddBank}
                        disabled={isResolving || !bankCode || accountNumber.length < 10 || !accountName}
                        sx={{ bgcolor: "#028090", "&:hover": { bgcolor: "#006d7b" } }}
                    >
                        Save Account
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Withdraw Dialog */}
            <Dialog open={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: "bold" }}>Withdraw Funds</DialogTitle>
                <DialogContent>
                    {withdrawError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{withdrawError}</Alert>}
                    {withdrawSuccess && <Alert severity="success" sx={{ mb: 2, mt: 1 }}>{withdrawSuccess}</Alert>}

                    <Box sx={{ mb: 3, mt: 1, p: 2, bgcolor: "rgba(2, 128, 144, 0.05)", borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">Available Balance</Typography>
                        <Typography variant="h5" color="#028090" sx={{ fontWeight: "bold" }}>
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
                            startAdornment: <Typography sx={{ mr: 1 }}>₦</Typography>
                        }}
                    />

                    <TextField
                        select
                        fullWidth
                        label="Select Payout Account"
                        value={selectedPayoutId}
                        onChange={(e) => setSelectedPayoutId(e.target.value)}
                        margin="normal"
                    >
                        {payoutAccounts.filter(a => a.is_verified).map((acc) => (
                            <MenuItem key={acc.id} value={acc.id}>
                                {acc.bank_name} - {acc.account_number}
                            </MenuItem>
                        ))}
                        {payoutAccounts.filter(a => a.is_verified).length === 0 && (
                            <MenuItem disabled value="">No verified accounts found</MenuItem>
                        )}
                    </TextField>
                    {payoutAccounts.length > 0 && payoutAccounts.filter(a => a.is_verified).length === 0 && (
                        <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: "block" }}>
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
                        {isWithdrawing ? <CircularProgress size={24} color="inherit" /> : "Confirm Withdrawal"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WalletPage;
