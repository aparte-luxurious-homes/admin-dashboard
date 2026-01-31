"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import Grid from "@mui/material/Grid2";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { useEffect, useState, useCallback } from "react";
import axiosRequest from "@/src/lib/api";
import { toast } from "react-hot-toast";
import InputGroup from "@/src/components/formcomponent/InputGroup";
import { Skeleton } from "@/src/components/ui/skeleton";
import Badge from "@/src/components/badge";
import { useParams, useRouter } from "next/navigation";
import { formatDate, formatMoney } from "@/src/lib/utils";

interface Transaction {
    id: string;
    wallet_id: string;
    user_id: string;
    action: string;
    transaction_type: string;
    comment: string;
    currency: string;
    reference: string;
    payment_reference: string;
    amount: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
    user?: {
        email: string;
        first_name?: string;
        last_name?: string;
    };
    wallet?: {
        balance: string;
        currency: string;
    };
    payment?: {
        provider: string;
        status: string;
        customer_email?: string;
        payment_metadata?: any;
        fees?: string;
    };
}

interface TransactionDetailViewProps {
    title: string;
    backLink: string;
    backLinkName: string;
}

const TransactionDetailView = ({ title, backLink, backLinkName }: TransactionDetailViewProps) => {
    const [data, setData] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(false);
    const params = useParams();
    const id = params?.id;

    const handleCopyToClipboard = (value: string, label: string) => {
        if (value && value !== "--/--") {
            navigator.clipboard.writeText(value);
            toast(`${label} copied to clipboard!`);
        } else {
            toast.error(`No valid ${label} to copy.`);
        }
    };

    const fetchData = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        try {
            const response = await axiosRequest.get(
                API_ROUTES.transactions.details(String(id))
            );
            setData(response?.data?.data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to fetch transaction details");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="p-[30px] mt-10">
                <Skeleton className="h-[600px] w-full rounded-md" />
            </div>
        );
    }

    if (!data && !loading) {
        return (
            <div className="p-[30px] mt-10 text-center">
                <p className="text-gray-500 text-lg">Transaction not found.</p>
            </div>
        )
    }

    const fullName = data?.user ? `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim() : "--/--";

    return (
        <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)] text-black">
            <BreadCrumb
                description=""
                active={title}
                link_one={backLink}
                link_one_name={backLinkName}
            />
            <div className="mt-6">
                <h3 className="mb-[40px] text-xl font-semibold border-b pb-4">{title}</h3>

                <Grid container spacing={4}>
                    {/* Main Info Section */}
                    <Grid size={{ xs: 12 }}>
                        <h4 className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-4">General Information</h4>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <InputGroup
                            label="Amount"
                            disabled
                            defaultValue={formatMoney(Number(data?.amount || 0), data?.currency)}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <InputGroup
                            label="Transaction Type"
                            disabled
                            defaultValue={data?.transaction_type || "--/--"}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <Badge status={data?.status?.toLowerCase() || ""} />
                        </div>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <InputGroup
                            label="Action"
                            disabled
                            defaultValue={data?.action || "--/--"}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 8 }}>
                        <InputGroup
                            label="Reference"
                            disabled
                            defaultValue={data?.reference || "--/--"}
                            onClick={(e) => handleCopyToClipboard(e.currentTarget.defaultValue, "Reference")}
                        />
                    </Grid>

                    {/* User Info Section */}
                    <Grid size={{ xs: 12 }} className="mt-4">
                        <h4 className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-4 border-t pt-4">User Details</h4>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InputGroup
                            label="Full Name"
                            disabled
                            defaultValue={fullName}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InputGroup
                            label="Email Address"
                            disabled
                            defaultValue={data?.user?.email || "--/--"}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InputGroup
                            label="User ID"
                            disabled
                            defaultValue={data?.user_id || "--/--"}
                            onClick={(e) => handleCopyToClipboard(e.currentTarget.defaultValue, "User ID")}
                        />
                    </Grid>

                    {/* Wallet Info Section */}
                    <Grid size={{ xs: 12 }} className="mt-4">
                        <h4 className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-4 border-t pt-4">Wallet Information</h4>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InputGroup
                            label="Wallet ID"
                            disabled
                            defaultValue={data?.wallet_id || "--/--"}
                            onClick={(e) => handleCopyToClipboard(e.currentTarget.defaultValue, "Wallet ID")}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InputGroup
                            label="Wallet Balance"
                            disabled
                            defaultValue={data?.wallet ? formatMoney(Number(data.wallet.balance), data.wallet.currency) : "--/--"}
                        />
                    </Grid>

                    {/* Timeline Section */}
                    <Grid size={{ xs: 12 }} className="mt-4">
                        <h4 className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-4 border-t pt-4">Timeline</h4>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InputGroup
                            label="Date Created"
                            disabled
                            defaultValue={data?.created_at ? formatDate(data.created_at) : "--/--"}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <InputGroup
                            label="Last Updated"
                            disabled
                            defaultValue={data?.updated_at ? formatDate(data.updated_at) : "--/--"}
                        />
                    </Grid>

                    {/* Metadata Section */}
                    {(data?.description || data?.comment || data?.payment_reference) && (
                        <>
                            <Grid size={{ xs: 12 }} className="mt-4">
                                <h4 className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-4 border-t pt-4">Additional Details</h4>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <InputGroup
                                    label="Description"
                                    disabled
                                    defaultValue={data?.description || "--/--"}
                                />
                            </Grid>
                            {data?.comment && (
                                <Grid size={{ xs: 12 }}>
                                    <InputGroup
                                        label="Comment"
                                        disabled
                                        defaultValue={data.comment}
                                    />
                                </Grid>
                            )}
                            {data?.payment_reference && (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <InputGroup
                                        label="Payment Reference"
                                        disabled
                                        defaultValue={data.payment_reference}
                                        onClick={(e) => handleCopyToClipboard(e.currentTarget.defaultValue, "Payment Reference")}
                                    />
                                </Grid>
                            )}
                        </>
                    )}

                    {/* Gateway Metadata Section */}
                    {data?.payment && (
                        <>
                            <Grid size={{ xs: 12 }} className="mt-4">
                                <h4 className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-4 border-t pt-4">Payment Gateway Metadata</h4>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <InputGroup
                                    label="Provider"
                                    disabled
                                    defaultValue={data.payment.provider || "--/--"}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <InputGroup
                                    label="Gateway Status"
                                    disabled
                                    defaultValue={data.payment.status || "--/--"}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <InputGroup
                                    label="Processing Fees"
                                    disabled
                                    defaultValue={data.payment.fees ? formatMoney(Number(data.payment.fees), data.currency) : "₦ 0.00"}
                                />
                            </Grid>
                        </>
                    )}
                </Grid>
            </div>
        </div>
    );
};

export default TransactionDetailView;
