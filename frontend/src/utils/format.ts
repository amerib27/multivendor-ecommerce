/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date in a human-readable format
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(date))
}

/**
 * Format a date as relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const diff = Date.now() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 30) return formatDate(date)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

/**
 * Calculate discount percentage
 */
export const calcDiscount = (price: number, comparePrice: number | null | undefined): number => {
  if (!comparePrice || comparePrice <= 0 || price >= comparePrice) return 0
  return Math.round((1 - price / comparePrice) * 100)
}

/**
 * Truncate text to a max length
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Format order number for display
 */
export const formatOrderNumber = (orderNumber: string): string => orderNumber

/**
 * Generate initials from name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
