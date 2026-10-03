/** Pence to "£1 3s 4d". Negative values get a leading minus. */
export function formatCoin(pence: number): string {
  const neg = pence < 0;
  let p = Math.abs(Math.round(pence));
  const l = Math.floor(p / 240);
  p -= l * 240;
  const s = Math.floor(p / 12);
  const d = p - s * 12;
  const parts: string[] = [];
  if (l) parts.push(`£${l}`);
  if (s) parts.push(`${s}s`);
  if (d || parts.length === 0) parts.push(`${d}d`);
  return (neg ? '-' : '') + parts.join(' ');
}

export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

export function signed(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ORD: Record<string, string> = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };

/** 41 -> "forty-one" (0-99). */
export function numberWords(n: number): string {
  if (n < 20) return ONES[n] ?? String(n);
  if (n >= 100) return String(n);
  const t = TENS[Math.floor(n / 10)]!;
  return n % 10 ? `${t}-${ONES[n % 10]}` : t;
}

/** 32 -> "thirty-second" (1-99). */
export function ordinalWords(n: number): string {
  const w = numberWords(n);
  const parts = w.split('-');
  const last = parts.pop()!;
  const ord = ORD[last] ?? (last.endsWith('y') ? `${last.slice(0, -1)}ieth` : `${last}th`);
  return [...parts, ord].join('-');
}
