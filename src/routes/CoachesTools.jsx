import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mdContent from '../../content/coaches-tools/erg_test_relationships.md?raw'

export default function CoachesTools(){
  return (
    <section className="card">
      <header>
        <h2 style={{ marginTop:0 }}>Coaches Tools</h2>
        <p className="small" style={{ marginTop:4 }}>Quick references and utilities for coaches.</p>
      </header>
      <div className="grid" style={{ gridTemplateColumns:'1fr', gap:16, marginTop:12 }}>
        <article className="card" style={{ padding:12 }}>
          <details open>
            <summary style={{ cursor:'pointer', display:'flex', alignItems:'baseline', gap:8 }}>
              <span className="expand-caret" aria-hidden="true">▾</span>
              <strong>Inter Boys Erg Test Relationships</strong>
            </summary>
            <div className="markdown" style={{ marginTop:8 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{mdContent}</ReactMarkdown>
            </div>
          </details>
        </article>
      </div>
    </section>
  )
}


