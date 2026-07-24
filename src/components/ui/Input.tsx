import { type InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input — SpaceX 风格
 * 暗面输入框，极简
 */
export default function Input({ className, ...rest }: InputProps) {
  const cls = [styles.input, className].filter(Boolean).join(' ')
  return <input className={cls} {...rest} />
}
