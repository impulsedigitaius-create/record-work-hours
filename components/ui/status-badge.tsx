import clsx from 'clsx'
import type { PunchType } from '@/lib/types'

// 'IN' = inicio de turno (oliva), 'OUT' = fin de turno (terracota)
export function StatusBadge({ type, label }: { type: PunchType; label?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide',
        type === 'IN' ? 'bg-olive text-white' : 'bg-terracotta text-white',
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
      {label ?? type}
    </span>
  )
}
