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
            reviewDiscountProposal: (propertyId: string | number) => `/properties/${propertyId}/discounts/review-proposal`,
        },
        amenities: {
            base: '/amenities',
        },
        eventTypes: {
            base: '/event-types',
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
            quote: (bookingId: string | number) => `/bookings/${bookingId}/extensions/quote`,
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
        reverseWithdrawal: (id: string | number) => `/wallets/${id}/reverse-withdrawal`,
        authorizeDisbursement: (id: string | number) => `/wallets/${id}/authorize-disbursement`,
        resendDisbursementOtp: (id: string | number) => `/wallets/${id}/resend-disbursement-otp`,
        // Per-row manual override. Since withdrawals became PENDING-until-settled,
        // the only automatic paths to SUCCESSFUL are the disbursement webhook and
        // the reconciliation cron; when either is down, this is how an operator
        // resolves a stuck payout instead of guessing.
        refreshWithdrawalStatus: (walletId: string | number, transactionId: string | number) =>
            `/wallets/${walletId}/withdrawals/${transactionId}/refresh-status`,
        pendingWithdrawals: '/wallets/pending-withdrawals',
        // Bulk sweep, admin-runnable as well as cron-runnable.
        reconcileDisbursementsJob: '/jobs/reconcile-stuck-disbursements',
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
            candidates: `/admin/network/mentorship/candidates`,
            mentors: `/admin/network/mentorship/mentors`,
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
                base: `/admin/network/configs/tiers`,
            },
            zones: {
                base: `/admin/network/configs/zones`,
                details: (id: string) => `/admin/network/configs/zones/${id}`,
                assignments: {
                    base: `/admin/network/configs/zones/assignments`,
                    details: (id: string) => `/admin/network/configs/zones/assignments/${id}`,
                },
            },
        },
        zonePayoutJob: `/jobs/evaluate-zone-payouts`,
        me: `/network/me`,
        zoneMe: `/network/zone/me`,
        myZoneAssignments: `/network/zone-assignments`,
        myZoneAssignmentDetails: (id: string) => `/network/zone-assignments/${id}`,
        history: `/network/history`,
        // One event out of the caller's own feed, scoped by the same
        // VisibilityScope. Lets an agent follow a row's related_event_id;
        // the admin single-event route is not reachable for them.
        historyDetails: (id: string) => `/network/history/${id}`,
        // The agents the caller may filter their network views by — self,
        // their mentees, and (Area Manager / Regional Lead) every agent holding
        // a property in their zone tree. Distinct from `network.agents` above,
        // which is the admin tier/adjust pair.
        myNetworkAgents: `/network/agents`,
        // Read-only profile of one agent in the caller's scope. Narrower than
        // the admin user detail on purpose: agents do not hold users.read, so
        // no NIN/BVN, KYC state, wallet or payout data is returned.
        myNetworkAgentProfile: (id: string) => `/network/agents/${id}`,
        myMentorship: `/network/mentorship`,
        myMentorshipDetails: (id: string) => `/network/mentorship/${id}`,
        mentorshipCandidates: `/network/mentorship/candidates`,
        // A mentor's create is a REQUEST: it lands PENDING and is settled by the
        // mentee's immediate zone lead or an admin. It does not become active
        // on submit.
        createMentorshipInvite: `/network/mentorship/invite`,
        // Settle a PENDING request. Approve → ACTIVE; reject DELETES the row
        // and notifies both parties naming the decider.
        approveMentorship: (id: string) => `/network/mentorship/${id}/approve`,
        rejectMentorship: (id: string) => `/network/mentorship/${id}/reject`,
        // Area Manager / Regional Lead pairing two agents inside their own zone
        // tree — created ACTIVE, no approval step, since the lead is already
        // the approver.
        assignMentorship: `/network/mentorship/assign`,
    },
    platform: {
        // Readable by any authenticated user — every client needs to know
        // whether to render the Network navigation at all.
        features: '/platform/features',
        // SUPER_ADMIN only; adds who last moved the switch.
        adminFeatures: '/admin/platform/features',
        networkFeature: '/admin/platform/features/network',
    },
    permissions: {
        base: '/permissions',
        details: (permissionId: string) => `/permissions/${permissionId}`,
        assignableRoles: '/permissions/roles',
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
    reports: {
        statements: {
            base: (ownerId: string) => `/reports/owners/${ownerId}/statements`,
            download: (ownerId: string, year: string | number, month: string | number) => `/reports/owners/${ownerId}/statements/${year}/${month}/download`,
            details: (ownerId: string, year: string | number, month: string | number) => `/reports/owners/${ownerId}/statements/${year}/${month}`,
        },
        bookings: {
            export: '/reports/bookings/export',
        }
    },
    agents: {
        statements: {
            base: (agentId: string) => `/reports/agents/${agentId}/statements`,
            download: (agentId: string, year: string | number, month: string | number) => `/reports/agents/${agentId}/statements/${year}/${month}/download`,
        },
        bookings: {
            export: '/reports/agents/bookings/export',
        }
    },
    // Aparte Link — the owner/agent's public catalog page at aparte.ng/@handle
    links: {
        myCatalog: '/links/catalogs/me',
        myCatalogAnalytics: (window: string) => `/links/catalogs/me/analytics?window=${window}`,
        // Returns PNG bytes, not JSON — fetch it as a blob.
        catalogQr: (userId: string, size = 512) =>
            `/links/qr?target=catalog&id=${userId}&size=${size}`,
    },
    ical: {
        units: {
            outbound: (unitId: string | number) => `/ical/units/${unitId}/outbound`,
            outboundRotate: (unitId: string | number) => `/ical/units/${unitId}/outbound/rotate`,
            feeds: (unitId: string | number) => `/ical/units/${unitId}/feeds`,
            feedAction: (unitId: string | number, feedId: string | number) => `/ical/units/${unitId}/feeds/${feedId}`,
            syncFeed: (unitId: string | number, feedId: string | number) => `/ical/units/${unitId}/feeds/${feedId}/sync`,
            externalBookings: (unitId: string | number) => `/ical/units/${unitId}/external-bookings`,
        },
        admin: {
            feeds: '/ical/admin/feeds',
            forcePoll: (feedId: string | number) => `/ical/admin/feeds/${feedId}/force-poll`,
            disable: (feedId: string | number) => `/ical/admin/feeds/${feedId}/disable`,
            enable: (feedId: string | number) => `/ical/admin/feeds/${feedId}/enable`,
            conflicts: '/ical/admin/conflicts',
            resolveConflict: '/ical/admin/conflicts/resolve',
        }
    }
};


