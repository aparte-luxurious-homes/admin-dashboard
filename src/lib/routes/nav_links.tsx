import { JSX } from "react";
import { IoIosGitNetwork } from "react-icons/io";
import { Icon } from "@iconify/react";
import { BellIcon, BookingIcon, FinancialsIcon, PropertiesIcon, TilesIcon, UsersIcon, SettingsIcon, RateIcon, PriceTagIcon } from "../../components/icons";
import { PAGE_ROUTES } from "./page_routes";
import { UserRole } from "../enums";
import { WHATSAPP_ANALYTICS_ROLES, WHATSAPP_INBOX_ROLES } from "../whatsappRoles";

export type NavBadgeKey = 'approvalPending' | 'whatsappHandover';

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

/**
 * Where a section's parent entry takes `role`.
 *
 * A parent's `link` is one static string, but the children it fronts carry
 * their own `allow` lists, and those can be narrower than the parent's.
 * "Network Management" admits OPERATIONS_ADMIN, whose only child there is
 * "Needs a mentor", yet the parent pointed at Events — a page the route guard
 * in layouts/dashboard.tsx bounces them off with an access error. "Reports"
 * had the same shape for OWNER and AGENT (parent → Agent Performance, which
 * only staff may see). So the landing page is computed from the children: the
 * first one the role may see wins. A section without children keeps its own
 * link, and a section whose children are all hidden from the role falls back
 * to the dashboard root — the guard would send them there anyway, this just
 * skips the error toast on the way. Anything that navigates to a section
 * (rather than to one of its children) must go through this.
 */
