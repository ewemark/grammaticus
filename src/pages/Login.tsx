import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { register, login, setToken, getToken } from '../api/auth'
import { syncToServer } from '../api/userData'
import { getBookmarks } from '../utils/bookmarks'
import { getReadArticles } from '../utils/readingProgress'
import { getSavedArticles } from '../utils/savedArticles'
import { syncAllNotesToCloud } from '../utils/notes'
import { syncAllDictionaryToCloud } from '../utils/dictionary'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [authed, setAuthed] = useState(() => !!getToken())

  // Redirect away if a token appears while this page is mounted (e.g. after login)
  useEffect(() => {
    if (getToken()) setAuthed(true)
  }, [loading])

  if (authed) return <Navigate to="/" replace />

  const handleSubmit = async () => {
    setError('')
    setLoading(true)
    try {
      const res = mode === 'register'
        ? await register({ username, email, password })
        : await login({ email, password })
      setToken(res.token)
      const bookmarks = getBookmarks().map(b => ({ word: b.word, meaning: b.meaning, pos: b.pos }))
      const progress = [...getReadArticles()]
      const saved = getSavedArticles().map(a => ({ article_id: a.id, title: a.title, content: a.content, words: a.words }))
      if (bookmarks.length || progress.length || saved.length) {
        syncToServer({ bookmarks, progress, saved }).catch(() => {})
      }
      // Learning space assets → cloud backup (fire-and-forget)
      syncAllNotesToCloud()
      syncAllDictionaryToCloud()
      setAuthed(true) // triggers <Navigate to="/" replace />
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      try { setError(JSON.parse(msg).error || '操作失败') }
      catch { setError(msg || '操作失败') }
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 0',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    color: 'var(--color-text)',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--color-border)',
    borderRadius: 0,
    outline: 'none',
    boxSizing: 'border-box',
    caretColor: 'var(--color-text)',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-display)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 'var(--tracking-micro)',
    textTransform: 'uppercase',
    color: 'var(--color-text-secondary)',
    marginBottom: 4,
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-canvas)',
      overflow: 'hidden',
      padding: '40px 20px',
      boxSizing: 'border-box',
    }}>
      {/* Animated fluid blobs */}
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0)scale(1)} 25%{transform:translate(120px,-80px)scale(1.3)} 50%{transform:translate(-60px,100px)scale(0.8)} 75%{transform:translate(-100px,-40px)scale(1.2)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)scale(1)} 33%{transform:translate(-100px,60px)scale(1.4)} 66%{transform:translate(80px,-100px)scale(0.7)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0)scale(1)} 20%{transform:translate(60px,120px)scale(0.9)} 50%{transform:translate(-120px,-60px)scale(1.3)} 80%{transform:translate(40px,-80px)scale(1.1)} }
        @keyframes float4 { 0%,100%{transform:translate(0,0)scale(1)} 30%{transform:translate(-80px,-120px)scale(1.2)} 60%{transform:translate(100px,40px)scale(0.8)} }
        @keyframes float5 { 0%,100%{transform:translate(0,-60px)scale(1)} 50%{transform:translate(-40px,60px)scale(1.5)} }
        @keyframes float6 { 0%,100%{transform:translate(50px,0)scale(1)} 50%{transform:translate(-50px,80px)scale(1.3)} }
      `}</style>
      <div style={{position:'absolute',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,color-mix(in srgb, var(--color-text) 30%, transparent) 0%,transparent 70%)',top:'10%',left:'5%',filter:'blur(60px)',animation:'float1 18s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,color-mix(in srgb, var(--color-text) 25%, transparent) 0%,transparent 70%)',top:'50%',right:'0%',filter:'blur(80px)',animation:'float2 22s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,color-mix(in srgb, var(--color-text) 35%, transparent) 0%,transparent 70%)',bottom:'-10%',left:'20%',filter:'blur(70px)',animation:'float3 20s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,color-mix(in srgb, var(--color-text) 22%, transparent) 0%,transparent 70%)',top:'20%',right:'15%',filter:'blur(50px)',animation:'float4 16s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:250,height:250,borderRadius:'50%',background:'radial-gradient(circle,color-mix(in srgb, var(--color-text) 20%, transparent) 0%,transparent 70%)',bottom:'20%',right:'25%',filter:'blur(45px)',animation:'float5 14s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:300,height:300,borderRadius:'50%',background:'radial-gradient(circle,color-mix(in srgb, var(--color-text) 18%, transparent) 0%,transparent 70%)',top:'40%',left:'40%',filter:'blur(55px)',animation:'float6 24s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,color-mix(in srgb, var(--color-text) 24%, transparent) 0%,transparent 70%)',top:'0%',left:'30%',filter:'blur(40px)',animation:'float5 12s ease-in-out infinite'}}/>
      <div style={{position:'absolute',width:450,height:450,borderRadius:'50%',background:'radial-gradient(circle,color-mix(in srgb, var(--color-text) 32%, transparent) 0%,transparent 70%)',bottom:'30%',left:'-5%',filter:'blur(65px)',animation:'float1 26s ease-in-out infinite'}}/>

      {/* Content — all inline, no card wrapper */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: 380,
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: 'var(--color-text)',
            margin: '0 0 16px',
          }}>
            GRAMMATICUS
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-body)',
            color: 'var(--color-text-secondary)',
            margin: 0,
            lineHeight: 1.7,
          }}>
            为深度语言学习者打造的智能参考工具
          </p>
        </div>

        {/* Mode switcher */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 48, justifyContent: 'center' }}>
          <button onClick={() => setMode('login')} style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 'var(--tracking-micro)',
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
            background: 'none',
            color: mode === 'login' ? 'var(--color-text)' : 'var(--color-text-secondary)',
            padding: 0,
            transition: 'color 0.4s',
          }}>
            登录
          </button>
          <button onClick={() => setMode('register')} style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 'var(--tracking-micro)',
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
            background: 'none',
            color: mode === 'register' ? 'var(--color-text)' : 'var(--color-text-secondary)',
            padding: 0,
            transition: 'color 0.4s',
          }}>
            注册
          </button>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {mode === 'register' && (
            <div>
              <p style={labelStyle}>用户名</p>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                placeholder="2-30 个字符"
                autoComplete="username"
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <p style={labelStyle}>邮箱</p>
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              placeholder="your@email.com"
              type="email"
              autoComplete="email"
              style={inputStyle}
            />
          </div>
          <div>
            <p style={labelStyle}>密码</p>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
              placeholder={mode === 'register' ? '字母 + 数字，至少 6 位' : '输入密码'}
              type="password"
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{
              fontSize: 12,
              color: 'var(--color-error)',
              margin: 0,
              opacity: 0.9,
            }}>
              {error}
            </p>
          )}

          <Button onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
            {loading ? '处理中…' : mode === 'login' ? '登录' : '创建账号'}
          </Button>
        </div>
      </div>
    </div>
  )
}
