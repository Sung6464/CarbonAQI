import { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const COLORS = {
  bg: "#0F1A0F",
  card: "#162016",
  border: "#2A3D2A",
  accent: "#4EE878",
  muted: "#6B8F6B",
  white: "#E8F5E8",
  red: "#E05555",
};

export default function AuthScreen({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // Assuming parent handles onAuthStateChanged naturally, but trigger explicitly just in case
      onAuthSuccess && onAuthSuccess();
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential") setError("Incorrect email or password.");
      else if (err.code === "auth/email-already-in-use") setError("An account with this email already exists.");
      else if (err.code === "auth/weak-password") setError("Password must be at least 6 characters.");
      else setError(err.message || "An error occurred. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0A110A",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Georgia', serif", padding: "24px"
    }}>
      <div style={{
        width: "100%", maxWidth: 375, padding: "40px 24px",
        background: COLORS.bg, borderRadius: 32,
        border: `1px solid ${COLORS.border}`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
        display: "flex", flexDirection: "column"
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
          <h1 style={{ fontSize: 28, color: COLORS.white, margin: 0, fontWeight: 800, letterSpacing: -1 }}>CarbonIQ</h1>
          <p style={{ color: COLORS.muted, fontSize: 13, marginTop: 8 }}>Track your footprint. Build your streak.</p>
        </div>

        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ padding: "12px", background: "#3A1A1A", border: `1px solid ${COLORS.red}`, borderRadius: 12, color: "#FF9999", fontSize: 12, textAlign: "center" }}>
              {error}
            </div>
          )}
          
          <div>
            <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12, boxSizing: "border-box",
                background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.white,
                fontFamily: "inherit", fontSize: 14
              }}
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: COLORS.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12, boxSizing: "border-box",
                background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.white,
                fontFamily: "inherit", fontSize: 14
              }}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: "100%", padding: "16px", borderRadius: 14, marginTop: 12,
              background: COLORS.accent, border: "none", color: COLORS.bg,
              fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{ 
              background: "none", border: "none", color: COLORS.muted, 
              fontSize: 13, cursor: "pointer", textDecoration: "underline",
              padding: "8px"
            }}
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
