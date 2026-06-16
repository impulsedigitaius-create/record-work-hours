import type { PunchType } from './types'

export const NEXT_PUNCHES: Record<string, PunchType[]> = {
  null:      ['IN'],
  IN:        ['BREAK_OUT', 'OUT'],
  BREAK_OUT: ['BREAK_IN'],
  BREAK_IN:  ['BREAK_OUT', 'OUT'],
  OUT:       ['IN'],
}
