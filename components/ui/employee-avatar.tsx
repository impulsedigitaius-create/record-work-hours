'use client'
import { useState } from 'react'

export function EmployeeAvatar({
  name,
  photoUrl,
  size = 40,
  className = '',
}: {
  name: string
  photoUrl?: string | null
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const showImage = !!photoUrl && !failed
  return (
    <div
      className={`rounded-full bg-clay/15 flex items-center justify-center overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl as string}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-bold text-clay" style={{ fontSize: Math.round(size * 0.4) }}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}
