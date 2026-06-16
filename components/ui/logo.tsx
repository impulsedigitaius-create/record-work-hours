import Image from 'next/image'

export function Logo({ size = 96, className = '' }: { size?: number; className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Lox Life Camps"
      width={size}
      height={size}
      priority
      className={className}
      style={{ height: 'auto', width: size }}
    />
  )
}
