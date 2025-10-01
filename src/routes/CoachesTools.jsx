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
      <div className="card" style={{ marginTop:12 }}>
        <h3 style={{ marginTop:0 }}>Inter Boys Erg Test Relationships</h3>
        <div className="prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{mdContent}</ReactMarkdown>
        </div>
      </div>
    </section>
  )
}


