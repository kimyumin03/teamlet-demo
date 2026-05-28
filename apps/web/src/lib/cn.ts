// Standard shadcn-style classname merger.
// `npm i clsx tailwind-merge` if not already installed.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
