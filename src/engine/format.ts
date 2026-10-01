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
