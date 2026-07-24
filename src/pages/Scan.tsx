import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Scan() {
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
        SCAN
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
          margin: '0 0 var(--space-md)',
        }}
      >
        Photo Translate
      </h2>
      <p style={{ fontSize: 'var(--text-body)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xxl)', maxWidth: 520 }}>
        Take a photo of English text and get an instant translation.
      </p>

      {/* Camera zone */}
      <Card>
        <div
          style={{
            border: `2px dashed var(--color-border)`,
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--space-huge) var(--space-xxl)',
            textAlign: 'center',
            minHeight: 280,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
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
            CAMERA PREVIEW
          </p>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-xl)' }}>
            Position the text within the frame
          </p>
          <Button variant="ghost">OPEN CAMERA</Button>
        </div>
      </Card>

      {/* Result placeholder */}
      <div style={{ marginTop: 'var(--space-xxl)' }}>
        <Card>
          <h4
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-micro)',
              fontWeight: 700,
              letterSpacing: 'var(--tracking-micro)',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
              margin: '0 0 var(--space-xl)',
            }}
          >
            TRANSLATION RESULT
          </h4>
          <div style={{ padding: 'var(--space-huge) 0', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-display)', fontSize: 'var(--text-micro)', letterSpacing: 'var(--tracking-micro)', textTransform: 'uppercase' }}>
            Take a photo to see the translation here
          </div>
        </Card>
      </div>
    </div>
  )
}
