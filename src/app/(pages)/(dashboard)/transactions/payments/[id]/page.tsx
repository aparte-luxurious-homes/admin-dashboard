"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import Grid from "@mui/material/Grid2";
import { API_ROUTES, BASE_API_URL } from "@/src/lib/routes/endpoints";
import { useEffect, useState } from "react";
import axiosRequest from "@/src/lib/api";
import { toast } from "react-hot-toast";
import InputGroup from "@/src/components/formcomponent/InputGroup";
import { Skeleton } from "@/components/ui/skeleton";
import Badge from "@/src/components/badge";
import { useParams } from "next/navigation";

interface Transaction {
  amount: string;
  createdAt: string;
  currency: string;
  customerEmail: string;
  fees: string;
  id: string;
  metadata: {
    apiKey: string;
    checkoutUrl: string;
    enabledPaymentMethod: string[];
    merchantName: string;
    paymentReference: string;
    redirectUrl: string;
    transactionReference: string;
  };
  provider: string;
  reference: string;
  status: string;
  updatedAt: string;
  userId: number;
  walletId: string;
}
const AgentInfo = () => {
  const [paymentInfo, setPaymentInfo] = useState<Transaction>(
    {} as Transaction
  );
  const [paymentInfoLoading, setPaymentInfoLoading] = useState(false);
  const params = useParams();
  const id = params?.id;
  console.log("params", params?.id);

  const handleCopyToClipboard = (value: string, label: string) => {
    if (value && value !== "--/--") {
      navigator.clipboard.writeText(value);
      toast(`${label} copied to clipboard!`, {
        duration: 6000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      });
    } else {
      toast.error(`No valid ${label} to copy.`);
    }
  };

  const fetchApaymentInfo = async () => {
    if (!id) return;

    setPaymentInfoLoading(true);
    try {
      const response = await axiosRequest.get(
        `${BASE_API_URL}${API_ROUTES?.payments?.details(String(id))}`
      );
      console.log("response", response);
      setPaymentInfo(response?.data?.data);
      setPaymentInfoLoading(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message, {
        duration: 6000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      });
    } finally {
      setPaymentInfoLoading(false);
    }
  };

  useEffect(() => {
    fetchApaymentInfo();
  }, []);

  return (
    <>
      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <BreadCrumb
          description=""
          active="Payment Info"
          link_one="/transactions/payments"
          link_one_name="All Payment"
        />
        <div className="mt-0">
          <h3 className="mb-[50px] mt-[10px] font-semibold">Payment Info</h3>
          {paymentInfoLoading ? (
            <Skeleton className="h-[500px]  mt-5 bw-full rounded-md" />
          ) : (
            <>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Amount"
                    required
                    disabled
                    defaultValue={
                      paymentInfo?.amount?.toLocaleLowerCase() || "--/--"
                    }
                    inputType="text"
                    inputName="name"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="User ID"
                    required
                    disabled
                    defaultValue={paymentInfo?.userId || "--/--"}
                    inputType="email"
                    inputName="email"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Email Address"
                    required
                    disabled
                    defaultValue={paymentInfo?.customerEmail || "--/--"}
                    inputType="email"
                    inputName="email"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Provider"
                    required
                    disabled
                    defaultValue={paymentInfo?.provider || "--/--"}
                    inputType="text"
                    inputName="phoneNumber"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Referance"
                    required
                    disabled
                    defaultValue={paymentInfo?.reference || "--/--"}
                    inputType="text"
                    inputName="verification"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Date Created"
                    required
                    disabled
                    inputType="text"
                    defaultValue={
                      paymentInfo?.createdAt?.substring(0, 10) || "--/--"
                    }
                    inputName="address"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Date Updated"
                    required
                    disabled
                    defaultValue={
                      paymentInfo?.updatedAt?.substring(0, 10) || "--/--"
                    }
                    inputType="text"
                    inputName="text"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                      <h4>Payment Status</h4>
                      <Badge
                        status={paymentInfo?.status?.toLocaleLowerCase()}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <h2 className="mt-8 mb-3 text-white font-semibold bg-[rgb(13,148,136,0.6)] px-4 py-2 rounded-md shadow-md">
                More About Payment
              </h2>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Api Key"
                    required
                    defaultValue={paymentInfo?.metadata?.apiKey || "--/--"}
                    onClick={(e) =>
                      handleCopyToClipboard(
                        e.currentTarget.defaultValue,
                        "API Key"
                      )
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Checkout Url"
                    required
                    defaultValue={paymentInfo?.metadata?.checkoutUrl || "--/--"}
                    onClick={(e) =>
                      handleCopyToClipboard(
                        e.currentTarget.defaultValue,
                        "Checkout Url"
                      )
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Merchant Name"
                    required
                    defaultValue={
                      paymentInfo?.metadata?.merchantName || "--/--"
                    }
                    onClick={(e) =>
                      handleCopyToClipboard(
                        e.currentTarget.defaultValue,
                        "Merchant Name"
                      )
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Payment Reference"
                    required
                    defaultValue={
                      paymentInfo?.metadata?.paymentReference || "--/--"
                    }
                    onClick={(e) =>
                      handleCopyToClipboard(
                        e.currentTarget.defaultValue,
                        "Payment Reference"
                      )
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Redirect URL"
                    required
                    defaultValue={paymentInfo?.metadata?.redirectUrl || "--/--"}
                    onClick={(e) =>
                      handleCopyToClipboard(
                        e.currentTarget.defaultValue,
                        "Redirect URL"
                      )
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Transaction Reference"
                    required
                    inputType="text"
                    defaultValue={
                      paymentInfo?.metadata?.transactionReference || "--/--"
                    }
                    onClick={(e) =>
                      handleCopyToClipboard(
                        e.currentTarget.defaultValue,
                        "Transaction Reference"
                      )
                    }
                  />
                </Grid>
              </Grid>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AgentInfo;
