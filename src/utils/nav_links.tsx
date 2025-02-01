import { JSX } from "react";
import { BellIcon, BookingIcon, FinancialsIcon, PropertiesIcon, TilesIcon, UsersIcon } from "../components/icons";

export const NAV_LINKS = [
    {
        key: 1,
        name: 'Dashboard',
        pathName: 'dashboard',
        link: '/user-management',
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
                link: '/user-management/guests',
            },
            {
                key: 2,
                name: 'Owner',
                pathName: 'owner',
                link: '/user-management/owner',
            },
            {
                key: 3,
                name: 'Agent',
                pathName: 'agent',
                link: '/user-management/agent',
            },
        ]
    },
    {   
        key: 3,
        name: 'Properties Management',
        pathName: 'properties-management',
        link: '/properties-management',
        icon: <PropertiesIcon className={"w-5"} color={"white"} />,
        secondary: true,
        children: [
            {
                key: 1,
                name: 'All properties',
                pathName: 'all-properties',
                link: '/properties-management/all-properties',
            },
            {
                key: 2,
                name: 'Assign agents',
                pathName: 'assign-agents',
                link: '/properties-management/assign-agents',
            },
            {
                key: 3,
                name: 'Manage verification',
                pathName: 'manage-verification',
                link: '/properties-management/manage-verification',
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
                link: '/booking-management/bookings',
            },
            {
                key: 2,
                name: 'Booking disputes',
                pathName: 'booking-disputes',
                link: '/booking-management/booking-disputes',
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
                link: '/transactions/payments',
            },
            {
                key: 2,
                name: 'Withdrawals',
                pathName: 'withdrawals',
                link: '/transactions/withdrawals',
            },
            {
                key: 3,
                name: 'Booking withdrawals',
                pathName: 'booking-withdrawals',
                link: '/transactions/booking-withdrawals',
            },
            {
                key: 4,
                name: 'Refunds',
                pathName: 'refunds',
                link: '/transactions/refunds',
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
                link: '/notifications/manage-notifications',
            },
            {
                key: 2,
                name: 'Create notification',
                pathName: 'create-notification',
                link: '/notifications/create-notification',
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