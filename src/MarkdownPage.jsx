import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

function MarkdownPage({ file }) {
  const [content, setContent] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    setContent('')
    setError(null)
    fetch(file)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${file}`)
        return res.text()
      })
      .then(setContent)
      .catch((err) => setError(err.message))
  }, [file])

  return (
    <section className="why-page markdown-page" aria-label="Markdown document">
      {error ? (
        <p style={{ color: '#f87171' }}>{error}</p>
      ) : content ? (
        <ReactMarkdown>{content}</ReactMarkdown>
      ) : (
        <p className="equation-help">Loading…</p>
      )}
    </section>
  )
}

export default MarkdownPage
