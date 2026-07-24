import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-section) 0' }}>
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'var(--text-display-lg)',
          fontWeight: 700,
          lineHeight: 'var(--leading-heading)',
          letterSpacing: 'var(--tracking-heading)',
          textTransform: 'uppercase',
          color: 'var(--color-text)',
          margin: '0 0 var(--space-lg)',
        }}
      >
        404
      </h2>
      <p
        style={{
          fontSize: 'var(--text-body-lg)',
          lineHeight: 'var(--leading-body)',
          color: 'var(--color-text-secondary)',
          margin: '0 0 var(--space-xxl)',
        }}
      >
        Page not found.
      </p>
      <Link to="/">
        <Button variant="ghost">RETURN HOME</Button>
      </Link>
    </div>
  )
}
