/**
 * Client-side "did you mean" for email addresses.
 *
 * Owners and guests mistype long addresses all the time (real bounces:
 * `gnail.com`, `gmial.com`, misspelt company domains), and nothing told the
 * staff member typing it in on their behalf. This helper catches the common
 * provider typos instantly, before the debounced server check
 * (`GET /utils/email-check`) has answered. It only ever SUGGESTS — callers
 * must never block a submit on it.
 *
 * Pure and dependency-free so it runs under the node:test unit runner
 * (`npm run test:unit`), see `src/lib/__tests__/email-check.test.ts`.
 */

/** Providers we correct towards. Order breaks distance ties. */
export const COMMON_EMAIL_DOMAINS: readonly string[] = [
    "gmail.com",
    "yahoo.com",
    "yahoo.co.uk",
    "ymail.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "icloud.com",
    "me.com",
    "aol.com",
    "protonmail.com",
];

/**
 * Real domains that sit one or two edits away from a provider above. Without
 * this list `mail.com` would be "corrected" to `gmail.com` and `mac.com` to
 * `me.com`, which is exactly the kind of confident wrong answer that teaches
 * staff to ignore the hint.
 */
export const KNOWN_VALID_DOMAINS: readonly string[] = [
    "mail.com",
    "email.com",
    "gmx.com",
    "gmx.net",
    "googlemail.com",
    "mac.com",
    "msn.com",
    "aim.com",
    "zoho.com",
    "yandex.com",
    "proton.me",
    "pm.me",
    "hotmail.co.uk",
    "live.co.uk",
    "outlook.co.uk",
    "yahoo.fr",
    "yahoo.ca",
    "yahoo.in",
    "yahoo.co.in",
    "yahoo.co.za",
    "rocketmail.com",
    "aparte.ng",
];

/**
 * Top-level domains that do not exist but are a slip away from one that does.
 * Applied to any domain, not just the providers above — `company.con` is as
 * undeliverable as `gmail.con`. Deliberately excludes real ccTLDs that look
 * like typos (`.co` Colombia, `.cm` Cameroon, `.om` Oman): those can only be
 * corrected when the rest of the domain names a provider.
 */
const TLD_FIXES: Record<string, string> = {
    con: "com",
    cmo: "com",
    ocm: "com",
    comm: "com",
    coom: "com",
    vom: "com",
    xom: "com",
    cpm: "com",
    clm: "com",
    ckm: "com",
    comn: "com",
    "c0m": "com",
    nett: "net",
    ner: "net",
    ogr: "org",
    orgg: "org",
};

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Loose shape check — good enough to decide whether to ask the server. */
export function isLikelyEmail(raw: string): boolean {
    return EMAIL_SHAPE.test((raw || "").trim());
}

/**
 * Optimal-string-alignment Damerau-Levenshtein distance: insert, delete,
 * substitute, and swap two adjacent characters each cost 1. The swap is what
 * makes `gmial` and `hotmial` one edit away rather than two.
 */
export function editDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
        }
    }
    return d[m][n];
}

/**
 * Normalise what people actually type into a domain: stray spaces, a comma
 * for the dot (`gmail,com`), doubled dots, a trailing dot.
 */
function normaliseDomain(domain: string): string {
    return domain
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/,/g, ".")
        .replace(/\.{2,}/g, ".")
        .replace(/^\.+|\.+$/g, "");
}

/**
 * What a provider's TLD gets mistyped as. Only consulted when the label in
 * front of it is the provider's own (`gmail.co`), so a real ccTLD such as
 * `hotmail.ca` or `yahoo.co.in` is never "corrected" to `.com`.
 */
const PROVIDER_TLD_TYPOS = new Set<string>([
    "co", "cm", "om", "cim", "cok", "col", "coml", "comk",
    ...Object.keys(TLD_FIXES).filter((k) => TLD_FIXES[k] === "com"),
]);

function splitDomain(domain: string): { sld: string; rest: string } {
    const dot = domain.indexOf(".");
    return dot === -1
        ? { sld: domain, rest: "" }
        : { sld: domain.slice(0, dot), rest: domain.slice(dot + 1) };
}

