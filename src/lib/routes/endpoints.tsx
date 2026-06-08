export const API_ROUTES = {
    auth: {
        signUp: '/auth/signup',
        verifyOtp: '/auth/otp/verify',
        login: '/auth/login',
        requestPasswordReset: '/auth/password/otp',
        passwordReset: '/auth/password/reset',
        resendOtp: '/auth/otp/resend',
        logout: '/auth/logout',
        requestPhoneOtp: '/auth/phone/request-otp',
        requestPhoneOtpViaEmail: '/auth/phone/request-otp-via-email',
        verifyPhoneOtp: '/auth/phone/verify',
    },
    admin: {
        kyc: {
            base: '/admin/kyc',
            update: (docId: string | number) => `/admin/kyc/${docId}`,
        },
        properties: {
            assign: (id: string | number) => `/admin/properties/${id}/assign`,
            reassignOwner: (id: string | number) => `/admin/properties/${id}/reassign-owner`,
            verificationStatus: (id: string | number) => `/admin/properties/${id}/verify`,
            feature: (id: string | number) => `/admin/properties/${id}/feature`,
            verificationHistory: (propertyId: string | number, verificationId: string | number) =>
                `/admin/properties/${propertyId}/verifications/${verificationId}/history`,
        },
        bookings: {
            base: '/bookings',
            update: (id: string | number) => `/admin/bookings/${id}`,
        },
        auditLogs: {
            index: '/admin/audit-logs',
        },
        users: {
            base: '/admin/users',
            onboard: '/admin/users/onboard',
            userById: (id: string | number) => `/admin/users/${id}`,
            userByUuid: (id: string | number) => `/admin/users/${id}`,
            updateKyc: (id: string | number) => `/admin/users/${id}/kyc`,
            kycHistory: (id: string | number) => `/admin/users/${id}/kyc/history`,
            uploadKycOnBehalf: (id: string | number) => `/admin/users/${id}/kyc/documents`,
            roles: '/admin/users/roles',
        },
        kycQueue: '/admin/kyc/queue',
        integrations: {
            configs: '/admin/integrations/configs',
            configByKey: (key: string) => `/admin/integrations/configs/${key}`,
        },
        reviews: {
            base: '/admin/reviews',
            flag: (reviewId: string | number) => `/admin/reviews/${reviewId}/flag`,
            unflag: (reviewId: string | number) => `/admin/reviews/${reviewId}/unflag`,
            restore: (reviewId: string | number) => `/admin/reviews/${reviewId}/restore`,
            remove: (reviewId: string | number) => `/admin/reviews/${reviewId}`,
        },
        disputes: {
            base: '/admin/disputes',
            details: (id: string | number) => `/admin/disputes/${id}`,
            status: (disputeId: string | number) => `/admin/disputes/${disputeId}/status`,
            requestEvidence: (disputeId: string | number) => `/admin/disputes/${disputeId}/request-evidence`,
            resolve: (disputeId: string | number) => `/admin/disputes/${disputeId}/resolve`,
            reopen: (disputeId: string | number) => `/admin/disputes/${disputeId}/reopen`,
        },
        referrals: {
            base: '/admin/referrals',
        }
    },
    profile: {
        show: '/profile',
        update: '/profile',
        updatePassword: '/profile/password',
        kycStatus: '/profile/kyc-status',
        verifyGovId: '/profile/verify-gov-id',
        kycDocuments: '/profile/kyc/documents',
        kyc: {
            upload: '/kyc/upload',
            details: (docId: string | number) => `/kyc/${docId}/details`,
        }
    },
    propertyManagement: {
        properties: {
            base: '/properties',
            details: (propertyId: string | number) => `/properties/${propertyId}`,
            amenities: (propertyId: string | number) => `/properties/${propertyId}/amenities`,
            media: (propertyId: string | number) => `/properties/${propertyId}/media`,
            verify: (id: string | number) => `/properties/${id}/verify`,
            verificationMedia: (id: string | number) => `/properties/${id}/verifications/media`,
            units: {
                base: (propertyId: string | number) => `/properties/${propertyId}/units`,
                details: (propertyId: string | number, unitId: string | number) => `/properties/${propertyId}/units/${unitId}`,
                amenities: (propertyId: string | number, unitId: string | number) => `/properties/${propertyId}/units/${unitId}/amenities`,
                media: (propertyId: string | number, unitId: string | number) => `/properties/${propertyId}/units/${unitId}/media`,
                availability: (propertyId: string | number, unitId: string | number) => `/properties/${propertyId}/units/${unitId}/availability`,
                deleteMedia: (propertyId: string | number, unitId: string | number, mediaId: string | number) => `/properties/${propertyId}/units/${unitId}/media/${mediaId}`,
            },
            deleteMedia: (propertyId: string | number, mediaId: string | number) => `/properties/${propertyId}/media/${mediaId}`,
            documents: (propertyId: string | number) => `/properties/${propertyId}/documents`,
            verifyDocument: (propertyId: string | number, documentId: string | number) => `/properties/${propertyId}/documents/${documentId}`,
            bookingMode: (propertyId: string | number) => `/properties/${propertyId}/booking-mode`,
        },
        amenities: {
            base: '/amenities',
        },
    },
    verifications: {
        base: '/verifications',
        details: (verificationId: string | number) => `/verifications/${verificationId}`,
        myQueue: '/properties/verifications/my-queue',
        ownerResubmit: (propertyId: string | number) =>
            `/properties/${propertyId}/verifications/resubmit`,
    },
    bookings: {
        base: '/bookings',
        upcoming: '/bookings/upcoming',
        guestLookup: '/bookings/guest-lookup',
        guestsDirectory: '/bookings/guests/directory',
        details: (id: string) => `/bookings/${id}`,
        status: (id: string | number) => `/bookings/${id}/status`,
        pdf: (id: string | number) => `/bookings/${id}/pdf`,
        approveRequest: (id: string | number) => `/bookings/${id}/approve-request`,
        rejectRequest: (id: string | number) => `/bookings/${id}/reject-request`,
        reconcilePayment: (id: string | number) => `/bookings/${id}/reconcile-payment`,
        extensions: {
            base: (bookingId: string | number) => `/bookings/${bookingId}/extensions`,
            listAll: '/bookings/extensions/all',
            details: (bookingId: string | number, id: string | number) => `/bookings/${bookingId}/extensions/${id}`,
            approve: (bookingId: string | number, id: string | number) => `/bookings/${bookingId}/extensions/${id}/approve`,
            reject: (bookingId: string | number, id: string | number) => `/bookings/${bookingId}/extensions/${id}/reject`,
            cancel: (bookingId: string | number, id: string | number) => `/bookings/${bookingId}/extensions/${id}/cancel`,
        }
    },
    wallet: {
        base: '/wallets',
        details: (id: string) => `/wallets/${id}`,
        update: (id: string) => `/wallets/${id}`,
        withdraw: (id: string) => `/wallets/${id}/withdraw`,
        approveWithdrawal: (id: string | number) => `/wallets/${id}/approve-withdrawal`,
        rejectWithdrawal: (id: string | number) => `/wallets/${id}/reject-withdrawal`,
        authorizeDisbursement: (id: string | number) => `/wallets/${id}/authorize-disbursement`,
        resendDisbursementOtp: (id: string | number) => `/wallets/${id}/resend-disbursement-otp`,
        pendingWithdrawals: '/wallets/pending-withdrawals',
        transactions: {
            base: (walletId: string) => `/wallets/${walletId}/transactions`,
            details: (walletId: string, transactionId: string) => `/wallets/${walletId}/transactions/${transactionId}`,
            validate: (walletId: string, transactionId: string) => `/wallets/${walletId}/transactions/${transactionId}/validate`,
        },
        payoutAccounts: {
            base: (walletId: string) => `/wallets/${walletId}/payout-accounts`,
            details: (walletId: string, accountId: string) => `/wallets/${walletId}/payout-accounts/${accountId}`,
            verify: (walletId: string, accountId: string) => `/wallets/${walletId}/payout-accounts/${accountId}/verify`,
        },
    },
    payments: {
        base: '/wallets/payments',
        details: (paymentId: string) => `/wallets/payments/${paymentId}`,
        validate: (paymentId: string) => `/wallets/payments/${paymentId}/validate`,
    },
    statistic: {
        base: '/stats',
        gatewayBalances: '/stats/gateway-balances',
        adminQueues: '/stats/admin/queues',
        adminAgentPerformance: '/stats/admin/agent-performance',
    },
    transactions: {
        base: '/wallets/transactions',
        details: (transactionId: string) => `/wallets/transactions/${transactionId}`,
        approveRefund: (transactionId: string) => `/wallets/transactions/${transactionId}/approve-refund`
    },
    network: {
        agents: {
            tier: (id: string | number) => `/admin/network/agents/${id}/tier`,
            adjust: (id: string | number) => `/admin/network/agents/${id}/adjust`,
        },
        remit: `/jobs/evaluate-agent-tiers`,
        mentorships: {
            base: `/admin/network/mentorship`,
            details: (id: string) => `/admin/network/mentorship/${id}`,
        },
        events: {
            base: `/admin/network/events`,
            details: (id: string) => `/admin/network/events/${id}`,
            update: (id: string) => `/admin/network/events/${id}/status`,
        },
        configs: {
            actions: {
                base: `/admin/network/configs/actions`,
                update: (actionType: string) => `/admin/network/configs/actions/${actionType}`,
            },
            tiers: {
                base: `/network/configs/tiers`,
            },
        },
        me: `/network/me`,
        history: `/network/history`,
        myMentorship: `/network/mentorship`,
        myMentorshipDetails: (id: string) => `/network/mentorship/${id}`,
        acceptMentorship: `/network/mentorship/accept`,
        mentorshipCandidates: `/network/mentorship/candidates`,
        createMentorshipInvite: `/network/mentorship/invite`,
    },
    permissions: {
        base: '/permissions',
        details: (permissionId: string) => `/permissions/${permissionId}`,
        rolePermissions: (role: string) => `/permissions/roles/${role}`,
        assignToRole: (role: string, permissionId: string) => `/permissions/roles/${role}/assign/${permissionId}`,
        removeFromRole: (role: string, permissionId: string) => `/permissions/roles/${role}/remove/${permissionId}`,
        seed: '/permissions/seed',
    },
    reviews: {
        base: '/reviews',
        propertyReviews: (propertyId: string | number) => `/properties/${propertyId}/reviews`,
        propertySummary: (propertyId: string | number) => `/properties/${propertyId}/reviews/summary`,
    },
    disputes: {
        base: '/disputes',
        myDisputes: '/disputes/my',
        details: (id: string | number) => `/disputes/${id}`,
        evidence: (disputeId: string | number) => `/disputes/${disputeId}/evidence`,
        deleteEvidence: (disputeId: string | number, evidenceId: string | number) => `/disputes/${disputeId}/evidence/${evidenceId}`,
    },
    referrals: {
        myCode: '/referrals/my-code',
        stats: '/referrals/stats',
        list: '/referrals/list',
    },
};


export const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_STAGING_API_URL
// (process.env.NEXT_PUBLIC_BASE_API_URL ||
//     process.env.NEXT_PUBLIC_BASE_STAGING_API_URL ||
//     process.env.NEXT_PUBLIC_BASE_LOCAL_API_URL ||
//     "").trim().replace(/\/+$/, "");

if (typeof window !== 'undefined') {
    console.log('[Endpoints] Initialized BASE_API_URL:', BASE_API_URL);
}