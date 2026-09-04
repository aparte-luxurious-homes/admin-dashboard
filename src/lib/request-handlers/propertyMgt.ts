import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import {
  IAssignAmenity,
  IAssignProperty,
  ICreateProperty,
  IUpdateProperty,
  IUpdatePropertyVerification,
  IUploadPropertyMedia,
} from "@/src/components/properties-mgt/types";
import { UserRole } from "../enums";

enum PropertyRequestKeys {
  allProperties = "getAllPropertiesView",
  singleProperty = "getSinglePropertyView",
  propertyMedia = "uploadPropertyMedia",
  propertyAmenities = "assignPropertyAmenities",
  getAmenities = "getAmenities",
  createAmenities = "getAmenities",
  getEventTypes = "getEventTypes",
  featureProperty = "featureProperty",
  createProperty = "createProperty",
  propertyVerification = "propertyVerification",
  deleteProperty = "deleteProperty",
  assignToProperty = "assignToProperty",
  getPropertyVerification = "getPropertyVerification",
  getAllVerifications = "getAllVerifications",
  getPropertiesVerifications = "getPropertiesVerifications",
  propertyDocuments = "propertyDocuments",
  verifyPropertyDocument = "verifyPropertyDocument",
  updateBookingMode = "updateBookingMode",
  verificationHistory = "verificationHistory",
  agentMyQueue = "agentMyQueue",
  ownerResubmit = "ownerResubmit",
}

export function GetAllProperties(
  page = 1,
  limit = 10,
  searchTerm = "",
  role?: UserRole,
  id?: string | number,
  isVerified?: boolean | null,
  includeAll = false,
) {
  const params: Record<string, any> = {
    page,
    limit,
    search: searchTerm,
  };
  if (role) params.role = role;
  // User IDs are UUID strings, not numbers — the previous `typeof id === 'number'`
  // guard was always false, so the backend's auto-scope was the only thing
  // hiding other owners' properties. When backend auth resolves current_user
  // to None for any reason (e.g. is_verified=False on freshly auto-onboarded
  // owners), the auto-scope short-circuits and the OWNER sees the full catalog.
  // Sending `user` explicitly for OWNER/AGENT belt-and-braces the scoping
  // regardless of backend auth state.
  if (
    id &&
    (role === UserRole.OWNER || role === UserRole.AGENT) &&
    !includeAll
  ) {
    params.user = String(id);
  }
  if (isVerified !== undefined && isVerified !== null)
    params.is_verified = isVerified;
  // OWNER/AGENT callers default to a scope-to-self view server-side. Pass
  // include_all when the UI needs the full public catalog (booking-on-behalf
  // flow). Behaviour for ADMIN/staff is unchanged either way.
  if (includeAll) params.include_all = true;

  return useQuery({
    queryKey: [
      PropertyRequestKeys.allProperties,
      page,
      limit,
      searchTerm,
      role ?? null,
      id ?? null,
      isVerified ?? null,
      includeAll,
    ],
    queryFn: () =>
      axiosRequest.get(API_ROUTES.propertyManagement.properties.base, {
        params,
      }),
    refetchOnWindowFocus: true,
  });
}

export function GetSingleProperty(propertyId: string | number) {
  return useQuery({
    queryKey: [PropertyRequestKeys.singleProperty, propertyId],
    queryFn: () =>
      axiosRequest.get(
        API_ROUTES.propertyManagement.properties.details(propertyId),
      ),
    refetchOnWindowFocus: true,
    staleTime: Infinity,
    refetchInterval: 10000 * 60 * 5,
  });
}

export function GetAllVerifications(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  status?: string,
  _role?: UserRole,
) {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) queryParams.append("search", search);
  if (status) queryParams.append("status", status);

  return useQuery({
    queryKey: [
      PropertyRequestKeys.getAllVerifications,
      page,
      limit,
      search,
      status ?? null,
    ],
    queryFn: () =>
      axiosRequest.get(
        `${API_ROUTES.verifications.base}?${queryParams.toString()}`,
      ),
    refetchOnWindowFocus: true,
  });
}

export function GetPropertyVerification(verificationId: string | number) {
  return useQuery({
    queryKey: [PropertyRequestKeys.getPropertyVerification, verificationId],
    queryFn: () =>
      axiosRequest.get(API_ROUTES.verifications.details(verificationId)),
    refetchOnWindowFocus: true,
  });
}

export function GetPropertyVerifications(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  propertyId: string | number,
) {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    property_id: String(propertyId),
  });

  if (search) queryParams.append("search", search);

  return useQuery({
    queryKey: [
      PropertyRequestKeys.getPropertiesVerifications,
      page,
      limit,
      search,
      propertyId,
    ],
    queryFn: () =>
      axiosRequest.get(
        `${API_ROUTES.verifications.base}?${queryParams.toString()}`,
      ),
    refetchOnWindowFocus: true,
  });
}

