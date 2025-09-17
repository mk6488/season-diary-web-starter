import React, { useEffect, useState } from 'react'
import { auth } from '../firebase'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { publishErgReport } from '../data/remote'
import { CURRENT_SEASON_ID } from '../data/constants'

function parseTitle(md){
  const first = String(md || '').split(/\r?\n/)[0]
  return first.replace(/^#\s*/, '')
}

export default function ErgReportUpload(){
  const [user, setUser] = useState(null)
  const [date, setDate] = useState('')
  const [markdown, setMarkdown] = useState('')
  const [linkSession, setLinkSession] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  const doSignIn = async () => { await signInWithPopup(auth, new GoogleAuthProvider()) }
  const doSignOut = async () => { await signOut(auth) }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!user) { setMsg('Please sign in first'); return }
    if (!date || !markdown.trim()) { setMsg('Date and markdown are required'); return }
    setBusy(true); setMsg('')
    try{
      await publishErgReport(CURRENT_SEASON_ID, {
        date,
        markdown,
        title: parseTitle(markdown),
      }, { uid: user.uid, email: user.email })
      setMsg('Uploaded ✓')
      setMarkdown('')
    }catch(err){
      setMsg('Upload failed: ' + (err?.message || 'Unknown error'))
    }finally{
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ margin:0 }}>Upload Erg Session Report</h2>
        {user ? (
          <div className="small">{user.email} · UID: <code>{user.uid}</code> <button className="chip" onClick={doSignOut}>Sign out</button></div>
        ) : (
          <button className="chip" onClick={doSignIn}>Sign in with Google</button>
        )}
      </header>

      <form onSubmit={onSubmit} style={{ display:'grid', gap:12, marginTop:12 }}>
        <label className="small">
          Date (YYYY-MM-DD)
          <input type="text" placeholder="2025-09-16" value={date} onChange={(e)=>setDate(e.target.value)} style={{ width:'220px', display:'block', marginTop:6 }} />
        </label>

        <label className="small" style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input type="checkbox" checked={linkSession} onChange={(e)=>setLinkSession(e.target.checked)} />
          Link to matching erg session by date
        </label>

        <label className="small">
          Markdown
          <textarea placeholder="# Erg Session Summary — 16 Sept 2025\n..." value={markdown} onChange={(e)=>setMarkdown(e.target.value)} rows={18} style={{ width:'100%', marginTop:6 }} />
        </label>

        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button disabled={busy || !user} className="chip" type="submit">{busy ? 'Uploading…' : 'Upload'}</button>
          {msg && <span className="small">{msg}</span>}
        </div>
      </form>
    </section>
  )
}


