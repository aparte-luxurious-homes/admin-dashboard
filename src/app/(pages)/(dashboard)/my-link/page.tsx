"use client";

import { Icon } from "@iconify/react";

import ListingsTable from "@/src/components/links/my-link/ListingsTable";
import PageStatusCard from "@/src/components/links/my-link/PageStatusCard";
import PerformanceCard from "@/src/components/links/my-link/PerformanceCard";
import ProfileForm from "@/src/components/links/my-link/ProfileForm";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { GetMyCatalog, GetMyLinkProperties, unwrapKit } from "@/src/lib/request-handlers/linksMgt";
import type { CatalogShareKit } from "@/src/lib/types";

/**
 * The host's own public page (aparte.ng/@handle): status and share kit,
 * what it says, how it is doing, and which listings are on it.
 *
 * Owners and agents only. The nav entry hides it from everyone else and the
 * dashboard layout bounces a typed URL; this guard is belt and braces for a
 * role the layout does not know about yet.
 */
export default function MyLinkPage() {
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;
    const eligible = role === UserRole.OWNER || role === UserRole.AGENT;

    const catalogQuery = GetMyCatalog(eligible);
    const propertiesQuery = GetMyLinkProperties(eligible);
    const kit = unwrapKit<CatalogShareKit>(catalogQuery.data);

    const displayName =
        [user?.profile?.firstName ?? user?.profile?.first_name, user?.profile?.lastName ?? user?.profile?.last_name]
            .filter(Boolean)
            .join(" ") || "Aparte Host";
    const profileImage: string | null = user?.profile?.profileImage ?? user?.profile?.profile_image ?? null;
    const isVerified = String(user?.profile?.kycStatus ?? user?.profile?.kyc_status ?? "").toUpperCase() === "VERIFIED";

    if (!eligible) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center max-w-md mx-auto">
                    <Icon icon="lucide:link" width="28" height="28" className="mx-auto text-gray-400" />
                    <h1 className="mt-3 text-lg font-semibold text-gray-900">This page is for owners and agents</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        An Aparte Link page lists every property a host manages. Staff accounts don&apos;t have one.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">My Aparte Link</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Your public page: every listing you manage, one link. Send it on WhatsApp, put it in your bio, print the QR.
                </p>
            </div>

            {catalogQuery.isLoading || !kit ? (
                <div className="space-y-6">
                    <Skeleton className="h-40" />
                    <Skeleton className="h-96" />
                </div>
            ) : (
                <>
                    <PageStatusCard kit={kit} userId={user?.id ? String(user.id) : undefined} />

                    {kit.handle && (
                        <ProfileForm
                            kit={kit}
                            properties={propertiesQuery.data ?? []}
                            displayName={displayName}
                            profileImage={profileImage}
                            isVerified={isVerified}
                        />
                    )}

                    <ListingsTable rows={propertiesQuery.data ?? []} isLoading={propertiesQuery.isLoading} />

                    {kit.handle && <PerformanceCard enabled={Boolean(kit.handle)} />}
                </>
            )}
        </div>
    );
}