export function UploadVerificationMedia() {
  // Uploads one or more on-site verification photos/videos for a property.
  // Returns { urls: string[] } — the caller is responsible for passing those
  // URLs into UpdatePropertyVerification's `evidence_urls` field.
  return useMutation({
    mutationFn: ({
      propertyId,
      files,
    }: {
      propertyId: string | number;
      files: File[];
    }) => {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      return axiosRequest.post(
        API_ROUTES.propertyManagement.properties.verificationMedia(propertyId),
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          transformRequest: (data, headers) => {
            if (headers) delete headers["Content-Type"];
            return data;
          },
        },
      );
    },
  });
}

export function UpdatePropertyVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      payload,
    }: {
      propertyId: string | number;
      payload: IUpdatePropertyVerification;
    }) =>
      axiosRequest.put(
        API_ROUTES.propertyManagement.properties.verify(propertyId),
        payload,
      ),

    onSettled: (values) => {
      if (values?.data?.data?.property?.id) {
        queryClient.invalidateQueries({
          queryKey: [
            PropertyRequestKeys.singleProperty,
            values.data.data.property.id,
          ],
        });
      }
      if (values?.data?.data?.verification?.id) {
        queryClient.invalidateQueries({
          queryKey: [
            PropertyRequestKeys.getPropertyVerification,
            values.data.data.verification.id,
          ],
        });
      }
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.propertyVerification],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.getAllVerifications],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.getPropertiesVerifications],
      });
    },
  });
}

export function GetAmenities() {
  return useQuery({
    queryKey: [PropertyRequestKeys.getAmenities],
    queryFn: () =>
      axiosRequest.get(API_ROUTES.propertyManagement.amenities.base),
  });
}

export function GetEventTypes() {
  return useQuery({
    queryKey: [PropertyRequestKeys.getEventTypes],
    queryFn: () =>
      axiosRequest.get(API_ROUTES.propertyManagement.eventTypes.base),
  });
}

export function CreateAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name }: { name: string }) =>
      axiosRequest.post(API_ROUTES.propertyManagement.amenities.base, { name }),

    onSuccess: () => {
      // Invalidate the specific property query so it refetches
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.createAmenities],
      });
    },
  });
}

export function CreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload }: { payload: ICreateProperty }) =>
      axiosRequest.post(API_ROUTES.propertyManagement.properties.base, payload),

    onSuccess: () => {
      // Invalidate the specific property query so it refetches
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.createProperty],
      });
    },
  });
}

export function AssignToProperty(propertyId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload }: { payload: IAssignProperty }) =>
      axiosRequest.post(
        API_ROUTES.admin.properties.assign(propertyId),
        payload,
      ),

    onSuccess: (values) => {
      // console.log(values)
      // Invalidate the specific property query so it refetches
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.assignToProperty],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [
          PropertyRequestKeys.getPropertyVerification,
          values?.data?.data?.VerificationBadge?.id,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.allProperties],
      });
    },
  });
}

export function ReassignPropertyOwner(propertyId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload }: { payload: { owner_id: string } }) =>
      axiosRequest.patch(
        API_ROUTES.admin.properties.reassignOwner(propertyId),
        payload,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.allProperties],
      });
    },
  });
}

export function UpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      payload,
    }: {
      propertyId: string | number;
      payload: IUpdateProperty;
    }) =>
      axiosRequest.put(
        API_ROUTES.propertyManagement.properties.details(propertyId),
        payload,
      ),

    onSuccess: (_, { propertyId }) => {
      // Invalidate the specific property query so it refetches
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.allProperties],
      });
    },
  });
}

export function DeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId }: { propertyId: string | number }) =>
      axiosRequest.delete(
        API_ROUTES.propertyManagement.properties.details(propertyId),
      ),

    onSuccess: (_, { propertyId }) => {
      // Invalidate the specific property query so it refetches
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.deleteProperty, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.allProperties],
      });
    },
  });
}

export function AssignPropertyAmenities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      payload,
    }: {
      propertyId: string | number;
      payload: IAssignAmenity;
    }) =>
      axiosRequest.post(
        API_ROUTES.propertyManagement.properties.amenities(propertyId),
        payload,
      ),

    onSuccess: (_, { propertyId }) => {
      // Invalidate the specific property query so it refetches
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.propertyAmenities, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.allProperties],
      });
    },
  });
}

export function FeatureProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId }: { propertyId: string | number }) =>
      axiosRequest.put(API_ROUTES.admin.properties.feature(propertyId)),

    onSuccess: (_, { propertyId }) => {
      // Invalidate the specific property query so it refetches
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.featureProperty, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.allProperties],
      });
    },
  });
}

