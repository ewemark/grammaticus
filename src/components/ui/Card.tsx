import { type HTMLAttributes } from 'react'
import styles from './Card.module.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Card — SpaceX 风格
 * 暗面卡片，极细边框，无阴影，无装饰
 */
export default function Card({ className, children, ...rest }: CardProps) {
  const cls = [styles.card, className].filter(Boolean).join(' ')
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}
