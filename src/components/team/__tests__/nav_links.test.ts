import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ILink, NAV_LINKS, resolveNavTarget } from "../../../lib/routes/nav_links";
import { PAGE_ROUTES } from "../../../lib/routes/page_routes";
import { UserRole } from "../../../lib/enums";

const section = (name: string): ILink => {
    const found = NAV_LINKS.find((l) => l.name === name);
    assert.ok(found, `${name} is in NAV_LINKS`);
    return found;
};

/** Whether `role` would see a child of `link` pointing at `href` in the sidebar. */
const childVisible = (link: ILink, href: string, role: UserRole) =>
    (link.children ?? []).some((c) => c.link === href && c.allow.includes(role));

describe("resolveNavTarget (AN-L7a)", () => {
    it("sends OPERATIONS_ADMIN to Needs a mentor, not the Events page they cannot see", () => {
        const nm = section("Network Management");
        assert.ok(nm.allow.includes(UserRole.OPERATIONS_ADMIN));
        // The static link is the ADMIN landing page and is hidden from
        // OPERATIONS_ADMIN — the bug the resolver exists for. This line fails
        // if someone "fixes" it by widening Events to OPERATIONS_ADMIN instead.
        assert.equal(nm.link, PAGE_ROUTES.dashboard.network.events.base);
        assert.equal(childVisible(nm, nm.link, UserRole.OPERATIONS_ADMIN), false);
        assert.equal(resolveNavTarget(nm, UserRole.OPERATIONS_ADMIN), PAGE_ROUTES.dashboard.network.needsMentor);
    });

    it("keeps Events as the landing page for ADMIN and SUPER_ADMIN", () => {
        const nm = section("Network Management");
        for (const role of [UserRole.ADMIN, UserRole.SUPER_ADMIN]) {
            assert.equal(resolveNavTarget(nm, role), PAGE_ROUTES.dashboard.network.events.base);
        }
    });

    it("never lands an allowed role on a child it cannot see, in any section", () => {
        for (const link of NAV_LINKS) {
            if (!link.children?.length) continue;
            for (const role of link.allow) {
                const target = resolveNavTarget(link, role);
                assert.ok(childVisible(link, target, role), `${link.name} → ${target} is visible to ${role}`);
            }
        }
    });

    it("sends an OWNER opening Reports to Statements, not the staff-only Agent Performance", () => {
        const reports = section("Reports");
        assert.equal(childVisible(reports, reports.link, UserRole.OWNER), false);
        assert.equal(resolveNavTarget(reports, UserRole.OWNER), PAGE_ROUTES.dashboard.reports.statements);
    });

    it("returns a section's own link when it has no children", () => {
        const wallet = section("My Wallet");
        assert.equal(resolveNavTarget(wallet, UserRole.OWNER), wallet.link);
    });

    it("falls back to the dashboard root when no child is visible to the role", () => {
        const nm = section("Network Management");
        const orphaned: ILink = {
            ...nm,
            children: (nm.children ?? []).map((c) => ({ ...c, allow: [UserRole.ADMIN] })),
        };
        assert.equal(resolveNavTarget(orphaned, UserRole.OPERATIONS_ADMIN), PAGE_ROUTES.dashboard.base);
    });
});
