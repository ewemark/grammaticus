export default function About() {
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-micro)',
          fontWeight: 700,
          letterSpacing: 'var(--tracking-micro)',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          margin: '0 0 var(--space-md)',
        }}
      >
        ABOUT
      </p>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-display-xl)',
          fontWeight: 700,
          lineHeight: 'var(--leading-heading)',
          letterSpacing: 'var(--tracking-heading)',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
          margin: '0 0 var(--space-xxl)',
        }}
      >
        About the Author
      </h2>

      <div style={{ maxWidth: 600 }}>
        <p style={{ fontSize: 'var(--text-body-lg)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          Grammaticus is built for English learners who want precision — every word defined,
          every grammatical rule at your fingertips.
        </p>
        <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
          Built with React, TypeScript, and a love for the English language.
        </p>
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
          Version 0.1 — July 2026
        </p>
      </div>
    </div>
  )
}
