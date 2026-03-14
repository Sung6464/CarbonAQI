import { useState, useEffect } from 'react'
import './App.css'
import CarbonIQWireframe from './carboniq-wireframe.jsx'
import AuthScreen from './AuthScreen.jsx'
import { auth } from './firebase.js'
import { onAuthStateChanged } from 'firebase/auth'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return <div style={{ height: "100vh", background: "#0A110A", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B8F6B" }}>Loading CarbonIQ...</div>
  }

  return (
    <>
      {user ? <CarbonIQWireframe user={user} /> : <AuthScreen />}
    </>
  )
}

export default App