export function resolveNavTarget(link: ILink, role: UserRole): string {
    if (!link.children?.length) return link.link;
    const first = link.children.find((child) => child.link !== '#' && child.allow.includes(role));
    return first?.link ?? PAGE_ROUTES.dashboard.base;
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
        // The host's public page. Second in the list on purpose: for an
        // owner or agent it is the thing they send to every prospect.
        name: 'My Aparte Link',
        pathName: 'my-link',
        link: PAGE_ROUTES.dashboard.myLink.base,
        icon: <Icon icon="lucide:link" width={20} color="white" />,
        allow: [UserRole.OWNER, UserRole.AGENT],
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
            {
                name: 'Email delivery',
                pathName: 'email-delivery',
                link: PAGE_ROUTES.dashboard.userManagement.emailDelivery.base,
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
            {
                // Team leads' edits and booking actions waiting for approval.
                name: 'Team requests',
                pathName: 'team-requests',
                link: PAGE_ROUTES.dashboard.propertyManagement.teamRequests.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN],
            },
        ]
    },
    {
        // Team lead workspace. Allowed to every AGENT here; the dashboard
        // layout removes it for agents who do not currently lead a team
        // (GET /team/me), and the API refuses them regardless.
        name: 'Team',
        pathName: 'team',
        link: PAGE_ROUTES.dashboard.team.members,
        icon: <Icon icon="mdi:account-group-outline" width={20} color="white" />,
        allow: [UserRole.AGENT],
        secondary: true,
        children: [
            { name: 'Members', pathName: 'members', link: PAGE_ROUTES.dashboard.team.members, allow: [UserRole.AGENT] },
            { name: 'Properties', pathName: 'properties', link: PAGE_ROUTES.dashboard.team.properties, allow: [UserRole.AGENT] },
            { name: 'Bookings', pathName: 'bookings', link: PAGE_ROUTES.dashboard.team.bookings, allow: [UserRole.AGENT] },
            { name: 'Transactions', pathName: 'transactions', link: PAGE_ROUTES.dashboard.team.transactions, allow: [UserRole.AGENT] },
            { name: 'Reviews', pathName: 'reviews', link: PAGE_ROUTES.dashboard.team.reviews, allow: [UserRole.AGENT] },
            { name: 'Referrals', pathName: 'referrals', link: PAGE_ROUTES.dashboard.team.referrals, allow: [UserRole.AGENT] },
            { name: 'My requests', pathName: 'requests', link: PAGE_ROUTES.dashboard.team.requests, allow: [UserRole.AGENT] },
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
                // "Events", not "My Events": the feed carries the caller's own
                // events plus their mentees' and — for an Area Manager /
                // Regional Lead — their whole zone's, so "My" was wrong for
                // everyone but a plain agent.
                name: 'Events',
                pathName: 'history',
                link: PAGE_ROUTES.dashboard.network.history.base,
                allow: [UserRole.AGENT],
            },
            {
                // Own mentees in depth, and agents on the same tier by name
                // and booking counts only.
                name: 'My team & peers',
                pathName: 'my-team',
                link: PAGE_ROUTES.dashboard.network.myTeam,
                allow: [UserRole.AGENT],
            },
            {
                // Every agent's monthly target share, achieved and %; leads
                // also see the people below them.
                name: 'My targets',
                pathName: 'my-targets',
                link: PAGE_ROUTES.dashboard.network.myTargets,
                allow: [UserRole.AGENT],
            },
            {
                name: 'Actions',
                pathName: 'actions',
                link: PAGE_ROUTES.dashboard.network.configs.actions.base,
                allow: [UserRole.AGENT],
            },
            {
                name: 'Mentorship',
                pathName: 'mentorship',
                link: PAGE_ROUTES.dashboard.network.mentorship.base,
                allow: [UserRole.AGENT],
            },
            // Both zone entries are stripped for agents without an ACTIVE zone
            // assignment - see ZONE_LEAD_ONLY_SEGMENTS in layouts/dashboard.tsx.
            // Standing is not knowable from the role alone, so it cannot be
            // expressed in `allow` here.
            {
                name: 'Zone Members',
                pathName: 'zone-members',
                link: PAGE_ROUTES.dashboard.network.zoneMembers.base,
                allow: [UserRole.AGENT],
            },
            {
                name: 'Zone Assignments',
                pathName: 'zone-assignments',
                link: PAGE_ROUTES.dashboard.network.zoneAssignments.base,
                allow: [UserRole.AGENT],
            },
        ]
    },
    {
        name: 'Network Management',
        pathName: 'network',
        // The ADMIN landing page. OPERATIONS_ADMIN cannot see Events, so
        // navigation to this section goes through resolveNavTarget(), which
        // sends them to the first child they may see (Needs a mentor).
        link: PAGE_ROUTES.dashboard.network.events.base,
        icon: <IoIosGitNetwork size={20} color="white" />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN],
        secondary: true,
        children: [
            {
                name: 'Events',
                pathName: 'events',
                link: PAGE_ROUTES.dashboard.network.events.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
            },
            {
                name: 'Actions',
                pathName: 'actions',
                link: PAGE_ROUTES.dashboard.network.configs.actions.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
            },
            {
                name: 'Mentorship',
                pathName: 'mentorship',
                link: PAGE_ROUTES.dashboard.network.mentorship.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
            },
            {
                // Agents whose mentorship a tier change ended; assign by hand.
                name: 'Needs a mentor',
                pathName: 'needs-mentor',
                link: PAGE_ROUTES.dashboard.network.needsMentor,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN],
            },
            {
                name: 'Zones',
                pathName: 'zones',
                link: PAGE_ROUTES.dashboard.network.zones.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
            },
            {
                name: 'Zone Assignments',
                pathName: 'zone-assignments',
                link: PAGE_ROUTES.dashboard.network.zoneAssignments.base,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
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
        // Aparte on WhatsApp: the ops inbox for bot chats and the bot funnel.
        // ANALYST sees the funnel only; resolveNavTarget sends them there.
        name: 'WhatsApp',
        pathName: 'whatsapp',
        link: PAGE_ROUTES.dashboard.whatsapp.inbox,
        icon: <Icon icon="mdi:whatsapp" width={20} color="white" />,
        allow: WHATSAPP_ANALYTICS_ROLES,
        secondary: true,
        children: [
            {
                name: 'Inbox',
                pathName: 'inbox',
                link: PAGE_ROUTES.dashboard.whatsapp.inbox,
                allow: WHATSAPP_INBOX_ROLES,
                badgeKey: 'whatsappHandover',
            },
            {
                name: 'Analytics',
                pathName: 'analytics',
                link: PAGE_ROUTES.dashboard.whatsapp.analytics,
                allow: WHATSAPP_ANALYTICS_ROLES,
            },
        ]
    },
    {
        name: 'Reviews',
        pathName: 'reviews',
        link: PAGE_ROUTES.dashboard.reviews.base,
        icon: <RateIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN,UserRole.AGENT,UserRole.OWNER],
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
        // Admins approve here; operations and support follow their own requests.
        name: 'Wallet Adjustments',
        pathName: 'wallet-adjustments',
        link: PAGE_ROUTES.dashboard.walletAdjustments.base,
        icon: <FinancialsIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN],
        secondary: true,
        children: undefined,
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
        name: 'iCal Sync',
        pathName: 'ical-management',
        link: PAGE_ROUTES.dashboard.icalManagement.feeds,
        icon: <PropertiesIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN],
        secondary: true,
        children: [
            {
                name: 'Platform Feeds',
                pathName: 'feeds',
                link: PAGE_ROUTES.dashboard.icalManagement.feeds,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN],
            },
            {
                name: 'Conflicts',
                pathName: 'conflicts',
                link: PAGE_ROUTES.dashboard.icalManagement.conflicts,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN],
            },
        ]
    },
    {
        name: 'Reports',
        pathName: 'reports',
        link: PAGE_ROUTES.dashboard.reports.agentPerformance,
        icon: <FinancialsIcon className={"w-5"} color={"white"} />,
        allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.ANALYST, UserRole.OWNER, UserRole.AGENT],
        secondary: true,
        children: [
            {
                name: 'Agent Performance',
                pathName: 'agent-performance',
                link: PAGE_ROUTES.dashboard.reports.agentPerformance,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.ANALYST],
            },
            {
                name: 'Network report',
                pathName: 'network',
                link: PAGE_ROUTES.dashboard.reports.network,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.ANALYST],
            },
            {
                // Set each team's monthly target and track target vs achieved.
                // ANALYST reads; the API refuses them the edit.
                name: 'Team targets',
                pathName: 'targets',
                link: PAGE_ROUTES.dashboard.reports.targets,
                allow: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.ANALYST],
            },
            {
                name: 'Statements',
                pathName: 'statements',
                link: PAGE_ROUTES.dashboard.reports.statements,
                allow: [UserRole.OWNER, UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN],
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
