/**
 * Regression tests for AV-H2: the property edit view fetched the VENUE slice
 * of the amenity taxonomy for a venue and resolved the listing's selected
 * amenity names to ids against it, so every STAY amenity the venue already
 * held (Parking, Security, Power...) was missing from the payload and
 * silently detached on the first save.
 *
 * Runs on Node's built-in runner, no framework: `npm run test:unit`.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  AmenityRecord,
  amenityIdsForNames,
  amenityInScope,
  amenityPickerOptions,
  mergeAmenities,
  outOfScopeTag,
} from "../amenitySelection";

/** The taxonomy as GET /amenities returns it, unscoped. */
const taxonomy: AmenityRecord[] = [
  { id: "a1", name: "Parking", applies_to: "STAY" },
  { id: "a2", name: "Security", applies_to: "STAY" },
  { id: "a3", name: "Stage", applies_to: "VENUE" },
  { id: "a4", name: "Sound System", applies_to: "VENUE" },
  { id: "a5", name: "Wi-Fi", applies_to: "ALL" },
];

/** What the old screen fetched for a venue: GET /amenities?applies_to=VENUE. */
const venueSlice = taxonomy.filter((a) => a.applies_to !== "STAY");

/** A venue's attached amenities, as the property payload embeds them: {id, name}. */
const attachedToVenue: AmenityRecord[] = [
  { id: "a1", name: "Parking" },
  { id: "a2", name: "Security" },
  { id: "a3", name: "Stage" },
];
const attachedNames = attachedToVenue.map((a) => a.name);

/**
 * The resolver this module replaced, verbatim in effect: names to ids against
 * whatever list the screen was handed. Kept here so the test states the bug it
 * guards against, not just the behaviour it wants.
 */
const oldSortAmenities = (amenities: AmenityRecord[], names: string[]): string[] => {
  const ids: string[] = [];
  const known = amenities.map((a) => a.name);
  for (const name of names) {
    if (known.includes(name)) ids.push(String(amenities[known.indexOf(name)].id));
  }
  return ids;
};

describe("AV-H2: a venue keeps the stay amenities it already has", () => {
  it("the old resolver dropped every attached stay amenity from a venue's save", () => {
    // Characterises the defect: an untouched save of a venue holding Parking,
    // Security and Stage sent only Stage, and the API detached the other two.
    assert.deepEqual(oldSortAmenities(venueSlice, attachedNames), ["a3"]);
  });

  it("resolves every attached amenity to its id, whatever its scope", () => {
    const known = mergeAmenities(taxonomy, attachedToVenue);
    assert.deepEqual(amenityIdsForNames(known, attachedNames), ["a1", "a2", "a3"]);
  });

  it("still resolves them when all the screen holds is the scoped slice", () => {
    // Merging the listing's own rows in is what makes the attached ids
    // reachable even if a caller passes the narrow list.
    const known = mergeAmenities(venueSlice, attachedToVenue);
    assert.deepEqual(amenityIdsForNames(known, attachedNames), ["a1", "a2", "a3"]);
  });

  it("still resolves them while the taxonomy has not loaded", () => {
    const known = mergeAmenities(undefined, attachedToVenue);
    assert.deepEqual(amenityIdsForNames(known, attachedNames), ["a1", "a2", "a3"]);
  });

  it("offers the venue's own amenities untagged, then the attached stay ones tagged", () => {
    const known = mergeAmenities(taxonomy, attachedToVenue);
    assert.deepEqual(amenityPickerOptions(known, "VENUE", attachedNames), [
      { name: "Stage", outOfScope: false },
      { name: "Sound System", outOfScope: false },
      { name: "Wi-Fi", outOfScope: false },
      { name: "Parking", outOfScope: true },
      { name: "Security", outOfScope: true },
    ]);
    assert.equal(outOfScopeTag("VENUE"), "(stay amenity)");
  });

  it("never offers a stay amenity the venue does not already hold", () => {
    // That would be a fresh attach, which the API refuses with a 422.
    const known = mergeAmenities(taxonomy, attachedToVenue);
    const offered = amenityPickerOptions(known, "VENUE", ["Parking"]).map((o) => o.name);
    assert.ok(offered.includes("Parking"));
    assert.ok(!offered.includes("Security"));
  });

  it("keeps an unticked stay amenity on screen until save, and out of the payload", () => {
    const known = mergeAmenities(taxonomy, attachedToVenue);
    // The owner unticks Parking. The chip is offered on the strength of what
    // was ATTACHED, not what is selected, so it can be ticked back...
    const selection = attachedNames.filter((n) => n !== "Parking");
    const offered = amenityPickerOptions(known, "VENUE", attachedNames).map((o) => o.name);
    assert.ok(offered.includes("Parking"));
    // ...while the payload reflects the deliberate removal.
    assert.deepEqual(amenityIdsForNames(known, selection), ["a2", "a3"]);
  });

  it("prefers the taxonomy's record, so an attached amenity keeps its scope", () => {
    const known = mergeAmenities(taxonomy, attachedToVenue);
    assert.equal(known.find((a) => a.id === "a1")?.applies_to, "STAY");
    assert.equal(known.length, taxonomy.length);
  });

  it("a stay listing tags a venue amenity it holds the same way", () => {
    const attachedToStay: AmenityRecord[] = [{ id: "a3", name: "Stage" }];
    const options = amenityPickerOptions(mergeAmenities(taxonomy, attachedToStay), "STAY", ["Stage"]);
    assert.deepEqual(options, [
      { name: "Parking", outOfScope: false },
      { name: "Security", outOfScope: false },
      { name: "Wi-Fi", outOfScope: false },
      { name: "Stage", outOfScope: true },
    ]);
    assert.equal(outOfScopeTag("STAY"), "(venue amenity)");
  });

  it("treats ALL and an unknown scope as belonging to both kinds", () => {
    assert.ok(amenityInScope({ id: "x", name: "Wi-Fi", applies_to: "ALL" }, "VENUE"));
    assert.ok(amenityInScope({ id: "x", name: "Wi-Fi", applies_to: "ALL" }, "STAY"));
    // The property payload carries no scope; hiding the row would lose it.
    assert.ok(amenityInScope({ id: "x", name: "Mystery" }, "VENUE"));
    assert.ok(!amenityInScope({ id: "x", name: "Parking", applies_to: "stay" }, "VENUE"));
  });

  it("drops a name nothing knows and a repeated id, keeping selection order", () => {
    const known = mergeAmenities(taxonomy, attachedToVenue);
    assert.deepEqual(
      amenityIdsForNames(known, ["Stage", "Ghost", "Parking", "Stage"]),
      ["a3", "a1"],
    );
    assert.deepEqual(amenityIdsForNames(known, undefined), []);
  });
});
