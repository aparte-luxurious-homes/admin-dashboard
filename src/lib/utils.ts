import numeral from 'numeral';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs))
}

export const formatMoney = (amount: string|number): string => {
    return numeral(amount).format('₦0,0.00');
};

export function areArraysEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) return false; // Different lengths → not equal
    return arr1.sort().toString() === arr2.sort().toString();
}