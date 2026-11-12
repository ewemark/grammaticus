/**
 * OnboardingTour — 新手 3 步引导
 * 首次访问(localStorage 无 'grammaticus-onboarded')时延迟 800ms 出现;
 * 完成或跳过后写入 '1',不再打扰。遮罩不拦截页面点击,仅卡片可交互。
 */
import { useEffect, useState } from 'react'
import { microLabel } from '../../styles/typography'

const STORAGE_KEY = 'grammaticus-onboarded'
const DELAY_MS = 800

interface TourStep {
  title: string
  body: string
  /** 方向示意卡片定位(固定位置,不精确锚定元素) */
  cardStyle: React.CSSProperties
}

const STEPS: TourStep[] = [
  {
    title: '学习助手',
    body: '选中任何句子,AI 老师立刻逐词拆解语法。试试拖动它到顺手的边缘。',
    cardStyle: { bottom: 96, right: 24 },
  },
  {
    title: '学习空间',
    body: '你的笔记、句子库、词典都沉淀在 SPACE。记录越多,AI 老师越懂你。',
    cardStyle: { left: 24, top: '40%' },
  },
  {
    title: '智能搜索',
    body: '搜词支持变形还原和拼写纠错:搜 ran 能找到 run,拼错也能纠正。',
    cardStyle: { top: 88, left: '50%', transform: 'translateX(-50%)' },
  },
]

function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch {
    return true // 存储不可用 → 不弹引导
  }
}

const skipBtnStyle: React.CSSProperties = {
  ...microLabel,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: 'var(--space-xxs) 0',
}

const nextBtnStyle: React.CSSProperties = {
  ...microLabel,
  background: 'var(--color-text)',
  color: 'var(--color-canvas)',
  border: '1px solid var(--color-text)',
  borderRadius: 'var(--radius-pill)',
  padding: 'var(--space-xs) var(--space-md)',
  cursor: 'pointer',
}

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (hasOnboarded()) return
    const timer = window.setTimeout(() => setVisible(true), DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  if (!visible) return null

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch { /* 存储不可用 — 仅本次会话不再显示 */ }
    setVisible(false)
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <>
      {/* 半透明遮罩:pointer-events 只在卡片上 */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1500,
          background: 'var(--color-overlay)',
          pointerEvents: 'none',
        }}
      />
      <div
        role="dialog"
        aria-label={`新手引导 ${step + 1}/${STEPS.length}`}
        style={{
          position: 'fixed',
          zIndex: 1501,
          width: 300,
          boxSizing: 'border-box',
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-raised)',
          padding: 'var(--space-lg)',
          pointerEvents: 'auto',
          ...current.cardStyle,
        }}
      >
        <p style={{ ...microLabel, margin: '0 0 var(--space-sm)' }}>
          {current.title} · {step + 1}/{STEPS.length}
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-body-sm)',
          lineHeight: 'var(--leading-body)',
          color: 'var(--color-text-soft)',
          margin: '0 0 var(--space-lg)',
        }}>
          {current.body}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <button onClick={finish} style={skipBtnStyle}>跳过</button>
          <button
            onClick={() => {
              if (isLast) finish()
              else setStep(step + 1)
            }}
            style={nextBtnStyle}
          >
            {isLast ? '开始使用' : '下一步'}
          </button>
        </div>
      </div>
    </>
  )
}
