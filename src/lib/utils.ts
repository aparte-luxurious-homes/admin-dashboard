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

export function getDayDifference(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  console.log(Math.abs(Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))))
  return Math.abs(Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
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