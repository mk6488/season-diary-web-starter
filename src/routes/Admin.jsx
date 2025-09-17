import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { auth } from '../firebase'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'

export default function Admin(){
  const [user, setUser] = useState(null)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u)=>setUser(u))
    return () => unsub()
  }, [])

  const doSignIn = async () => { await signInWithPopup(auth, new GoogleAuthProvider()) }
  const doSignOut = async () => { await signOut(auth) }

  return (
    <section className="card">
      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h2 style={{ margin:0 }}>Admin</h2>
        {user ? (
          <div className="small">{user.email} · UID: <code>{user.uid}</code> <button className="chip" onClick={doSignOut}>Sign out</button></div>
        ) : (
          <button className="chip" onClick={doSignIn}>Sign in with Google</button>
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
          <div className="card" style={{ margin:0 }}>
            <h3 style={{ marginTop:0 }}>Data Manager</h3>
            <p className="small">Download current JSON, upload and publish season data.</p>
            <Link className="chip" to="/data">Open data tools</Link>
          </div>
        </div>
      )}
    </section>
  )
}


