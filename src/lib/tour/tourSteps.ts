import { UserRole } from "../enums";

export interface TourStep {
  id: string;
  title: string;
  text: string;
  attachTo?: {
    element: string;
    on: string;
  };
  showOn?: (role: UserRole) => boolean;
}

const commonSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Aparte!",
    text: "Let us give you a quick tour of your dashboard so you can get started right away.",
  },
  {
    id: "wallet-card",
    title: "Wallet Balance",
    text: "Your wallet balance and earnings are displayed here at a glance. You'll see your current available balance in Naira.",
    attachTo: { element: '[data-tour="wallet-card"]', on: "bottom" },
  },
  {
    id: "stats-revenue",
    title: "Total Revenue",
    text: "Track your total revenue here. The percentage shows how it changed compared to last month.",
    attachTo: { element: '[data-tour="stats-revenue"]', on: "bottom" },
  },
  {
    id: "stats-properties",
    title: "Properties Listed",
    text: "See how many properties are listed under your account at a glance.",
    attachTo: { element: '[data-tour="stats-properties"]', on: "bottom" },
  },
  {
    id: "properties-table",
    title: "Your Properties",
    text: "Browse and search all your properties from this table. Click the eye icon to view details.",
    attachTo: { element: '[data-tour="properties-table"]', on: "top" },
  },
  {
    id: "nav-properties",
    title: "Properties Management",
    text: "Manage all your properties in detail from here — view units, upload media, and track verifications.",
    attachTo: { element: '[data-tour="nav-properties"]', on: "right" },
  },
];

const ownerOnlySteps: TourStep[] = [
  {
    id: "owner-create-property",
    title: "List a New Property",
    text: "As a property owner, you can list new properties from this section. Our step-by-step wizard will guide you through the process.",
    attachTo: { element: '[data-tour="nav-properties"]', on: "right" },
    showOn: (role) => role === UserRole.OWNER,
  },
];

const agentOnlySteps: TourStep[] = [
  {
    id: "agent-referrals",
    title: "Referrals",
    text: "Track your referral performance and commissions here. Share your referral link to earn more.",
    attachTo: { element: '[data-tour="nav-referrals"]', on: "right" },
    showOn: (role) => role === UserRole.AGENT,
  },
];

const remainingNavSteps: TourStep[] = [
  {
    id: "nav-bookings",
    title: "Booking Management",
    text: "View and manage all bookings for your properties — check-ins, check-outs, disputes, and extensions.",
    attachTo: { element: '[data-tour="nav-bookings"]', on: "right" },
  },
  {
    id: "nav-transactions",
    title: "Transactions",
    text: "Track all your payments, withdrawals, and refund history.",
    attachTo: { element: '[data-tour="nav-transactions"]', on: "right" },
  },
  {
    id: "nav-wallet",
    title: "My Wallet",
    text: "Access your wallet to add bank accounts and withdraw earnings to your bank.",
    attachTo: { element: '[data-tour="nav-wallet"]', on: "right" },
  },
  {
    id: "nav-settings",
    title: "Settings",
    text: "Update your profile, security settings, and payment preferences. You can also restart this tour from here anytime.",
    attachTo: { element: '[data-tour="nav-settings"]', on: "right" },
  },
  {
    id: "profile-area",
    title: "Your Profile",
    text: "Quick access to your account settings. You're all set — enjoy using Aparte!",
    attachTo: { element: '[data-tour="profile-area"]', on: "bottom-end" },
  },
];

export function getTourSteps(role: UserRole): TourStep[] {
  const steps = [...commonSteps];

  if (role === UserRole.OWNER) {
    steps.push(...ownerOnlySteps);
  }

  steps.push(...remainingNavSteps);

  if (role === UserRole.AGENT) {
    // Insert referrals step before nav-settings
    const settingsIndex = steps.findIndex((s) => s.id === "nav-settings");
    steps.splice(settingsIndex, 0, ...agentOnlySteps);
  }

  return steps;
}
