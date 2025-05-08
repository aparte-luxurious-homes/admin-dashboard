import { JSX } from "react";
import { BellIcon, BookingIcon, FinancialsIcon, PropertiesIcon, TilesIcon, UsersIcon } from "../../components/icons";
import { PAGE_ROUTES } from "./page_routes";
import { UserRole } from "../enums";

export interface ILinkChild {
    name: string,
    pathName: string,
    link: string,
    allow: UserRole[],
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
        link: '/user-management',
        icon: <UsersIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN],
        secondary: true,
        children: [
            {
                name: 'Guests',
                pathName: 'guests',
                link: PAGE_ROUTES.dashboard.userManagement.guests.base,
                allow: [UserRole.ADMIN],
            },
            {
                name: 'Owners',
                pathName: 'owners',
                link: PAGE_ROUTES.dashboard.userManagement.owners.base,
                allow: [UserRole.ADMIN],
            },
            {
                name: 'Agents',
                pathName: 'agents',
                link: PAGE_ROUTES.dashboard.userManagement.agents.base,
                allow: [UserRole.ADMIN],
            },
        ]
    },
    {
        name: 'Properties Management',
        pathName: 'properties-management',
        link: '/property-management',
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
            // {
            //     name: 'Create property',
            //     pathName: 'create',
            //     link: PAGE_ROUTES.dashboard.propertyManagement.allProperties.create,
            //     allow: [UserRole.ADMIN, UserRole.OWNER],
            // },
            {
                name: 'Manage verifications',
                pathName: 'manage-verifications',
                link: PAGE_ROUTES.dashboard.propertyManagement.manageVerifications.base,
                allow: [UserRole.ADMIN],
            },
        ]
    },
    {
        name: 'Booking Management',
        pathName: 'booking-management',
        link: '/booking-management',
        icon: <BookingIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN],
        secondary: true,
        children: [
            {
                name: 'Bookings',
                pathName: 'bookings',
                link: PAGE_ROUTES.dashboard.bookingManagement.bookings.base,
                allow: [UserRole.ADMIN],
            },
            {
                name: 'Booking disputes',
                pathName: 'booking-disputes',
                link: PAGE_ROUTES.dashboard.bookingManagement.bookingDisputes.base,
                allow: [UserRole.ADMIN],
            },
        ]
    },
    {
        name: 'Financials',
        pathName: 'financials',
        link: '/financials',
        icon: <FinancialsIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.AGENT, UserRole.OWNER],
        secondary: true,
        children: [
            // {
            //     name: 'Revenue reports',
            //     pathName: 'revenue-reports',
            //     link: '/financials/revenue-reports',
            //     allow: [UserRole.AGENT, UserRole.OWNER],
            // },
            {
                name: 'Payment processing',
                pathName: 'payment-processing',
                link: '/financials/payment-processing',
                allow: [UserRole.AGENT, UserRole.OWNER],
            },
            {
                name: 'Commission',
                pathName: 'payment-processing',
                link: '/financials/payment-processing',
                allow: [UserRole.AGENT, UserRole.OWNER],
            },
        ]
    },
    {
        name: 'Transactions',
        pathName: 'transactions',
        link: '/transactions',
        allow: [UserRole.ADMIN],
        icon: <FinancialsIcon className={"w-5"} color={"white"} />,
        secondary: true,
        children: [
            {
                name: 'Payments',
                pathName: 'payments',
                link: PAGE_ROUTES.dashboard.transactions.payments.base,
                allow: [UserRole.ADMIN],
            },
            {
                name: 'Withdrawals',
                pathName: 'withdrawals',
                link: PAGE_ROUTES.dashboard.transactions.withdrawals.base,
                allow: [UserRole.ADMIN],
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
        name: 'Notifications',
        pathName: 'notifications',
        link: '/notifications',
        icon: <BellIcon className={"w-5"} color={"white"} />,
        allow: Object.values(UserRole),
        secondary: true,
        children: [
            {
                name: 'Manage notifications',
                pathName: 'manage-notifications',
                link: PAGE_ROUTES.dashboard.notifications.manageNotifications.base,
                allow: Object.values(UserRole),
            },
            {
                name: 'Create notification',
                pathName: 'create-notification',
                link: PAGE_ROUTES.dashboard.notifications.createNotification.base,
                allow: [UserRole.ADMIN],
            },
        ]
    },
]

