import { useState } from 'react';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { useTheme } from './ThemeContext.jsx';
import { api } from './api.js';

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
  const { colors } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loginType, setLoginType] = useState('individual'); // 'individual' or 'company'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Check account type for existing users
        const userInfo = await api.getDashboard(userCredential.user.uid);
        if (userInfo.account_type && userInfo.account_type !== loginType) {
          await auth.signOut();
          if (loginType === 'company' && userInfo.account_type === 'individual') {
            setError("Invalid ID");
          } else {
            setError(`This account is registered as ${userInfo.account_type === 'company' ? 'a company account' : 'an individual account'}. Please use the correct login type.`);
          }
          setLoading(false);
          return;
        }
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await api.updateProfile({ account_type: loginType });
      }
      onAuthSuccess && onAuthSuccess(loginType);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/invalid-credential") setError("Incorrect email or password.");
      else if (err.code === "auth/email-already-in-use") setError("An account with this email already exists.");
      else if (err.code === "auth/weak-password") setError("Password must be at least 6 characters.");
      else setError(err.message || "An error occurred. Please try again.");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const additionalUserInfo = getAdditionalUserInfo(userCredential);

      if (additionalUserInfo?.isNewUser) {
        await api.updateProfile({ account_type: loginType });
      } else {
        const userInfo = await api.getDashboard(userCredential.user.uid);
        if (userInfo.account_type && userInfo.account_type !== loginType) {
          await auth.signOut();
          if (loginType === 'company' && userInfo.account_type === 'individual') {
            setError("Invalid ID");
          } else {
            setError(`This account is registered as ${userInfo.account_type === 'company' ? 'a company account' : 'an individual account'}. Please use the correct login type.`);
          }
          setLoading(false);
          return;
        }
      }

      onAuthSuccess && onAuthSuccess(loginType);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google.");
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
        background: colors.bg, borderRadius: 32,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
        display: "flex", flexDirection: "column"
      }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌿</div>
          <h1 style={{ fontSize: 28, color: colors.white, margin: 0, fontWeight: 800, letterSpacing: -1 }}>CarbonIQ</h1>
          <p style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>
            {loginType === 'company' ? 'Create or manage a team workspace.' : 'Track your footprint. Build your streak.'}
          </p>
          
          {/* Login Type Selector */}
          <div style={{ display: "flex", gap: 8, marginTop: 20, justifyContent: "center" }}>
            <button
              type="button"
              onClick={() => setLoginType('individual')}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: `1px solid ${loginType === 'individual' ? colors.accent : colors.border}`,
                background: loginType === 'individual' ? '#1A3A1A' : colors.card,
                color: loginType === 'individual' ? colors.accent : colors.muted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              👤 Individual
            </button>
            <button
              type="button"
              onClick={() => setLoginType('company')}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: `1px solid ${loginType === 'company' ? colors.accent : colors.border}`,
                background: loginType === 'company' ? '#1A3A1A' : colors.card,
                color: loginType === 'company' ? colors.accent : colors.muted,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              🏢 Company
            </button>
          </div>
        </div>

        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {error && (
            <div style={{ padding: "12px", background: "#3A1A1A", border: `1px solid ${colors.red}`, borderRadius: 12, color: "#FF9999", fontSize: 12, textAlign: "center" }}>
              {error}
            </div>
          )}
          
          <div>
            <label style={{ fontSize: 11, color: colors.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Email</label>
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
            <label style={{ fontSize: 11, color: colors.muted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 12, boxSizing: "border-box",
                background: colors.card, border: `1px solid ${colors.border}`, color: colors.white,
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
              background: colors.accent, border: "none", color: colors.bg,
              fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Authenticating..." : (
              isLogin
                ? (loginType === 'company' ? "Sign In as Company" : "Sign In")
                : (loginType === 'company' ? "Create Company Account" : "Create Account")
            )}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
            <div style={{ flex: 1, height: 1, background: colors.border }} />
            <div style={{ fontSize: 11, color: colors.muted }}>or</div>
            <div style={{ flex: 1, height: 1, background: colors.border }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, marginTop: 14,
              background: "#4285F4", border: "none", color: "#FFFFFF",
              fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 0.2,
              opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10
            }}
          >
            <span style={{ fontSize: 18 }}>🟦</span>
            Continue with Google
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{ 
              background: "none", border: "none", color: colors.muted, 
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
