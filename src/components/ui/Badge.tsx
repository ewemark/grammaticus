import { type HTMLAttributes } from 'react'
import styles from './Badge.module.css'

type BadgeColor = 'purple' | 'green' | 'pink' | 'blue' | 'yellow' | 'orange' | 'gray' | 'violet' | 'sky'

const COLOR_MAP: Record<BadgeColor, string> = {
  purple: 'var(--color-noun)',
  green: 'var(--color-verb)',
  pink: 'var(--color-adjective)',
  blue: 'var(--color-pronoun)',
  yellow: 'var(--color-adverb)',
  orange: 'var(--color-preposition)',
  gray: 'var(--color-conjunction)',
  violet: 'var(--color-interjection)',
  sky: 'var(--color-numeral)',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor
}

/**
 * Badge — SpaceX 风格
 * 极简描边标签，按词性分配颜色
 */
export default function Badge({ color = 'purple', className, children, style, ...rest }: BadgeProps) {
  const cls = [styles.badge, className].filter(Boolean).join(' ')
  return (
    <span
      className={cls}
      style={{ color: COLOR_MAP[color], borderColor: COLOR_MAP[color], ...style }}
      {...rest}
    >
      {children}
    </span>
  )
}
