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
            update: (docId: number) => `/admin/kyc/${docId}`,
        },
        properties: {
            assign: (id: number) => `/admin/properties/${id}/assign`,
            verificationStatus: (id: number) => `/admin/properties/${id}/verify`,
            feature: (id: number) => `/admin/properties/${id}/feature`,
        },
        bookings: {
            base: '/bookings',
            update: (id: number) => `/admin/bookings/${id}`,
        },
        auditLogs: {
            index: '/admin/audit-logs',
        },
        users: {
            base: '/admin/users',
            userById: (id: number) => `/admin/users/${id}`,
            userByUuid: (id: string) => `/admin/users/${id}`
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
            details: (docId: number) => `/kyc/${docId}/details`,
        }
    },
    propertyManagement: {
        properties: {
            base: '/properties',
            details: (propertyId: number) => `/properties/${propertyId}`,
            amenities: (propertyId: number) => `/properties/${propertyId}/amenities`,
            media: (propertyId: number) => `/properties/${propertyId}/media`,
            verify: (id: number) => `/properties/${id}/verify`,
            units: {
                base: (propertyId: number) => `/properties/${propertyId}/units`,
                details: (propertyId: number, unitId: number) => `/properties/${propertyId}/units/${unitId}`,
                amenities: (propertyId: number, unitId: number) => `/properties/${propertyId}/units/${unitId}/amenities`,
                media: (propertyId: number, unitId: number) => `/properties/${propertyId}/units/${unitId}/media`,
                availability: (propertyId: number, unitId: number) => `/properties/${propertyId}/units/${unitId}/availability`,
            },
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
        details: (verificationId: number) => `/verifications/${verificationId}`
    },
    bookings: {
        base: '/bookings',
        details: (id: string) => `/bookings/${id}`,
        status: (id: number) => `/bookings/${id}/status`,
        pdf: (id: number) => `/bookings/${id}/pdf`,
    },
    wallet: {
        base: '/wallets',
        details: (id: string) => `/wallets/${id}`,
        withdraw: (id: string) => `/wallets/${id}/withdraw`,
        validateWithdrawal: (id: number) => `/wallets/${id}/validate-withdrawal`,
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
        base: '/payments',
        details: (paymentId: string) => `/payments/${paymentId}`,
        validate: (paymentId: string) => `/payments/${paymentId}/validate`,
    },
    statistic: {
        base: '/stats'
    },
    transactions: {
        base: '/transactions',
        details: (transactionId: string) => `/transactions/${transactionId}`
    },
};


const getApiUrl = (env: string) => {
    switch (env) {
        case 'test':
            return process.env.NEXT_PUBLIC_BASE_LOCAL_API_URL
        case 'development':
            return process.env.NEXT_PUBLIC_BASE_STAGING_API_URL
        case 'production':
            return process.env.NEXT_PUBLIC_BASE_API_URL
        default:
            return process.env.NEXT_PUBLIC_BASE_STAGING_API_URL
    }
}

export const BASE_API_URL = getApiUrl(process.env.NEXT_PUBLIC_NODE_ENV!) || process.env.NEXT_PUBLIC_BASE_API_URL || "";