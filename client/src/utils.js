export const SLOTS = [
  { value: 'morning', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

export const slotLabel = (slot) => SLOTS.find((s) => s.value === slot)?.label || slot;

// Today as YYYY-MM-DD in local time
export const todayStr = () => new Date().toLocaleDateString('en-CA');