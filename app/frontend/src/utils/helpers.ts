/**
 * Utility helper functions
 */

/**
 * Format currency with proper decimals
 */
export const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'HBAR' || currency === 'USDC' ? 'USD' : currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Truncate Hedera account ID for display
 */
export const truncateAddress = (address: string, chars: number = 6): string => {
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format timestamp
 */
export const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

/**
 * Validate Hedera account ID format
 */
export const isValidHederaAccountId = (accountId: string): boolean => {
  const regex = /^0\.0\.\d+$/;
  return regex.test(accountId);
};

/**
 * Parse search query for product keywords
 */
export const parseSearchQuery = (query: string): {
  keywords: string[];
  priceRange?: { min: number; max: number };
  category?: string;
} => {
  const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);

  // Simple price range detection (e.g., "under $500", "$100-$200")
  const priceMatch = query.match(/\$(\d+)(?:-\$?(\d+))?/);
  let priceRange: { min: number; max: number } | undefined;

  if (priceMatch) {
    const min = parseInt(priceMatch[1]);
    const max = priceMatch[2] ? parseInt(priceMatch[2]) : min;
    priceRange = { min, max };
  }

  return {
    keywords,
    priceRange,
  };
};

/**
 * Calculate trust score color
 */
export const getTrustScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-yellow-400';
  if (score >= 50) return 'text-orange-400';
  return 'text-red-400';
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Sleep/delay utility
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
