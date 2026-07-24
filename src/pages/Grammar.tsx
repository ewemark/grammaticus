import Card from '../components/ui/Card'

const TOPICS = [
  { title: 'NOUNS', desc: 'Five declensions, seven cases, gender and number.', emoji: '' },
  { title: 'VERBS', desc: 'Four conjugations, six tenses, three moods, two voices.', emoji: '' },
  { title: 'ADJECTIVES', desc: 'First, second, and third declension adjectives. Comparison.', emoji: '' },
  { title: 'PRONOUNS', desc: 'Personal, demonstrative, relative, interrogative, indefinite.', emoji: '' },
  { title: 'SYNTAX', desc: 'Case usage, clause structure, word order, agreement.', emoji: '' },
  { title: 'TENSE & MOOD', desc: 'Indicative, subjunctive, imperative. Sequence of tenses.', emoji: '' },
]

export default function Grammar() {
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
        GRAMMAR
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
        Reference
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
        {TOPICS.map((t) => (
          <Card key={t.title}>
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-heading-sm)',
                fontWeight: 700,
                letterSpacing: 'var(--tracking-heading)',
                textTransform: 'uppercase',
                color: 'var(--color-text)',
                margin: '0 0 var(--space-md)',
              }}
            >
              {t.title}
            </h4>
            <p style={{ fontSize: 'var(--text-body-sm)', lineHeight: 'var(--leading-body)', color: 'var(--color-text-secondary)' }}>
              {t.desc}
            </p>
          </Card>
        ))}
      </div>

      <p
        style={{
          marginTop: 'var(--space-xxl)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-micro)',
          fontFamily: 'var(--font-display)',
          letterSpacing: 'var(--tracking-micro)',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        Detailed articles coming soon
      </p>
    </div>
  )
}
