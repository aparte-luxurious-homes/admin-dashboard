import { JSX } from "react";
import { IoIosGitNetwork } from "react-icons/io";
import { BellIcon, BookingIcon, FinancialsIcon, PropertiesIcon, TilesIcon, UsersIcon, SettingsIcon, RateIcon, PriceTagIcon } from "../../components/icons";
import { PAGE_ROUTES } from "./page_routes";
import { UserRole } from "../enums";

export type NavBadgeKey = 'approvalPending';

export interface ILinkChild {
    name: string,
    pathName: string,
    link: string,
    allow: UserRole[],
    badgeKey?: NavBadgeKey,
}

export interface ILink {
    name: string,
    pathName: string,
    link: string,
    icon: JSX.Element,
    allow: UserRole[],
    secondary?: boolean,
    children?: ILinkChild[],
}

export const NAV_LINKS: ILink[] = [
    {
        name: 'Dashboard',
        pathName: '',
        link: PAGE_ROUTES.dashboard.base,
        icon: <TilesIcon className={"w-5"} color={"white"} />,
        allow: Object.values(UserRole),
        secondary: false,
        children: undefined,
    },
    {
        name: 'User Management',
        pathName: 'user-management',
        link: PAGE_ROUTES.dashboard.userManagement.guests.base,
        icon: <UsersIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN],
        secondary: true,
        children: [
            {
                name: 'Guests',
                pathName: 'guests',
                link: PAGE_ROUTES.dashboard.userManagement.guests.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN],
            },
            {
                name: 'Owners',
                pathName: 'owners',
                link: PAGE_ROUTES.dashboard.userManagement.owners.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN],
            },
            {
                name: 'Agents',
                pathName: 'agents',
                link: PAGE_ROUTES.dashboard.userManagement.agents.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN],
            },
            {
                name: 'Admins',
                pathName: 'admins',
                link: PAGE_ROUTES.dashboard.userManagement.admins.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN],
            },
            {
                name: 'KYC Queue',
                pathName: 'kyc-queue',
                link: PAGE_ROUTES.dashboard.userManagement.kycQueue.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN],
            },
        ]
    },
    {
        name: 'Properties Management',
        pathName: 'properties-management',
        link: PAGE_ROUTES.dashboard.propertyManagement.allProperties.base,
        icon: <PropertiesIcon className={"w-5"} color={"white"} />,
        allow: Object.values(UserRole),
        secondary: true,
        children: [
            {
                name: 'All properties',
                pathName: 'all-properties',
                link: PAGE_ROUTES.dashboard.propertyManagement.allProperties.base,
                allow: Object.values(UserRole),
            },
            {
                name: 'Manage verifications',
                pathName: 'manage-verifications',
                link: PAGE_ROUTES.dashboard.propertyManagement.manageVerifications.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN],
            },
            {
                name: 'My verifications',
                pathName: 'my-verifications',
                link: PAGE_ROUTES.dashboard.propertyManagement.myVerifications.base,
                allow: [UserRole.AGENT],
            },
        ]
    },
    {
        name: 'Network',
        pathName: 'network',
        link: PAGE_ROUTES.dashboard.network.history.base,
        icon: <IoIosGitNetwork size={20} color="white" />,
        allow: [UserRole.AGENT],
        secondary: true,
        children: [
            {
                name: 'My Events',
                pathName: 'history',
                link: PAGE_ROUTES.dashboard.network.history.base,
                allow: [UserRole.AGENT],
            },
            {
                name: 'Actions',
                pathName: 'actions',
                link: PAGE_ROUTES.dashboard.network.configs.actions.base,
                allow: [UserRole.AGENT],
            },
        ]
    },
    {
        name: 'Network Management',
        pathName: 'network',
        link: PAGE_ROUTES.dashboard.network.events.base,
        icon: <IoIosGitNetwork size={20} color="white" />,
        allow: [UserRole.ADMIN],
        secondary: true,
        children: [
            {
                name: 'Events',
                pathName: 'events',
                link: PAGE_ROUTES.dashboard.network.events.base,
                allow: [UserRole.ADMIN],
            },
            {
                name: 'Actions',
                pathName: 'actions',
                link: PAGE_ROUTES.dashboard.network.configs.actions.base,
                allow: [UserRole.ADMIN],
            },
        ]
    },
    {
        name: 'Booking Management',
        pathName: 'booking-management',
        link: PAGE_ROUTES.dashboard.bookingManagement.bookings.base,
        icon: <BookingIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT, UserRole.OWNER, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN],
        secondary: true,
        children: [
            {
                name: 'Bookings',
                pathName: 'bookings',
                link: PAGE_ROUTES.dashboard.bookingManagement.bookings.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT, UserRole.OWNER, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN],
            },
            {
                name: 'Booking requests',
                pathName: 'requests',
                link: PAGE_ROUTES.dashboard.bookingManagement.bookingRequests.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT, UserRole.OWNER, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN],
                badgeKey: 'approvalPending',
            },
            {
                name: 'Booking disputes',
                pathName: 'booking-disputes',
                link: PAGE_ROUTES.dashboard.bookingManagement.bookingDisputes.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.OWNER, UserRole.AGENT],
            },
            {
                name: 'Stay extensions',
                pathName: 'stay-extensions',
                link: PAGE_ROUTES.dashboard.bookingManagement.stayExtensions.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.OWNER, UserRole.AGENT],
            },
        ]
    },
    {
        name: 'Reviews',
        pathName: 'reviews',
        link: PAGE_ROUTES.dashboard.reviews.base,
        icon: <RateIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        secondary: false,
        children: undefined,
    },
    {
        name: 'Financials',
        pathName: 'financials',
        link: '/financials',
        icon: <FinancialsIcon className={"w-5"} color={"white"} />,
        allow: [],
        secondary: true,
        children: [
            {
                name: 'Payment processing',
                pathName: 'payment-processing',
                link: '/financials/payment-processing',
                allow: [],
            },
            {
                name: 'Commission',
                pathName: 'payment-processing',
                link: '/financials/payment-processing',
                allow: [],
            },
        ]
    },
    {
        name: 'Transactions',
        pathName: 'transactions',
        link: PAGE_ROUTES.dashboard.transactions.payments.base,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT, UserRole.OWNER, UserRole.OPERATIONS_ADMIN],
        icon: <FinancialsIcon className={"w-5"} color={"white"} />,
        secondary: true,
        children: [
            {
                name: 'All Transactions',
                pathName: 'all',
                link: PAGE_ROUTES.dashboard.transactions.all.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN],
            },
            {
                name: 'Payments',
                pathName: 'payments',
                link: PAGE_ROUTES.dashboard.transactions.payments.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT, UserRole.OWNER, UserRole.OPERATIONS_ADMIN],
            },
            {
                name: 'Withdrawals',
                pathName: 'withdrawals',
                link: PAGE_ROUTES.dashboard.transactions.withdrawals.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT, UserRole.OWNER, UserRole.OPERATIONS_ADMIN],
            },
            {
                name: 'Booking withdrawals',
                pathName: 'booking-withdrawals',
                link: PAGE_ROUTES.dashboard.transactions.bookingWithdrawals.base,
                allow: [UserRole.ADMIN],
            },
            {
                name: 'Refunds',
                pathName: 'refunds',
                link: PAGE_ROUTES.dashboard.transactions.refunds.base,
                allow: [UserRole.ADMIN],
            },
        ]
    },
    {
        name: 'Referrals',
        pathName: 'referrals',
        link: PAGE_ROUTES.dashboard.referrals.base,
        icon: <PriceTagIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT],
        secondary: true,
        children: [
            {
                // Overview shows the user's own referral code + link via
                // useMyReferralInfo (open to any authenticated user); for admins
                // it also shows the platform-wide referral relationships table
                // (gated inside the page by `isAdmin`). AGENT lands here to grab
                // their referral code — the admin-only section stays hidden.
                name: 'Overview',
                pathName: 'referrals',
                link: PAGE_ROUTES.dashboard.referrals.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT],
            },
            {
                name: 'My Referrals',
                pathName: 'list',
                link: PAGE_ROUTES.dashboard.referrals.list,
                allow: [UserRole.AGENT],
            },
            {
                name: 'Stats',
                pathName: 'stats',
                link: PAGE_ROUTES.dashboard.referrals.agentStats,
                allow: [UserRole.AGENT],
            },
        ]
    },
    {
        name: 'Audit Logs',
        pathName: 'audit-logs',
        link: '/audit-logs',
        icon: <FinancialsIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        secondary: false,
        children: undefined,
    },
    {
        name: 'Roles & Permissions',
        pathName: 'roles-permissions',
        link: PAGE_ROUTES.dashboard.rolesPermissions.base,
        icon: <UsersIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        secondary: false,
        children: undefined,
    },
    {
        name: 'Reports',
        pathName: 'reports',
        link: PAGE_ROUTES.dashboard.reports.agentPerformance,
        icon: <FinancialsIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.ANALYST],
        secondary: true,
        children: [
            {
                name: 'Agent Performance',
                pathName: 'agent-performance',
                link: PAGE_ROUTES.dashboard.reports.agentPerformance,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.ANALYST],
            },
        ]
    },
    {
        name: 'Notifications (coming soon)',
        pathName: 'notifications',
        link: '#',
        icon: <BellIcon className={"w-5 opacity-50"} color={"white"} />,
        allow: Object.values(UserRole),
        secondary: true,
        children: undefined,
    },
    {
        name: 'My Wallet',
        pathName: 'wallet',
        link: PAGE_ROUTES.dashboard.wallet.base,
        icon: <FinancialsIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.OWNER, UserRole.AGENT],
        secondary: false,
        children: undefined,
    },
    {
        name: 'Settings',
        pathName: 'settings',
        link: PAGE_ROUTES.dashboard.settings.base,
        icon: <SettingsIcon className={"w-5"} color={"white"} />,
        allow: Object.values(UserRole),
        secondary: false,
        children: undefined,
    },
]
