import numeral from 'numeral';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
 return twMerge(clsx(inputs))
}

export const formatMoney = (amount: string|number): string => {
    return numeral(amount).format('₦0,0.00');
};