import React, { useEffect, useState } from 'react'
import { auth } from '../firebase'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { publishErgSession } from '../data/remote'
import { CURRENT_SEASON_ID } from '../data/constants'

function parseTitle(md){
  const first = String(md || '').split(/\r?\n/)[0]
  return first.replace(/^#\s*/, '')
}

export default function ErgUpload(){
  const [user, setUser] = useState(null)
  const [date, setDate] = useState('') // YYYY-MM-DD
  const [markdown, setMarkdown] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  const doSignIn = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const doSignOut = async () => { await signOut(auth) }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!user) { setMsg('Please sign in first'); return }
    if (!date || !markdown.trim()) { setMsg('Date and markdown are required'); return }
    setBusy(true); setMsg('')
    try{
      await publishErgSession(CURRENT_SEASON_ID, {
        date,
        markdown,
        title: parseTitle(markdown),
      }, { uid: user.uid, email: user.email })
      setMsg('Uploaded ✓')
      setMarkdown('')
    }catch(err){
      setMsg('Upload failed')
    }finally{
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ margin:0 }}>Upload Erg Session</h2>
        {user ? (
          <div className="small">{user.email} <button className="chip" onClick={doSignOut}>Sign out</button></div>
        ) : (
          <button className="chip" onClick={doSignIn}>Sign in with Google</button>
        )}
      </header>

      <form onSubmit={onSubmit} style={{ display:'grid', gap:12, marginTop:12 }}>
        <label className="small">
          Date (YYYY-MM-DD)
          <input
            type="text"
            placeholder="2025-09-16"
            value={date}
            onChange={(e)=>setDate(e.target.value)}
            style={{ width:'220px', display:'block', marginTop:6 }}
          />
        </label>

        <label className="small" style={{ display:'block' }}>
          Markdown
          <textarea
            placeholder="# Erg Session – Tuesday, 9th September 2025\n..."
            value={markdown}
            onChange={(e)=>setMarkdown(e.target.value)}
            rows={18}
            style={{ width:'100%', marginTop:6 }}
          />
        </label>

        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button disabled={busy || !user} className="chip" type="submit">{busy ? 'Uploading…' : 'Upload'}</button>
          {msg && <span className="small">{msg}</span>}
        </div>
      </form>

      <p className="small" style={{ marginTop:12 }}>
        Tip: keep the H1 starting with <code># Erg Session –</code>. The list uses it for title/date parsing.
      </p>
    </section>
  )
}


