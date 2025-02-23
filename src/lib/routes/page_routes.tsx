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
                details: (id: number) => `/booking-management/bookings/${id}`,
            },
        },
        propertyManagement: {
            allProperties: {
                base: '/property-management/all-properties',
                details: (id: number) => `/property-management/all-properties/${id}`,
            },
            assignAgents: {
                base: '/property-management/assign-agents',
                details: (id: number) => `/property-management/assign-agents/${id}`,
            },
            manageVerifications: {
                base: '/property-management/manage-verifications',
                details: (id: number) => `/property-management//manage-verifications/${id}`,
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