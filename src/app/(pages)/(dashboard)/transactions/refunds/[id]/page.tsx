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
  id: string;
  wallet_id: string;
  userId: number;
  action: string;
  transactionType: string;
  comment: string;
  currency: string;
  reference: string;
  payment_reference: string;
  amount: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}
const RefundInfo = () => {
  const [transactionInfo, setTransactionInfo] = useState<Transaction>(
    {} as Transaction
  );
  const [transactionInfoLoading, setTransactionInfoLoading] = useState(false);
  const params = useParams();
  const id = params?.id;

  const fetchAtransactionInfo = async () => {
    if (!id) return;

    setTransactionInfoLoading(true);
    try {
      const response = await axiosRequest.get(
        `${BASE_API_URL}${API_ROUTES?.transactions?.details(String(id))}`
      );
      console.log("response", response);
      setTransactionInfo(response?.data?.data);
      setTransactionInfoLoading(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message, {
        duration: 6000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      });
    } finally {
      setTransactionInfoLoading(false);
    }
  };

  useEffect(() => {
    fetchAtransactionInfo();
  }, []);

  return (
    <>
      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <BreadCrumb
          description=""
          active="A Refund Info"
          link_one="/transactions/refunds"
          link_one_name="All Refunds"
        />
        <div className="mt-0">
          <h3 className="mb-[50px] mt-[10px] font-semibold">Refunds Info</h3>
          {transactionInfoLoading ? (
            <Skeleton className="h-[500px]  mt-5 bw-full rounded-md" />
          ) : (
            <>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="User ID"
                    required
                    disabled
                    defaultValue={
                      transactionInfo?.userId || "--/--"
                    }
                    inputType="text"
                    inputName="name"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Transaction Type"
                    required
                    disabled
                    defaultValue={transactionInfo?.transactionType || "--/--"}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Amount"
                    required
                    disabled
                    defaultValue={transactionInfo?.amount || "--/--"}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Comment"
                    required
                    disabled
                    defaultValue={transactionInfo?.comment || "--/--"}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Description"
                    required
                    disabled
                    defaultValue={transactionInfo?.description || "--/--"}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Referance"
                    required
                    disabled
                    defaultValue={transactionInfo?.reference || "--/--"}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Date Created"
                    required
                    disabled
                    inputType="text"
                    defaultValue={
                      transactionInfo?.createdAt?.substring(0, 10) || "--/--"
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Date Updated"
                    required
                    disabled
                    defaultValue={
                      transactionInfo?.updatedAt?.substring(0, 10) || "--/--"
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                      <h4>Payment Status</h4>
                      <Badge
                        status={transactionInfo?.status?.toLocaleLowerCase()}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default RefundInfo;
