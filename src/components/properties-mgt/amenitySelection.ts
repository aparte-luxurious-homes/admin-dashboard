/**
 * Which amenities an edit screen offers, and which it sends back.
 *
 * The taxonomy is scoped: an amenity applies to STAY listings, to VENUE
 * listings (event centres) or to ALL. A picker offers a listing only the
 * amenities of its own kind, because the API refuses one from the other list
 * on a fresh attach. But a property that became a venue after it was listed,
 * or was listed before the scopes existed, may already hold STAY amenities
 * (Parking, Security, Power...) and the API keeps those. The edit view used
 * to fetch only the scoped list and resolve names to ids against it, so every
 * attached out-of-scope amenity was missing from the payload and silently
 * detached on the first save, whatever the owner had actually come to change.
 *
 * The rule here: never drop an amenity the listing already has. Offer the
 * scoped ones; keep every attached one selected and resolvable; show the
 * attached-but-out-of-scope ones in the picker with a tag, so the owner can
 * take them off deliberately and never by accident.
 *
 * Pure functions, no React. `__tests__/amenitySelection.test.ts` covers them;
 * `npm run test:unit` runs it.
 */

/**
 * The shape every helper needs, structurally: IAmenity satisfies it, and so
 * does the {id, name} row the property payload embeds. Declared here rather
 * than imported from ./types so the test can compile this module alone.
 */
export type AmenityRecord = {
  id: string | number;
  name: string;
  applies_to?: string | null;
};

/** The two kinds of listing a picker can be for. */
export type AmenityPickerScope = "STAY" | "VENUE";

export type AmenityOption = {
  name: string;
  /** Attached to the listing but belongs to the other kind: shown with a tag. */
  outOfScope: boolean;
};

/** "(stay amenity)" on a venue's picker, "(venue amenity)" on a stay's. */
export const outOfScopeTag = (scope: AmenityPickerScope): string =>
  scope === "VENUE" ? "(stay amenity)" : "(venue amenity)";

/** The tooltip on a tagged chip: what it is and how to be rid of it. */
export const outOfScopeHint = (scope: AmenityPickerScope): string =>
  `Already on this listing, though it is offered to ${
    scope === "VENUE" ? "stays" : "event centres"
  }. Untick it to remove it when you save.`;

/**
 * Whether a listing of this kind may offer the amenity. ALL belongs to both.
 *
 * An amenity with no recorded scope reads as in scope. The property detail
 * payload lists attached amenities as {id, name} only, and hiding one because
 * we cannot see its scope would lose exactly what this module exists to keep
 * on screen. (The API reads a missing scope as STAY; it never sends one.)
 */
export const amenityInScope = (amenity: AmenityRecord, scope: AmenityPickerScope): boolean => {
  const applies = String(amenity?.applies_to ?? "ALL").toUpperCase();
  if (applies !== "STAY" && applies !== "VENUE") return true;
  return applies === scope;
};

/**
 * One list from several, deduplicated by id, first occurrence wins.
 *
 * Pass the taxonomy first: it carries `applies_to`, while a listing's own
 * amenities come back as {id, name} and would otherwise shadow the scope.
 * They are still worth merging in. They are the only record of an amenity
 * the taxonomy no longer lists, or of any amenity while the taxonomy is
 * still loading, and a name that cannot be resolved cannot be sent.
 */
export const mergeAmenities = <T extends AmenityRecord>(
  ...lists: Array<ReadonlyArray<T> | null | undefined>
): T[] => {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const list of lists) {
    for (const amenity of list ?? []) {
      if (!amenity || amenity.id == null || !amenity.name) continue;
      const id = String(amenity.id);
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(amenity);
    }
  }
  return merged;
};

/**
 * What the picker shows: every known amenity of the listing's kind, in the
 * taxonomy's order, then every ATTACHED amenity of the other kind, tagged.
 *
 * `attachedNames` is what the listing had when the screen opened, not the
 * current selection, so an out-of-scope amenity the owner unticks stays on
 * screen unselected and can be ticked again before saving. A name that is
 * neither in scope nor attached is not offered: that is the fresh attach the
 * API would refuse.
 */
export const amenityPickerOptions = (
  known: ReadonlyArray<AmenityRecord>,
  scope: AmenityPickerScope,
  attachedNames: ReadonlyArray<string>,
): AmenityOption[] => {
  const options: AmenityOption[] = [];
  const offered = new Set<string>();
  const knownNames = new Set<string>();
  for (const amenity of known) {
    if (!amenity?.name) continue;
    knownNames.add(amenity.name);
    if (offered.has(amenity.name) || !amenityInScope(amenity, scope)) continue;
    offered.add(amenity.name);
    options.push({ name: amenity.name, outOfScope: false });
  }
  for (const name of attachedNames ?? []) {
    // Unknown to every list we hold: it has no id to send, so offering it
    // would promise a save that cannot keep it.
    if (!name || offered.has(name) || !knownNames.has(name)) continue;
    offered.add(name);
    options.push({ name, outOfScope: true });
  }
  return options;
};

/**
 * Names to ids against everything known, so an attached amenity resolves
 * whatever its scope. Resolving against the SCOPED list is the bug this
 * module replaces. Order follows `names`; a name nothing knows (the picker
 * only offers known ones) and a repeated id are dropped.
 */
export const amenityIdsForNames = (
  known: ReadonlyArray<AmenityRecord>,
  names: ReadonlyArray<string> | null | undefined,
): string[] => {
  const idByName = new Map<string, string>();
  for (const amenity of known) {
    if (amenity?.name && amenity.id != null && !idByName.has(amenity.name)) {
      idByName.set(amenity.name, String(amenity.id));
    }
  }
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const name of names ?? []) {
    const id = idByName.get(name);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
};
