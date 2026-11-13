/**
 * Client-side mirror of services/properties/validators.py::validate_property_name.
 * The backend stays authoritative — this provides fast, inline feedback in the
 * wizard so users don't submit a form only to get a 422 back.
 */

const MIN_NAME_LENGTH = 5;
const MAX_NAME_LENGTH = 255;

const BANNED_SUBSTRINGS = [
    'test test',
    'asdf',
    'qwerty',
    'lorem ipsum',
    'n/a',
    'xxx',
    'fuck',
    'shit',
];

const URL_PATTERN = /https?:\/\/|www\./i;
const PHONE_PATTERN = /(?:\+?\d[\s\-]?){7,}/;
const REPEAT_PATTERN = /(.)\1{3,}/;

export function normalizePropertyName(name: string): string {
    return (name ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * Returns a user-facing error message, or null if the name is acceptable.
 * Keep messages in sync with the Python validator so error UX is consistent.
 */
export function validatePropertyName(rawName: string): string | null {
    if (typeof rawName !== 'string') {
        return 'Property name must be a string';
    }

    const display = normalizePropertyName(rawName);

    if (display.length < MIN_NAME_LENGTH) {
        return `Property name must be at least ${MIN_NAME_LENGTH} characters`;
    }
    if (display.length > MAX_NAME_LENGTH) {
        return `Property name must be at most ${MAX_NAME_LENGTH} characters`;
    }
    if (REPEAT_PATTERN.test(display)) {
        return 'Property name contains excessive repeating characters';
    }
    if (URL_PATTERN.test(display)) {
        return 'Property name must not contain URLs';
    }
    if (PHONE_PATTERN.test(display)) {
        return 'Property name must not contain phone numbers';
    }

    const alnumCount = [...display].filter((c) => /[\p{L}\p{N}]/u.test(c)).length;
    if (alnumCount / display.length < 0.4) {
        return 'Property name must be mostly letters and numbers';
    }

    const letters = [...display].filter((c) => /\p{L}/u.test(c));
    if (letters.length >= 10) {
        const upperCount = letters.filter((c) => c === c.toUpperCase() && c !== c.toLowerCase()).length;
        if (upperCount / letters.length > 0.8) {
            return 'Property name must not be written in all capital letters';
        }
    }

    const lowered = display.toLowerCase();
    for (const banned of BANNED_SUBSTRINGS) {
        if (lowered.includes(banned)) {
            return 'Property name contains disallowed content';
        }
    }

    return null;
}
