import type { Category, CategoryRange } from '../types/domain';

const CATEGORY_LABELS: Record<Category, string> = {
  1: '1ra', 2: '2da', 3: '3ra', 4: '4ta', 5: '5ta', 6: '6ta', 7: '7ma', 8: '8va',
};

/** Formatea pesos argentinos manualmente (separador de miles con punto), sin depender de Intl. */
export function formatPriceARS(amount: number): string {
  const rounded = Math.round(amount);
  const withThousands = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `$${withThousands}`;
}

export function categoryLabel(c: Category): string {
  return CATEGORY_LABELS[c];
}

export function categoryRangeLabel(range: CategoryRange): string {
  return range.min === range.max
    ? categoryLabel(range.min)
    : `${categoryLabel(range.min)}-${categoryLabel(range.max)}`;
}

/** Formatea en 24hs manualmente: el Intl de Hermes en dispositivos reales no siempre respeta hour12:false. */
export function formatTime24(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatSlot(slotStart: number, slotEnd: number): string {
  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  const dateStr = start.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${dateStr} · ${formatTime24(start)}-${formatTime24(end)}`;
}

const MATCH_TYPE_LABELS: Record<string, string> = {
  masculino: 'Masculino',
  femenino: 'Femenino',
  mixto: 'Mixto',
  indistinto: 'Indistinto',
};

export function matchTypeLabel(type: string): string {
  return MATCH_TYPE_LABELS[type] ?? type;
}

export function nextDays(count: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export function dayLabel(date: Date): string {
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Turnos de duración fija dentro de una franja horaria habitual de club (8:00 a 00:00). */
export function generateDaySlots(
  date: Date,
  slotDurationMinutes: number
): { slotStart: number; slotEnd: number; label: string }[] {
  const slots = [];
  const dayStart = new Date(date);
  dayStart.setHours(8, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(24, 0, 0, 0); // 00:00 del día siguiente, para que el último turno llegue hasta medianoche

  let cursor = dayStart.getTime();
  while (cursor + slotDurationMinutes * 60_000 <= dayEnd.getTime()) {
    const slotStart = cursor;
    const slotEnd = cursor + slotDurationMinutes * 60_000;
    const startLabel = formatTime24(new Date(slotStart));
    const endLabel = formatTime24(new Date(slotEnd));
    slots.push({ slotStart, slotEnd, label: `${startLabel}-${endLabel}` });
    cursor = slotEnd;
  }
  return slots;
}
