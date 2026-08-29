import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  isThisYear,
  isToday,
  isYesterday,
} from "date-fns";

function toDate(date: Date | string | number): Date {
  return date instanceof Date ? date : new Date(date);
}

// ───────────────────────────────────────────────────────────────
//  SECTION 1: Currency Formatting
// ───────────────────────────────────────────────────────────────

/**
 * "$1,234.56" — always absolute value
 * @example formatAmount(1234.56)        → "$1,234.56"
 * @example formatAmount(-50)            → "$50.00"
 * @example formatAmount(1234.56, "NGN") → "₦1,234.56"
 */
export function formatAmount(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

/**
 * "$1,234.56" with sign — use for credits/debits
 * @example formatAmountSigned(1234.56)  → "+$1,234.56"
 * @example formatAmountSigned(-50)      → "-$50.00"
 */
export function formatAmountSigned(amount: number, currency = "USD"): string {
  const formatted = formatAmount(amount, currency);
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * @example formatPercent(12.5)    → "12.50%"
 * @example formatPercent(12.5, 0) → "13%"
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

// ───────────────────────────────────────────────────────────────
//  SECTION 2: Relative Time (Smart "ago" formatting)
// ───────────────────────────────────────────────────────────────

/**
 * Human-friendly relative time — best for chat messages, activity feeds, notifications
 *
 * @example formatRelative(new Date())                    → "Just now"
 * @example formatRelative(Date.now() - 5 * 60_000)       → "5m ago"
 * @example formatRelative(Date.now() - 3 * 3_600_000)    → "3h ago"
 * @example formatRelative(Date.now() - 2 * 86_400_000)  → "2d ago"
 * @example formatRelative(new Date("2024-06-03"))       → "Jun 3"      (if this year)
 * @example formatRelative(new Date("2023-06-03"))       → "Jun 3, 2023"
 */
export function formatRelative(date: Date | string | number): string {
  const d = toDate(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return isThisYear(d) ? format(d, "MMM d") : format(d, "MMM d, yyyy");
}

/**
 * Verbose relative time — best for tooltips, hover states
 *
 * @example formatRelativeVerbose(Date.now() - 5 * 60_000)  → "5 minutes ago"
 * @example formatRelativeVerbose(Date.now() - 3_600_000)     → "an hour ago"
 */
export function formatRelativeVerbose(date: Date | string | number): string {
  return formatDistanceToNow(toDate(date), { addSuffix: true });
}

// ───────────────────────────────────────────────────────────────
//  SECTION 3: Absolute Dates
// ───────────────────────────────────────────────────────────────

/**
 * "May 6" or "May 6, 2024" — omits year when current year
 * Best for: transaction lists, history tables, grouped headers
 *
 * @example formatDate(new Date())         → "Jun 11"
 * @example formatDate("2024-01-15")      → "Jan 15"
 * @example formatDate("2023-01-15")      → "Jan 15, 2023"
 */
export function formatDate(date: Date | string | number): string {
  const d = toDate(date);
  return isThisYear(d) ? format(d, "MMM d") : format(d, "MMM d, yyyy");
}

/**
 * "May 6, 2024" — always includes year
 * Best for: receipts, exports, statements, legal documents
 *
 * @example formatDateFull("2024-06-11")  → "June 11, 2024"
 */
export function formatDateFull(date: Date | string | number): string {
  return format(toDate(date), "MMMM d, yyyy");
}

/**
 * "May 6, 3:45 PM" or "May 6, 2024, 3:45 PM" — date + time
 * Best for: transaction details, audit logs, notification timestamps
 *
 * @example formatDateTime(new Date())              → "Jun 11, 3:45 PM"
 * @example formatDateTime("2023-06-11T15:45:00")   → "Jun 11 2023, 3:45 PM"
 */
export function formatDateTime(date: Date | string | number): string {
  const d = toDate(date);
  return isThisYear(d)
    ? format(d, "MMM d, h:mm a")
    : format(d, "MMM d yyyy, h:mm a");
}

/**
 * "3:45 PM" — time only
 * Best for: use alongside a date label, notification lists
 *
 * @example formatTime(new Date())  → "3:45 PM"
 */
export function formatTime(date: Date | string | number): string {
  return format(toDate(date), "h:mm a");
}

/**
 * "05/06/2024" — numeric, US format
 * Best for: form inputs, date pickers, filenames
 *
 * @example formatDateNumeric("2024-06-11")  → "06/11/2024"
 */
export function formatDateNumeric(date: Date | string | number): string {
  return format(toDate(date), "MM/dd/yyyy");
}

/**
 * "2024-06-11" — ISO format
 * Best for: API params, sorting, database queries, filenames
 *
 * @example formatDateISO(new Date())  → "2024-06-11"
 */
export function formatDateISO(date: Date | string | number): string {
  return format(toDate(date), "yyyy-MM-dd");
}

// ───────────────────────────────────────────────────────────────
//  SECTION 4: Smart Date Labels (Today / Yesterday aware)
// ───────────────────────────────────────────────────────────────

/**
 * "Today", "Yesterday", "May 6" — smart grouping label
 * Best for: chat session list, grouped message headers, notification sections
 *
 * @example formatDateSmart(new Date())              → "Today"
 * @example formatDateSmart(Date.now() - 86_400_000)  → "Yesterday"
 * @example formatDateSmart("2024-06-03")            → "Jun 3"
 */
export function formatDateSmart(date: Date | string | number): string {
  const d = toDate(date);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return formatDate(d);
}

/**
 * "Today at 3:45 PM", "Yesterday at 10:30 AM", "Jun 3 at 9:00 AM"
 * Best for: notification detail views, full timestamps
 *
 * @example formatDateTimeSmart(new Date())              → "Today at 3:45 PM"
 * @example formatDateTimeSmart(Date.now() - 86_400_000) → "Yesterday at 3:45 PM"
 * @example formatDateTimeSmart("2024-06-03T09:00:00")   → "Jun 3 at 9:00 AM"
 */
export function formatDateTimeSmart(date: Date | string | number): string {
  const d = toDate(date);
  if (isToday(d)) return `Today at ${formatTime(d)}`;
  if (isYesterday(d)) return `Yesterday at ${formatTime(d)}`;
  return `${formatDate(d)} at ${formatTime(d)}`;
}

// ───────────────────────────────────────────────────────────────
//  SECTION 5: Date Grouping (for lists, tables, feeds)
// ───────────────────────────────────────────────────────────────

export type DateGroup =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "thisMonth"
  | "earlier";

/**
 * Categorize a date into a group for list rendering
 * Best for: notification dropdowns, chat history, activity feeds
 *
 * @example getDateGroup(new Date())              → "today"
 * @example getDateGroup(Date.now() - 86_400_000)  → "yesterday"
 * @example getDateGroup(Date.now() - 3 * 86_400_000) → "thisWeek"
 * @example getDateGroup("2024-05-01")            → "thisMonth" (if May is current month)
 * @example getDateGroup("2024-01-01")            → "earlier"
 */
export function getDateGroup(date: Date | string | number): DateGroup {
  const d = toDate(date);
  const now = new Date();

  if (isToday(d)) return "today";
  if (isYesterday(d)) return "yesterday";

  const daysDiff = differenceInCalendarDays(now, d);
  if (daysDiff < 7) return "thisWeek";

  const sameMonth =
    d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (sameMonth) return "thisMonth";

  return "earlier";
}

/**
 * Human-friendly group label
 *
 * @example formatGroupLabel("today")      → "Today"
 * @example formatGroupLabel("thisWeek")   → "This Week"
 * @example formatGroupLabel("earlier")    → "Earlier"
 */
export function formatGroupLabel(group: DateGroup): string {
  switch (group) {
    case "today":
      return "Today";
    case "yesterday":
      return "Yesterday";
    case "thisWeek":
      return "This Week";
    case "thisMonth":
      return "This Month";
    case "earlier":
      return "Earlier";
  }
}

/**
 * Group an array of items by date category
 * Best for: notification lists, transaction history, chat messages
 *
 * @example
 * const items = [
 *   { id: "1", createdAt: new Date() },
 *   { id: "2", createdAt: Date.now() - 86_400_000 },
 * ];
 * groupByDate(items, (i) => i.createdAt);
 * // → { today: [{ id: "1" }], yesterday: [{ id: "2" }] }
 */
export function groupByDate<T>(
  items: T[],
  dateFn: (item: T) => Date | string | number,
): Record<DateGroup, T[]> {
  const groups: Record<DateGroup, T[]> = {
    today: [],
    yesterday: [],
    thisWeek: [],
    thisMonth: [],
    earlier: [],
  };

  for (const item of items) {
    const group = getDateGroup(dateFn(item));
    groups[group].push(item);
  }

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([, items]) => items.length > 0),
  ) as Record<DateGroup, T[]>;
}

// ───────────────────────────────────────────────────────────────
//  SECTION 6: Notification-Specific Formatting
// ───────────────────────────────────────────────────────────────

/**
 * Compact time for notification dropdowns
 * "3:45 PM" for today, "Yesterday" for yesterday, "Jun 3" for older
 *
 * @example formatNotificationTime(new Date())              → "3:45 PM"
 * @example formatNotificationTime(Date.now() - 86_400_000)  → "Yesterday"
 * @example formatNotificationTime("2024-06-03")             → "Jun 3"
 */
export function formatNotificationTime(date: Date | string | number): string {
  const d = toDate(date);
  if (isToday(d)) return formatTime(d);
  if (isYesterday(d)) return "Yesterday";
  return formatDate(d);
}

/**
 * Full notification timestamp with context
 * "Today at 3:45 PM", "Yesterday at 10:30 AM", "Jun 3, 2024 at 9:00 AM"
 *
 * @example formatNotificationTimestamp(new Date())              → "Today at 3:45 PM"
 * @example formatNotificationTimestamp(Date.now() - 86_400_000) → "Yesterday at 3:45 PM"
 */
export function formatNotificationTimestamp(
  date: Date | string | number,
): string {
  return formatDateTimeSmart(date);
}

/**
 * Date for notification detail page headers
 * "Feb 12, 2025" — always includes year
 *
 * @example formatNotificationDate("2025-02-12")  → "Feb 12, 2025"
 */
export function formatNotificationDate(date: Date | string | number): string {
  return format(toDate(date), "MMM d, yyyy");
}

// ───────────────────────────────────────────────────────────────
//  SECTION 7: Generic GroupBy Utility
// ───────────────────────────────────────────────────────────────

/**
 * Group array items by a key function
 * Best for: any list grouping (status, category, date, etc.)
 *
 * @example
 * const users = [
 *   { name: "Alice", role: "admin" },
 *   { name: "Bob", role: "user" },
 * ];
 * groupBy(users, (u) => u.role);
 * // → { admin: [{ name: "Alice" }], user: [{ name: "Bob" }] }
 */
export function groupBy<T>(
  arr: T[],
  keyFn: (item: T) => string,
): Record<string, T[]> {
  return arr.reduce(
    (groups, item) => {
      const key = keyFn(item);
      groups[key] = groups[key] ?? [];
      groups[key].push(item);
      return groups;
    },
    {} as Record<string, T[]>,
  );
}
