
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string, includeTime: boolean = false): string {
  if (!dateString) return ""
  try {
    const date = new Date(dateString) // Use full ISO string
    const formatString = includeTime ? "MM/dd/yy hh:mm a" : "MM/dd/yy"
    return format(date, formatString)
  } catch (e) {
    // Fallback for date-only strings
    try {
        const date = new Date(`${dateString}T00:00:00`)
        const formatString = includeTime ? "MM/dd/yy hh:mm a" : "MM/dd/yy"
        return format(date, formatString)
    } catch (err) {
        return dateString
    }
  }
}
