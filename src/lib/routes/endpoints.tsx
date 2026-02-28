export const API_ROUTES = {
    auth: {
        signUp: '/auth/signup',
        verifyOtp: '/auth/otp/verify',
        login: '/auth/login',
        requestPasswordReset: '/auth/password/otp',
        passwordReset: '/auth/password/reset',
        resendOtp: '/auth/otp/resend',
        logout: '/auth/logout',
    },
    admin: {
        kyc: {
            base: '/admin/kyc',
            update: (docId: string | number) => `/admin/kyc/${docId}`,
        },
        properties: {
            assign: (id: string | number) => `/admin/properties/${id}/assign`,
            verificationStatus: (id: string | number) => `/admin/properties/${id}/verify`,
            feature: (id: string | number) => `/admin/properties/${id}/feature`,
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
            userByUuid: (id: string | number) => `/admin/users/${id}`
        }
    },
    profile: {
        show: '/profile',
        update: '/profile',
        updatePassword: '/profile/password',
        kycStatus: '/profile/kyc-status',
        verifyGovId: '/profile/verify-gov-id',
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
            // verifications: {
            //     base: (propertyId: number) => `/properties/${propertyId}/verifications`,
            //     details: (propertyId: number, verificationId: number) => `/properties/${propertyId}/verifications/${verificationId}`
            // }
        },
        amenities: {
            base: '/amenities',
        },
    },
    verifications: {
        base: '/verifications',
        details: (verificationId: string | number) => `/verifications/${verificationId}`
    },
    bookings: {
        base: '/bookings',
        details: (id: string) => `/bookings/${id}`,
        status: (id: string | number) => `/bookings/${id}/status`,
        pdf: (id: string | number) => `/bookings/${id}/pdf`,
    },
    wallet: {
        base: '/wallets',
        details: (id: string) => `/wallets/${id}`,
        withdraw: (id: string) => `/wallets/${id}/withdraw`,
        approveWithdrawal: (id: string | number) => `/wallets/${id}/approve-withdrawal`,
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
        base: '/stats'
    },
    transactions: {
        base: '/wallets/transactions',
        details: (transactionId: string) => `/wallets/transactions/${transactionId}`,
        approveRefund: (transactionId: string) => `/wallets/transactions/${transactionId}/approve-refund`
    },
    permissions: {
        base: '/permissions',
        details: (permissionId: string) => `/permissions/${permissionId}`,
        rolePermissions: (role: string) => `/permissions/roles/${role}`,
        assignToRole: (role: string, permissionId: string) => `/permissions/roles/${role}/assign/${permissionId}`,
        removeFromRole: (role: string, permissionId: string) => `/permissions/roles/${role}/remove/${permissionId}`,
        seed: '/permissions/seed',
    },
};


const rawUrl = process.env.NEXT_PUBLIC_BASE_API_URL ||
    process.env.NEXT_PUBLIC_BASE_STAGING_API_URL ||
    process.env.NEXT_PUBLIC_BASE_LOCAL_API_URL ||
    "";

export const BASE_API_URL = rawUrl.trim().replace(/\/+$/, "");

if (typeof window !== 'undefined') {
    console.log('[Endpoints] Initialized BASE_API_URL:', BASE_API_URL);
}