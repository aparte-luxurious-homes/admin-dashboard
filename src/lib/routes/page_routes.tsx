export const PAGE_ROUTES = {
    auth: {
        login: '/auth/login',
        passwordReset: '/auth/password-reset',
        changePassword: '/auth/changePassword',
    },
    dashboard: {
        base: '/',
        userManagement: {
            guests: {
                base: '/user-management/guests',
                details: (id: number) => `/user-management/guests/${id}`,
            },
            owners: {
                base: '/user-management/owners',
                details: (id: number) => `/user-management/owners/${id}`,
            },
            agents: {
                base: '/user-management/agents',
                details: (id: number) => `/user-management/agents/${id}`,
            },
            admins: {
                base: '/user-management/admins',
                details: (id: number) => `/user-management/admins/${id}`,
            },
        },
        bookingManagement: {
            bookingDisputes: {
                base: '/booking-management/booking-disputes',
                details: (id: number) => `/booking-management/booking-disputes/${id}`,
            },
            bookings: {
                base: '/booking-management/bookings',
                create: '/booking-management/bookings/create',
                details: (id: string) => `/booking-management/bookings/${id}`,
            },
        },
        propertyManagement: {
            allProperties: {
                base: '/property-management/all-properties',
                create: '/property-management/create',
                details: (propertyId: number | string) => `/property-management/all-properties/${propertyId}`,
                verifications: {
                    base: (propertyId: number | string) => `/property-management/all-properties/${propertyId}/verifications`,
                    details: (propertyId: number | string, verificationId: number | string) => `/property-management/all-properties/${propertyId}/verifications/${verificationId}`
                },
                units: {
                    base: (propertyId: number | string) => `/property-management/all-properties/${propertyId}/units`,
                    create: (propertyId: number | string) => `/property-management/all-properties/${propertyId}/create-unit`,
                    details: (propertyId: number | string, unitId: number | string) => `/property-management/all-properties/${propertyId}/units/${unitId}`,
                    bookings: (propertyId: number | string, unitId: number | string) => `/property-management/all-properties/${propertyId}/units/${unitId}/bookings`,
                },
            },
            assignAgents: {
                base: '/property-management/assign-agents',
                details: (id: number | string) => `/property-management/assign-agents/${id}`,
            },
            manageVerifications: {
                base: '/property-management/manage-verifications',
                details: (verificationId: number | string) => `/property-management/manage-verifications/${verificationId}`,
            },
        },
        transactions: {
            payments: {
                base: '/transactions/payments',
                details: (id: number) => `/transactions/payments/${id}`,
            },
            refunds: {
                base: '/transactions/refunds',
                details: (id: number) => `/transactions/refunds/${id}`,
            },
            withdrawals: {
                base: '/transactions/withdrawals',
                details: (id: number) => `/transactions/withdrawals/${id}`,
            },
            bookingWithdrawals: {
                base: '/transactions/booking-withdrawals',
                details: (id: number) => `/transactions/booking-withdrawals/${id}`,
            },
        },
        notifications: {
            createNotification: {
                base: '/notifications/create-notification',
            },
            manageNotifications: {
                base: '/notifications/manage-notifications',
                details: (id: number) => `/notifications/manage-notifications/${id}`,
            },
        },
        settings: {
            base: '/settings',
        }
    }
}