// Read the general var FIRST. This chain was commented out and pinned to
// NEXT_PUBLIC_BASE_STAGING_API_URL alone, which cloudbuild.yaml never sets —
// it passes only NEXT_PUBLIC_BASE_API_URL. So on the Cloud Run build this was
// `undefined`, axios fell back to a relative baseURL, `/profile` resolved
// against the dashboard's own origin and returned the HTML 404 page, and the
// login screen reported "Authentication failed. Please login with your
// credentials." — which reads as a rejected password, not a missing env var.
// Vercel-built and Cloud-Run-built dashboards therefore behaved differently
// from identical source.
//
// These are inlined by Next at build time, so the chain resolves at compile
// time, not runtime.
export const BASE_API_URL = (
    process.env.NEXT_PUBLIC_BASE_API_URL ||
    process.env.NEXT_PUBLIC_BASE_STAGING_API_URL ||
    process.env.NEXT_PUBLIC_BASE_LOCAL_API_URL ||
    ""
).trim().replace(/\/+$/, "");

if (typeof window !== 'undefined' && !BASE_API_URL) {
    // Loud, because the silent version of this cost a release. Without a base
    // URL every request targets this origin and fails as an auth error.
    console.error(
        '[Endpoints] No API base URL configured. Set NEXT_PUBLIC_BASE_API_URL ' +
        'at build time — every API call will otherwise resolve against this origin.'
    );
}