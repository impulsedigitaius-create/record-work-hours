import type { PunchType } from './types'

export const NEXT_PUNCHES: Record<string, PunchType[]> = {
  null:      ['IN'],
  IN:        ['BREAK_OUT', 'OUT'],
  BREAK_OUT: ['BREAK_IN'],
  BREAK_IN:  ['BREAK_OUT', 'OUT'],
  // Tras un OUT también se permite BREAK_IN: cubre el caso de quien marca
  // "Clock Out" por error al irse a almorzar y vuelve del almuerzo.
  OUT:       ['IN', 'BREAK_IN'],
}

/** Minutos a partir de los cuales un break abierto se considera anómalo
 *  (el trabajador volvió pero no marcó el regreso). */
export const STALE_BREAK_MINUTES = 90
