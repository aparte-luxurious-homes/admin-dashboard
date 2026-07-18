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
            kycQueue: {
                base: '/user-management/kyc-queue',
            },
        },
        bookingManagement: {
            bookingDisputes: {
                base: '/booking-management/booking-disputes',
                details: (id: string | number) => `/booking-management/booking-disputes/${id}`,
            },
            bookings: {
                base: '/booking-management/bookings',
                create: '/booking-management/bookings/create',
                details: (id: string) => `/booking-management/bookings/${id}`,
            },
            bookingRequests: {
                base: '/booking-management/requests',
            },
            stayExtensions: {
                base: '/booking-management/stay-extensions',
            }
        },
        reviews: {
            base: '/reviews',
            details: (id: string | number) => `/reviews/${id}`,
        },
        referrals: {
            base: '/referrals',
            agentStats: '/referrals/stats',
            list: '/referrals/list',
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
            manageVerifications: {
                base: '/property-management/manage-verifications',
            },
            myVerifications: {
                base: '/property-management/my-verifications',
            },
        },
        transactions: {
            all: {
                base: '/transactions/all',
                details: (id: number | string) => `/transactions/all/${id}`,
            },
            payments: {
                base: '/transactions/payments',
                details: (id: number | string) => `/transactions/payments/${id}`,
            },
            refunds: {
                base: '/transactions/refunds',
                details: (id: number | string) => `/transactions/refunds/${id}`,
            },
            withdrawals: {
                base: '/transactions/withdrawals',
                details: (id: number | string) => `/transactions/withdrawals/${id}`,
            },
            bookingWithdrawals: {
                base: '/transactions/booking-withdrawals',
                details: (id: number | string) => `/transactions/booking-withdrawals/${id}`,
            },
        },
        notifications: {
            createNotification: {
                base: '/notifications/create-notification',
            },
            manageNotifications: {
                base: '/notifications/manage-notifications',
                details: (id: number | string) => `/notifications/manage-notifications/${id}`,
            },
        },
        settings: {
            base: '/settings',
            kyc: '/settings/kyc',
        },
        rolesPermissions: {
            base: '/roles-permissions',
        },
        reports: {
            base: '/reports',
            agentPerformance: '/reports/agent-performance',
            statements: '/reports/statements',
        },
        wallet: {
            base: '/wallet',
        },
        icalManagement: {
            feeds: '/ical-management/feeds',
            conflicts: '/ical-management/conflicts',
        },
        network: {
            base: '/network',
            events: {
                base: '/network/events',
                details: (id: string) => `/network/events/${id}`,
            },
            history: {
                base: '/network/history',
            },
            agents: {
                base: '/network/agents',
                details: (id: string) => `/network/agents/${id}`,
                events: (id: string) => `/network/agents/${id}/events`,
                adjust: (id: string) => `/network/agents/${id}/adjust`,
            },
            configs: {
                actions: {
                    base: '/network/configs/actions',
                },
                tiers: {
                    base: '/network/configs/tiers',
                },
            },
        },
    }
}