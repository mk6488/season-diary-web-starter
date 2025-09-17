import React, { useEffect, useMemo, useState } from 'react'
import { auth } from '../firebase'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { renameAthleteId, fetchRemoteSeason } from '../data/remote'
import { CURRENT_SEASON_ID } from '../data/constants'

// Mapping formats accepted (one per line):
// 1) oldId -> newId
// 2) oldId,newId
// 3) oldId,newId,newName (optional display name override)

function parseMapping(text){
  const lines = String(text || '').split(/\r?\n/) 
  const rows = []
  for(const raw of lines){
    const line = raw.trim()
    if (!line) continue
    if (line.includes('->')){
      const [oldId, newId] = line.split('->').map(s=>s.trim())
      if (oldId && newId) rows.push({ oldId, newId })
      continue
    }
    const parts = line.split(',').map(s=>s.trim())
    if (parts.length >= 2){
      rows.push({ oldId: parts[0], newId: parts[1], newName: parts[2] || '' })
    }
  }
  return rows
}

export default function MigrateIds(){
  const [user, setUser] = useState(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState([])
  const [athletes, setAthletes] = useState([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    (async () => {
      try{
        const season = await fetchRemoteSeason(CURRENT_SEASON_ID)
        setAthletes(Array.isArray(season?.athletes) ? season.athletes : [])
      }catch{
        setAthletes([])
      }
    })()
  }, [])

  const rows = useMemo(() => parseMapping(input), [input])
  const currentIds = useMemo(() => new Set(athletes.map(a=>a.id)), [athletes])

  const doSignIn = async () => { await signInWithPopup(auth, new GoogleAuthProvider()) }
  const doSignOut = async () => { await signOut(auth) }

  const run = async () => {
    if (!user) { setLog(l => [...l, { level:'error', msg:'Please sign in first' }]); return }
    if (!rows.length) { setLog(l => [...l, { level:'error', msg:'Provide at least one mapping' }]); return }
    setBusy(true)
    try{
      for (const { oldId, newId, newName } of rows){
        if (!oldId || !newId) { setLog(l => [...l, { level:'error', msg:`Skip: invalid mapping "${oldId}" -> "${newId}"` }]); continue }
        if (!currentIds.has(oldId)) { setLog(l => [...l, { level:'warn', msg:`Skip: oldId not found: ${oldId}` }]); continue }
        try{
          await renameAthleteId(CURRENT_SEASON_ID, oldId, newId, newName, { uid:user.uid, email:user.email })
          setLog(l => [...l, { level:'info', msg:`Renamed ${oldId} → ${newId}${newName?` (${newName})`:''}` }])
          currentIds.delete(oldId); currentIds.add(newId)
        }catch(err){
          setLog(l => [...l, { level:'error', msg:`Failed ${oldId} → ${newId}: ${err?.message || 'Unknown error'}` }])
        }
      }
      setLog(l => [...l, { level:'info', msg:'Done.' }])
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card">
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ margin:0 }}>ID Migration (Coach-only)</h2>
        {user ? (
          <div className="small">{user.email} · UID: <code>{user.uid}</code> <button className="chip" onClick={doSignOut}>Sign out</button></div>
        ) : (
          <button className="chip" onClick={doSignIn}>Sign in with Google</button>
        )}
      </header>

      <div className="small" style={{ marginTop:8 }}>
        Paste mappings (one per line): <code>oldId -&gt; newId</code> or CSV <code>oldId,newId[,newName]</code>.
      </div>

      <textarea
        rows={10}
        value={input}
        onChange={(e)=>setInput(e.target.value)}
        placeholder={"aidanwalker -> IB25001\nAndre Tanaka,IB25002,Andre Tanaka"}
        style={{ width:'100%', marginTop:8 }}
      />

      <div className="card" style={{ marginTop:12 }}>
        <h3 style={{ marginTop:0 }}>Preview</h3>
        {rows.length === 0 ? (
          <p className="small">No mappings parsed yet.</p>
        ) : (
          <ul className="small">
            {rows.map((r,i)=> (
              <li key={i}>
                {r.oldId} → {r.newId}{r.newName?` (${r.newName})`:''}
                {!currentIds.has(r.oldId) && <span style={{ color:'#b91c1c', marginLeft:8 }}>(oldId not found)</span>}
              </li>
            ))}
          </ul>
        )}
        <button className="chip" disabled={busy || !user || rows.length===0} onClick={run}>{busy ? 'Migrating…' : 'Start migration'}</button>
      </div>

      <div className="card" style={{ marginTop:12 }}>
        <h3 style={{ marginTop:0 }}>Log</h3>
        {log.length===0 ? <p className="small">No actions yet.</p> : (
          <ul className="small">
            {log.map((e,i)=> <li key={i} style={{ color: e.level==='error' ? '#b91c1c' : e.level==='warn' ? '#b45309' : 'inherit' }}>{e.msg}</li>)}
          </ul>
        )}
      </div>
    </section>
  )
}


