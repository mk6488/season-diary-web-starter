import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { auth } from '../firebase'
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth'
import Data from './Data.jsx'

export default function Admin(){
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u)=>setUser(u))
    return () => unsub()
  }, [])

  const doSignOut = async () => { await signOut(auth) }
  const onEmailLogin = async (e) => {
    e.preventDefault()
    try{
      await signInWithEmailAndPassword(auth, email, password)
      setEmail(''); setPassword(''); setMsg('')
    }catch(e2){ setMsg(e2?.message || 'Sign-in failed') }
  }

  return (
    <section className="card">
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ margin:0 }}>Admin</h2>
        {user ? (
          <div className="small">{user.email} · UID: <code>{user.uid}</code> <button className="chip" onClick={doSignOut}>Sign out</button></div>
        ) : (
          <form onSubmit={onEmailLogin} style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <input required placeholder="Coach email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <input required type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
            <button className="chip" type="submit">Sign in</button>
          </form>
        )}
      </header>

      {!user ? (
        <p className="small" style={{ marginTop:12 }}>Sign in to access coach tools.</p>
      ) : (
        <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:12, marginTop:12 }}>
          <div className="card" style={{ margin:0 }}>
            <h3 style={{ marginTop:0 }}>Erg Sessions</h3>
            <p className="small">Upload new erg sessions as markdown.</p>
            <Link className="chip" to="/erg-sessions/upload">Open uploader</Link>
          </div>
          <div className="card" style={{ margin:0 }}>
            <h3 style={{ marginTop:0 }}>Erg Reports</h3>
            <p className="small">Upload session reports; auto-links by date.</p>
            <Link className="chip" to="/erg-reports/upload">Open uploader</Link>
          </div>
        </div>

      )}
      {user && (
        <div className="card" style={{ marginTop:'12px', padding:12 }}>
          <h3 style={{ marginTop:0 }}>Data Manager</h3>
          <p className="small">Download current JSON, upload and publish season data.</p>
          <div className="small" style={{ marginTop:8 }}>
            <Data />
          </div>
        </div>
      )}
      {msg && <p className="small" style={{ color:'#b91c1c', marginTop:'8px' }}>{msg}</p>}
    </section>
  )
}


