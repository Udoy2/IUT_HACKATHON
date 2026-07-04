// cn: clsx + tailwind-merge (works fine even without tailwind — dedupes & filters falsy).
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