/**
 * The provider this domain is most likely a typo of, or null.
 *
 * Tolerance depends on the label before the first dot. Three letters or fewer
 * (`aon`, `bol`, `ae`) are one edit from far too many real company domains,
 * so those only match when the label IS the provider's and the TLD is a slip
 * (`aol.co`). Four letters (`gmai`, `yaho`) allow one edit; five or more
 * (`gmial`, `hotmial`) allow two.
 */
function closestProvider(domain: string): string | null {
    const { sld, rest } = splitDomain(domain);
    const limit = sld.length <= 4 ? 1 : 2;
    let best: string | null = null;
    let bestDistance = Infinity;
    for (const candidate of COMMON_EMAIL_DOMAINS) {
        const target = splitDomain(candidate);
        if (sld === target.sld) {
            if (!PROVIDER_TLD_TYPOS.has(rest)) continue;
        } else if (sld.length <= 3) {
            continue;
        }
        const distance = editDistance(domain, candidate);
        if (distance < bestDistance) {
            best = candidate;
            bestDistance = distance;
        }
    }
    return best !== null && bestDistance > 0 && bestDistance <= limit ? best : null;
}

/**
 * Suggest a corrected address, or `null` when the address looks fine (or is
 * too malformed to guess at). The local part is kept exactly as typed — only
 * the domain is ever changed.
 *
 *   suggestEmail("ezekiel@gnail.com")   -> "ezekiel@gmail.com"
 *   suggestEmail("ezekiel@gmail.con")   -> "ezekiel@gmail.com"
 *   suggestEmail("ezekiel@acme.con")    -> "ezekiel@acme.com"
 *   suggestEmail("ezekiel@mail.com")    -> null   (a real provider)
 */
export function suggestEmail(raw: string): string | null {
    const value = (raw || "").trim();
    const at = value.lastIndexOf("@");
    if (at <= 0 || at === value.length - 1) return null;
    const local = value.slice(0, at);
    if (local.includes("@") || /\s/.test(local)) return null;

    const typedDomain = value.slice(at + 1);
    const domain = normaliseDomain(typedDomain);
    if (!domain) return null;

    const suggest = (fixed: string) => {
        const next = `${local}@${fixed}`;
        return next === value ? null : next;
    };

    if (COMMON_EMAIL_DOMAINS.includes(domain) || KNOWN_VALID_DOMAINS.includes(domain)) {
        // Still worth offering if normalising changed it (`gmail,com`).
        return domain !== typedDomain ? suggest(domain) : null;
    }

    // 1. The whole domain against the providers: gnail.com, gmial.con, yaho.com.
    const whole = closestProvider(domain);
    if (whole) return suggest(whole);

    // 2. The last two labels, for a typo hiding behind an extra label:
    //    `mail.gmial.com`, `gmail.com.con`.
    const labels = domain.split(".");
    if (labels.length > 2) {
        const tail = labels.slice(-2).join(".");
        const tailFix = COMMON_EMAIL_DOMAINS.includes(tail) ? tail : closestProvider(tail);
        if (tailFix) return suggest(tailFix);
        // `gmail.com.com`, `gmail.com.con`: a provider with a junk label after.
        // A real-looking suffix (`yahoo.com.ng`) is left to the server check.
        const head = labels.slice(0, 2).join(".");
        const extra = labels.slice(2);
        if (
            COMMON_EMAIL_DOMAINS.includes(head) &&
            extra.every((l) => l === "com" || l in TLD_FIXES || PROVIDER_TLD_TYPOS.has(l))
        ) {
            return suggest(head);
        }
    }

    // 3. A TLD that does not exist, on any domain: acme.con -> acme.com.
    if (labels.length >= 2) {
        const tld = labels[labels.length - 1];
        const fixedTld = TLD_FIXES[tld];
        if (fixedTld) return suggest([...labels.slice(0, -1), fixedTld].join("."));
    }

    return null;
}
