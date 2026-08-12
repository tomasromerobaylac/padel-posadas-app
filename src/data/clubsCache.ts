import { useEffect, useState } from 'react';
import { listClubs } from './clubsRepo';
import type { Club } from '../types/domain';

/** Carga la lista de clubes una vez y expone un mapa id -> club para resolver nombres en listados. */
export function useClubsById() {
  const [clubsById, setClubsById] = useState<Record<string, Club>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listClubs()
      .then((clubs) => {
        setClubsById(Object.fromEntries(clubs.map((c) => [c.id, c])));
      })
      .catch(() => setClubsById({}))
      .finally(() => setLoading(false));
  }, []);

  return { clubsById, loading };
}
