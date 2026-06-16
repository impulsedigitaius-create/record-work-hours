import { forwardRef } from 'react'
import clsx from 'clsx'

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold',
        'transition-all duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]',
        {
          'bg-clay text-white hover:bg-clay/90 focus-visible:ring-clay shadow-sm':
            variant === 'primary',
          'bg-transparent text-espresso hover:bg-espresso/8': variant === 'ghost',
          'border-2 border-espresso/25 text-espresso hover:border-espresso/50 hover:bg-espresso/5':
            variant === 'outline',
          'bg-terracotta text-white hover:bg-terracotta/90 focus-visible:ring-terracotta':
            variant === 'danger',
          'px-4 py-2 text-sm': size === 'sm',
          'px-6 py-3 text-base': size === 'md',
          'px-8 py-4 text-lg w-full': size === 'lg',
        },
        className,
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  ),
)
AppButton.displayName = 'AppButton'
