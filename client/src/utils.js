export const SLOTS = [
  { value: 'morning', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

export const slotLabel = (slot) => SLOTS.find((s) => s.value === slot)?.label || slot;

// Today as YYYY-MM-DD in local time
export const todayStr = () => new Date().toLocaleDateString('en-CA');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2026-10-15' -> '15 Oct 2026'
export function formatDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// from/to -> '15 Oct 2026' or '1 Oct – 15 Oct 2026'
export function formatRange({ from, to }) {
  if (from === to) return formatDate(from);
  const [fy] = from.split('-');
  const [ty] = to.split('-');
  const start = fy === ty ? formatDate(from).replace(` ${fy}`, '') : formatDate(from);
  return `${start} – ${formatDate(to)}`;
}