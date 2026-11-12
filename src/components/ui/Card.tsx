import { type HTMLAttributes } from 'react'
import styles from './Card.module.css'

type CardProps = HTMLAttributes<HTMLDivElement>

/**
 * Card — 极细边框卡片
 * 颜色随主题变量自适应（深色/浅色）
 */
export default function Card({ className, children, ...rest }: CardProps) {
  const cls = [styles.card, className].filter(Boolean).join(' ')
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  )
}
