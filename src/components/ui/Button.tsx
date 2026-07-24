import { type ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type ButtonVariant = 'ghost' | 'filled'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

/**
 * Button — SpaceX 风格
 * - ghost: 描边胶囊按钮（主 CTA），32px 圆角，全大写
 * - filled: 填充按钮（次要场景）
 */
export default function Button({ variant = 'ghost', className, children, ...rest }: ButtonProps) {
  const cls = [styles.button, styles[variant], className].filter(Boolean).join(' ')
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
