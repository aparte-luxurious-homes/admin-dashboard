"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Search / filter / sort / page state for an admin table, kept in the URL.
 *
 * Every table used to hold this in `useState`, which produced four separate
 * complaints that are really one bug each:
 *
 *  - **Filters don't stick.** Open a booking, press Back, and every filter is
 *    gone — component state does not survive unmount. In the URL it does, and
 *    the view becomes linkable and bookmarkable for free.
 *  - **Paginates wrongly.** Filters reset `page` by hand at each `onChange`;
 *    the SEARCH box did not, so typing while on page 3 asked for page 3 of a
 *    much smaller result set and showed an empty table. Here every change
 *    except `setPage` resets the page centrally, so it cannot be forgotten at
 *    a new call site.
 *  - **Too slow.** The raw input value went straight into the React Query key,
 *    firing a request per keystroke. `search` (immediate) is now split from
 *    `debouncedSearch` (what you put in the query key), so the box stays
 *    responsive while the network sees one request per pause.
 *  - **No sorting.** `sort` is part of the same state, so it persists and
 *    resets the page like everything else.
 *
 * URL writes use `router.replace` with `scroll: false`: typing in a search box
 * should not push twenty entries onto the history stack, and should not jump
 * the page to the top on every keystroke.
 */

export interface TableStateOptions {
    /** Filter keys this table uses, e.g. ["status", "property"]. */
    filterKeys?: string[];
    /** Default sort key when the URL says nothing. */
    defaultSort?: string;
    /** Milliseconds to wait after the last keystroke before querying. */
    debounceMs?: number;
    /**
     * Prefix for URL params, for pages hosting more than one table. Without
     * it two tables on one route would fight over `?page`.
     */
    prefix?: string;
}

export function useTableState(options: TableStateOptions = {}) {
    const {
        filterKeys = [],
        defaultSort = "",
        debounceMs = 350,
        prefix = "",
    } = options;

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const key = useCallback((name: string) => (prefix ? `${prefix}_${name}` : name), [prefix]);

    // --- read current state out of the URL ---------------------------------
    const page = Math.max(1, Number(searchParams.get(key("page")) ?? 1) || 1);
    const search = searchParams.get(key("q")) ?? "";
    const sort = searchParams.get(key("sort")) ?? defaultSort;

    const filters = useMemo(() => {
        const out: Record<string, string> = {};
        for (const name of filterKeys) out[name] = searchParams.get(key(name)) ?? "";
        return out;
        // searchParams is a new object each render but its string form is stable.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.toString(), filterKeys.join(","), key]);

    // --- debounced mirror of `search`, which is what the query key uses -----
    // Seeded from the URL so a fresh page load with ?q=... queries immediately
    // rather than waiting out a debounce for a value that is already final.
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        if (debouncedSearch === search) return;
        const timer = setTimeout(() => setDebouncedSearch(search), debounceMs);
        return () => clearTimeout(timer);
    }, [search, debouncedSearch, debounceMs]);

    // --- writes ------------------------------------------------------------
    const apply = useCallback(
        (changes: Record<string, string | number | undefined>, resetPage = true) => {
            const next = new URLSearchParams(searchParams.toString());
            for (const [name, value] of Object.entries(changes)) {
                const param = key(name);
                // Empty string means "no filter" — drop the param entirely so
                // the URL stays readable instead of accumulating `&status=`.
                if (value === undefined || value === "") next.delete(param);
                else next.set(param, String(value));
            }
            if (resetPage) next.delete(key("page"));
            const qs = next.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [key, pathname, router, searchParams]
    );

    const setSearch = useCallback((value: string) => apply({ q: value }), [apply]);
    const setSort = useCallback((value: string) => apply({ sort: value }), [apply]);
    const setFilter = useCallback(
        (name: string, value: string) => apply({ [name]: value }),
        [apply]
    );
    /** Page is the one change that must NOT reset the page. */
    const setPage = useCallback(
        (value: number) => apply({ page: value <= 1 ? "" : value }, false),
        [apply]
    );

    const clearFilters = useCallback(() => {
        const cleared: Record<string, string> = { q: "" };
        for (const name of filterKeys) cleared[name] = "";
        apply(cleared);
    }, [apply, filterKeys]);

    const activeFilterCount = useMemo(
        () => Object.values(filters).filter(Boolean).length + (search ? 1 : 0),
        [filters, search]
    );

    return {
        page,
        /** Bind this to the input — updates on every keystroke. */
        search,
        /** Put THIS in the React Query key — settles after `debounceMs`. */
        debouncedSearch,
        sort,
        filters,
        setPage,
        setSearch,
        setSort,
        setFilter,
        clearFilters,
        activeFilterCount,
        hasActiveFilters: activeFilterCount > 0,
    };
}
