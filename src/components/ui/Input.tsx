import { type InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

type InputProps = InputHTMLAttributes<HTMLInputElement>

/**
 * Input — 极简输入框
 * 颜色随主题变量自适应（深色/浅色）
 */
export default function Input({ className, ...rest }: InputProps) {
  const cls = [styles.input, className].filter(Boolean).join(' ')
  return <input className={cls} {...rest} />
}
