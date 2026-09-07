import type { ReactNode } from 'react'

import { cn } from '../lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-surface-container-high bg-surface-container-lowest/70 backdrop-blur-sm',
        hover &&
          'transition-colors duration-200 hover:border-outline-variant',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default Card