export function UploadPropertyMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      payload,
    }: {
      propertyId: string | number;
      payload: FormData;
    }) =>
      axiosRequest.post(
        API_ROUTES.propertyManagement.properties.media(propertyId),
        payload,
        {
          // Let the interceptor strip Content-Type so the browser sets the multipart boundary.
          timeout: 120_000,
        },
      ),

    onSuccess: (_, { propertyId }) => {
      // Invalidate the specific property query so it refetches
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.propertyMedia, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.allProperties],
      });
    },
  });
}

export function DeletePropertyMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      mediaId,
    }: {
      propertyId: string | number;
      mediaId: string | number;
    }) =>
      axiosRequest.delete(
        API_ROUTES.propertyManagement.properties.deleteMedia(
          propertyId,
          mediaId,
        ),
      ),

    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.allProperties],
      });
    },
  });
}

export function GetPropertyDocuments(propertyId: string | number) {
  return useQuery({
    queryKey: [PropertyRequestKeys.propertyDocuments, propertyId],
    queryFn: () =>
      axiosRequest.get(
        API_ROUTES.propertyManagement.properties.documents(propertyId),
      ),
    refetchOnWindowFocus: true,
  });
}

export function UploadPropertyDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      payload,
    }: {
      propertyId: string | number;
      payload: any;
    }) =>
      axiosRequest.post(
        API_ROUTES.propertyManagement.properties.documents(propertyId),
        payload,
        {
          timeout: 120_000,
        },
      ),

    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.propertyDocuments, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId],
      });
    },
  });
}

export function UpdateBookingMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      booking_mode,
    }: {
      propertyId: string | number;
      booking_mode: string;
    }) =>
      axiosRequest.patch(
        API_ROUTES.propertyManagement.properties.bookingMode(propertyId),
        { booking_mode },
      ),

    onSuccess: (_, { propertyId, booking_mode }) => {
      // Patch the cache directly so the useEffect in the detail view reads the new value
      // instead of overwriting the optimistic update when the refetch resolves
      queryClient.setQueryData(
        [PropertyRequestKeys.singleProperty, propertyId],
        (old: any) =>
          old
            ? {
                ...old,
                data: {
                  ...old.data,
                  data: {
                    ...old.data?.data,
                    booking_mode,
                    bookingMode: booking_mode,
                  },
                },
              }
            : old,
      );
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.allProperties],
      });
    },
  });
}

export function UpdatePropertyDocumentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      documentId,
      payload,
    }: {
      propertyId: string | number;
      documentId: string | number;
      payload: IUpdatePropertyVerification;
    }) =>
      axiosRequest.patch(
        API_ROUTES.propertyManagement.properties.verifyDocument(
          propertyId,
          documentId,
        ),
        payload,
      ),

    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.propertyDocuments, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId],
      });
      // Refresh the verification record so the embedded `documents` list
      // and the at-a-glance summary on the verification page reflect the
      // new status without a manual reload.
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.getPropertyVerification],
      });
      // The activity timeline also gains a row for the per-doc decision
      // (backend writes property_verification_logs with property_doc_id).
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.verificationHistory],
      });
    },
  });
}

// ----------------------------------------------------------------------------
// Verification history + agent queue + owner resubmit
// ----------------------------------------------------------------------------

export function GetVerificationHistory(
  propertyId: string | number,
  verificationId: string | number,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      PropertyRequestKeys.verificationHistory,
      propertyId,
      verificationId,
    ],
    queryFn: () =>
      axiosRequest.get(
        API_ROUTES.admin.properties.verificationHistory(
          propertyId,
          verificationId,
        ),
      ),
    enabled: enabled && !!propertyId && !!verificationId,
  });
}

export function GetAgentVerificationQueue(params: {
  page?: number;
  size?: number;
  status?: "PENDING" | "VERIFIED" | "REJECTED";
}) {
  const { page = 1, size = 20, status = "PENDING" } = params || {};
  return useQuery({
    queryKey: [PropertyRequestKeys.agentMyQueue, page, size, status],
    queryFn: () =>
      axiosRequest.get(API_ROUTES.verifications.myQueue, {
        params: { page, size, status },
      }),
    refetchOnWindowFocus: true,
  });
}

export function ResubmitOwnerVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      note,
    }: {
      propertyId: string | number;
      note?: string;
    }) =>
      axiosRequest.post(API_ROUTES.verifications.ownerResubmit(propertyId), {
        note,
      }),
    onSuccess: (_, { propertyId }) => {
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.getPropertiesVerifications],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.getAllVerifications],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.verificationHistory],
      });
    },
  });
}

export function ReviewDiscountProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      propertyId,
      payload,
    }: {
      propertyId: string | number;
      payload: { action: "approve" | "reject" };
    }) =>
      axiosRequest.post(
        API_ROUTES.propertyManagement.properties.reviewDiscountProposal(
          propertyId,
        ),
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.singleProperty],
      });
      queryClient.invalidateQueries({
        queryKey: [PropertyRequestKeys.allProperties],
      });
    },
  });
}
