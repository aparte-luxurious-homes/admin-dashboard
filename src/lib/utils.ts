import numeral from 'numeral';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { RefObject } from 'react';
import domtoimage from "dom-to-image";
import { jsPDF } from "jspdf";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatMoney = (amount: string | number, currency: string = "NGN"): string => {
  const symbol = currency === "USD" ? "$" : currency === "GHS" ? "GH₵" : "₦";
  return `${symbol}${numeral(amount).format("0,0.00")}`;
};

export function areArraysEqual(arr1: any[], arr2: any[]): boolean {
  if (arr1.length !== arr2.length) return false; // Different lengths → not equal
  return arr1.sort().toString() === arr2.sort().toString();
}

/**
 * Masks a sensitive identifier (e.g. NIN/BVN) for display, revealing only the
 * first 2 and last 2 characters. Mirrors the masking already used in the KYC
 * review panel so PII is never rendered in clear text in the admin UI.
 */
export function maskId(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 4) return value;
  return (
    value.slice(0, 2) +
    "•".repeat(Math.max(0, value.length - 4)) +
    value.slice(-2)
  );
}

export function formatDate(dateString: string): string {
  if (!dateString) return "--/--";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "--/--";

  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const suffix = ['th', 'st', 'nd', 'rd'][(day % 10 > 3 || [11, 12, 13].includes(day)) ? 0 : day % 10];

  return `${month} ${day}${suffix}, ${date.getFullYear()}`;
}


export function formatDateToYYYYMMDD(dateString: string): string {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    throw new Error("Invalid date format");
  }

  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
}

export function getDayDifference(date1: Date | string | null | undefined, date2: Date | string | null | undefined): number {
  // Handle null/undefined inputs
  if (!date1 || !date2) return 0;
  
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    console.log('Day difference:', diffDays);
    return diffDays;
  } catch (error) {
    console.error('Error calculating day difference:', error);
    return 0;
  }
}

export async function downloadScreenAsPDF({ name, element }: { name: string; element: RefObject<HTMLDivElement | null> }) {
  if (!element.current) return;

  try {
    const padding = 10; // Extra padding to prevent cut-offs

    const options = {
      quality: 1,
      bgcolor: "#fff",
      width: element.current.offsetWidth + (padding * 2),
      height: element.current.offsetHeight + (padding * 4),
      style: {
        transformOrigin: "top left",
        padding: `${padding}px`,
        backgroundColor: "#fff",
      },
    };

    const dataUrl = await domtoimage.toPng(element.current, options); // Convert element to image
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(name);
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
}

/**
 * Compare two user ids that reach the client under different types.
 *
 * `IUser.id` is declared `number` but the API issues UUID strings, so a bare
 * `===` between an id off a payload and `user.id` is both a type error and
 * wrong at runtime. Nullish on either side is never a match — two absent ids
 * are not the same user.
 */
export function isSameId(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
): boolean {
  if (a === null || a === undefined || b === null || b === undefined) return false;
  return String(a) === String(b);
}


/**
 * Render a gamification point total for display.
 *
 * Points stopped being whole numbers when the mentor override began paying up
 * the whole mentorship chain: each level's cut is a percentage of the level
 * below it, so a grand-mentor routinely earns 0.1 of a point. The API sends
 * these as `Numeric(12,2)`, which reaches the client as a number like `98` or
 * `0.1` — and occasionally as a string, depending on the serializer.
 *
 * Whole values render with no decimal point ("98", not "98.0"); fractional
 * values keep one place. Thousands are grouped.
 */
export function formatPoints(value: string | number | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  if (n === null || n === undefined || Number.isNaN(n)) return "0";
  const rounded = Math.round(n * 10) / 10;
  return rounded.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}
