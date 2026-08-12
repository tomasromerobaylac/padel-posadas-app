import * as Notifications from 'expo-notifications';
import { formatSlot } from '../utils/format';
import type { PadelEvent } from '../types/domain';

type ReminderSource = Pick<PadelEvent, 'id' | 'slotStart' | 'slotEnd'>;

const DAY_MS = 24 * 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Recordatorios locales (sin servidor) para un partido: uno el día antes y otro
 * 2 horas antes. Se reprograman con un id fijo por evento para no duplicar si
 * el usuario vuelve a entrar a la pantalla del partido.
 */
export async function scheduleEventReminders(event: ReminderSource, clubName: string): Promise<void> {
  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const body = `${clubName} · ${formatSlot(event.slotStart, event.slotEnd)}`;
  const reminders = [
    { id: `event-${event.id}-day-before`, triggerAt: event.slotStart - DAY_MS, title: 'Mañana tenés partido 🎾' },
    { id: `event-${event.id}-2h-before`, triggerAt: event.slotStart - TWO_HOURS_MS, title: 'Tu partido se acerca 🎾' },
  ];

  for (const reminder of reminders) {
    await Notifications.cancelScheduledNotificationAsync(reminder.id).catch(() => {});
    if (reminder.triggerAt <= Date.now()) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: reminder.id,
      content: { title: reminder.title, body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder.triggerAt },
    });
  }
}
