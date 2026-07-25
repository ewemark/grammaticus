import { microLabel, pageTitle } from '../styles/typography'
import ArticleLibrary from './read/ArticleLibrary'

export default function Read() {
  return (
    <div>
      <p style={{ ...microLabel, margin: '0 0 var(--space-md)' }}>READING</p>
      <h2 style={{ ...pageTitle, margin: '0 0 var(--space-xxl)' }}>文章阅读</h2>
      <ArticleLibrary />
    </div>
  )
}
