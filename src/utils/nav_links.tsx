import { JSX } from "react";
import { BellIcon, BookingIcon, FinancialsIcon, PropertiesIcon, TilesIcon, UsersIcon } from "../components/icons";
import { PAGE_ROUTES } from "./page_routes";

export const NAV_LINKS = [
    {
        key: 1,
        name: 'Dashboard',
        pathName: '',
        link: PAGE_ROUTES.dashboard.base,
        icon: <TilesIcon className={"w-5"} color={"white"} />,
        secondary: false,
        children: undefined,
    },
    {
        key: 2,
        name: 'User Management',
        pathName: 'user-management',
        link: '/user-management',
        icon: <UsersIcon className={"w-5"} color={"white"} />,
        secondary: true,
        children: [
            {
                key: 1,
                name: 'Guests',
                pathName: 'guests',
                link: PAGE_ROUTES.dashboard.userManagement.guests.base,
            },
            {
                key: 2,
                name: 'Owners',
                pathName: 'owners',
                link: PAGE_ROUTES.dashboard.userManagement.owners.base,
            },
            {
                key: 3,
                name: 'Agents',
                pathName: 'agents',
                link: PAGE_ROUTES.dashboard.userManagement.agents.base,
            },
        ]
    },
    {   
        key: 3,
        name: 'Properties Management',
        pathName: 'properties-management',
        link: '/property-management',
        icon: <PropertiesIcon className={"w-5"} color={"white"} />,
        secondary: true,
        children: [
            {
                key: 1,
                name: 'All properties',
                pathName: 'all-properties',
                link: PAGE_ROUTES.dashboard.propertyManagement.allProperties.base,
            },
            {
                key: 2,
                name: 'Assign agents',
                pathName: 'assign-agents',
                link: PAGE_ROUTES.dashboard.propertyManagement.assignAgents.base,
            },
            {
                key: 3,
                name: 'Manage verifications',
                pathName: 'manage-verifications',
                link: PAGE_ROUTES.dashboard.propertyManagement.manageVerifications.base,
            },
        ]
    },
    {
        key: 4,
        name: 'Booking Management',
        pathName: 'booking-management',
        link: '/booking-management',
        icon: <BookingIcon className={"w-5"} color={"white"} />,
        secondary: true,
        children: [
            {
                key: 1,
                name: 'Bookings',
                pathName: 'bookings',
                link: PAGE_ROUTES.dashboard.bookingManagement.bookings.base,
            },
            {
                key: 2,
                name: 'Booking disputes',
                pathName: 'booking-disputes',
                link: PAGE_ROUTES.dashboard.bookingManagement.bookingDisputes.base,
            },
        ]
    },
    // {
    //     key: 5,
    //     name: 'Financials',
    //     pathName: 'financials',
    //     link: '/financials',
    //     icon: <FinancialsIcon className={"w-5"} color={"white"} />,
    //     secondary: true,
    //     children: [
    //         {
    //             name: 'Revenue reports',
    //             pathName: 'revenue-reports',
    //             link: '/financials/revenue-reports',
    //         },
    //         {
    //             name: 'Payment processing',
    //             pathName: 'payment-processing',
    //             link: '/financials/payment-processing',
    //         },
    //         {
    //             name: 'Commission',
    //             pathName: 'payment-processing',
    //             link: '/financials/payment-processing',
    //         },
    //     ]
    // },
    {
        key: 6,
        name: 'Transactions',
        pathName: 'transactions',
        link: '/transactions',
        icon: <FinancialsIcon className={"w-5"} color={"white"} />,
        secondary: true,
        children: [
            {
                key: 1,
                name: 'Payments',
                pathName: 'payments',
                link: PAGE_ROUTES.dashboard.transactions.payments.base,
            },
            {
                key: 2,
                name: 'Withdrawals',
                pathName: 'withdrawals',
                link: PAGE_ROUTES.dashboard.transactions.withdrawals.base,
            },
            {
                key: 3,
                name: 'Booking withdrawals',
                pathName: 'booking-withdrawals',
                link: PAGE_ROUTES.dashboard.transactions.bookingWithdrawals.base,
            },
            {
                key: 4,
                name: 'Refunds',
                pathName: 'refunds',
                link: PAGE_ROUTES.dashboard.transactions.refunds.base,
            },
        ]
    },
    {
        key: 7,
        name: 'Notifications',
        pathName: 'notifications',
        link: '/notifications',
        icon: <BellIcon className={"w-5"} color={"white"} />,
        secondary: true,
        children: [
            {
                key: 1,
                name: 'Manage notifications',
                pathName: 'manage-notifications',
                link: PAGE_ROUTES.dashboard.notifications.manageNotifications.base,
            },
            {
                key: 2,
                name: 'Create notification',
                pathName: 'create-notification',
                link: PAGE_ROUTES.dashboard.notifications.createNotification.base,
            },
        ]
    },
]

export interface ILinkChild {
    key: number,
    name: string,
    pathName: string,
    link: string,
}

export interface ILink {
    key: number,
    name: string,
    pathName: string,
    link: string,
    icon: JSX.Element,
    secondary?: boolean,
    children?: ILinkChild[],
}