import { forwardRef } from 'react'
import clsx from 'clsx'

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'olive' | 'clay' | 'gold'
}

export const AppCard = forwardRef<HTMLDivElement, AppCardProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'rounded-2xl p-5 shadow-card',
        {
          'bg-cream border border-latte': variant === 'default',
          'bg-olive/10 border border-olive/25': variant === 'olive',
          'bg-clay/10 border border-clay/25': variant === 'clay',
          'bg-gold/10 border border-gold/30': variant === 'gold',
        },
        className,
      )}
      {...props}
    />
  ),
)
AppCard.displayName = 'AppCard'
