import { type ClassValue, clsx } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(amount: number): string {
  return `Bs. ${amount.toFixed(2)}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim()
}

export function generateSKU(category: string, name: string): string {
  const cat = category.slice(0, 3).toUpperCase()
  const hash = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${cat}-${hash}-${rand}`
}
