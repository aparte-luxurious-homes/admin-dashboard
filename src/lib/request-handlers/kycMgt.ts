import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

export enum KycDocumentType {
  INTERNATIONAL_PASSPORT = "INTERNATIONAL_PASSPORT",
  NIN = "NIN",
  DRIVERS_LICENSE = "DRIVERS_LICENSE",
  // UTILITY_BILL = "UTILITY_BILL",
  // POWER_BILL = "POWER_BILL",
  // TENANCY_AGREEMENT = "TENANCY_AGREEMENT",
  // TITLE_DEED = "TITLE_DEED",
  // CERTIFICATE_OF_OCCUPANCY = "CERTIFICATE_OF_OCCUPANCY",
}

export enum KycDocStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export interface IKycDocument {
  id: string;
  user_id: string;
  document_type: KycDocumentType;
  document_url: string;
  status: KycDocStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface IKycList {
  profile_kyc_status: KycDocStatus | null;
  items: IKycDocument[];
}

const KYC_LIST_KEY = "myKycDocuments";

/** Fetch the current user's own KYC documents + profile-level status. */
export function GetMyKycDocuments() {
  return useQuery({
    queryKey: [KYC_LIST_KEY],
    queryFn: async () => {
      const resp = await axiosRequest.get(API_ROUTES.profile.kycDocuments);
      return resp.data?.data as IKycList;
    },
  });
}

export interface AgentKycSubmission {
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  documentType: KycDocumentType;
  file: File;
  address: string;
  city: string;
  state: string;
  country: string;
}

/**
 * Submit the full agent KYC form (POST /profile/agent-kyc) — the one call an
 * agent behind the approval gate makes to reach admin review. Refetches the
 * auth user afterwards so the dashboard picks up PENDING_APPROVAL.
 */
export function SubmitAgentKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (s: AgentKycSubmission) => {
      const form = new FormData();
      form.append("first_name", s.firstName);
      form.append("last_name", s.lastName);
      form.append("dob", s.dob);
      form.append("document_type", s.documentType);
      form.append("file", s.file);
      form.append("address", s.address);
      form.append("city", s.city);
      form.append("state", s.state);
      form.append("country", s.country);
      const resp = await axiosRequest.post(API_ROUTES.profile.agentKyc, form, {
        headers: { "Content-Type": "multipart/form-data" },
        transformRequest: (data, headers) => {
          if (headers) delete headers["Content-Type"];
          return data;
        },
      });
      return resp.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KYC_LIST_KEY] });
      queryClient.refetchQueries({ queryKey: ["authUser"] });
    },
  });
}

/** Upload a single KYC document. Multipart form data. */
export function UploadMyKycDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      documentType,
    }: {
      file: File;
      documentType: KycDocumentType;
    }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("document_type", documentType);
      const resp = await axiosRequest.post(
        API_ROUTES.profile.kycDocuments,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          transformRequest: (data, headers) => {
            if (headers) delete headers["Content-Type"];
            return data;
          },
        },
      );
      return resp.data?.data as IKycDocument;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KYC_LIST_KEY] });
    },
  });
}
