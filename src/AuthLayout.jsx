import React from 'react';
import { Link } from 'react-router-dom';
import './auth.css';

const iconPaths = {
  chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8 8 0 0 1-3.5-.8L4 20l1.3-4A7.5 7.5 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8 12h.01M12 12h.01M16 12h.01" /></>,
  question: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9a2.5 2.5 0 1 1 4.3 1.7c-1.2 1.2-1.9 1.5-1.9 3" /><path d="M12 17h.01" /></>,
  users: <><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="8" r="3.5" /><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.4M16 4.7a3.5 3.5 0 0 1 0 6.6" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-1a7 7 0 0 1 14 0v1z" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
};

export function AuthIcon({ name, size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

export function AuthField({ label, icon, inputRef, ...inputProps }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap">
        <AuthIcon name={icon} size={17} />
        <input ref={inputRef} {...inputProps} />
      </span>
    </label>
  );
}

export function PasswordField({ label = 'Password', inputRef, placeholder = 'Enter your password', autoComplete = 'current-password' }) {
  const [visible, setVisible] = React.useState(false);
  return (
    <label className="auth-field">
      <span>{label}</span>
      <span className="auth-input-wrap">
        <AuthIcon name="lock" size={17} />
        <input ref={inputRef} type={visible ? 'text' : 'password'} placeholder={placeholder} autoComplete={autoComplete} required />
        <button className="password-visibility" type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Hide password' : 'Show password'}>
          <AuthIcon name="eye" size={17} />
        </button>
      </span>
    </label>
  );
}

export function GoogleButton({ children }) {
  return (
    <button className="google-button" type="button" disabled title="Google sign-in is not configured for this app">
      <span className="google-mark" aria-hidden="true">G</span>
      {children}
    </button>
  );
}

function BrandMark() {
  return <span className="auth-brand-mark"><span>•••</span></span>;
}

export function CommunityIllustration() {
  return (
    <svg className="community-illustration" viewBox="0 0 340 230" role="img" aria-label="Friends chatting and learning together">
      <defs>
        <linearGradient id="desk" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#8ecbff" /><stop offset="1" stopColor="#4168f5" /></linearGradient>
        <linearGradient id="shirt" x1="0" x2="1"><stop stopColor="#1785ff" /><stop offset="1" stopColor="#1450cf" /></linearGradient>
      </defs>
      <ellipse cx="170" cy="207" rx="160" ry="16" fill="#1838bd" opacity=".22" />
      <path d="M20 143c14-18 44-24 68-14 22 9 34 29 59 27 25-2 45-24 75-19 31 5 53 30 98 21v56H20Z" fill="url(#desk)" />
      <path d="M133 157h80l19 49h-119Z" fill="#122b62" />
      <path d="M144 160h58l9 34h-76Z" fill="#263d83" />
      <circle cx="173" cy="181" r="3" fill="#78a9ff" />
      <path d="M35 108c3-24 19-40 38-40 20 0 32 19 31 42l-7 38H29Z" fill="#ffae62" />
      <path d="M38 109c-4-23 7-43 28-45 22-2 37 16 37 39-10-4-18-12-22-22-8 13-24 20-43 18Z" fill="#17294e" />
      <ellipse cx="69" cy="107" rx="20" ry="24" fill="#e99b72" />
      <path d="M51 101c5-3 9-7 12-12 8 9 17 13 27 13 0-17-9-29-24-29-13 0-22 10-22 26Z" fill="#17294e" />
      <circle cx="62" cy="108" r="1.5" fill="#26345c" /><circle cx="76" cy="108" r="1.5" fill="#26345c" />
      <path d="M44 132c-18 7-25 24-29 53h69l-9-46Z" fill="url(#shirt)" />
      <path d="M270 104c0-23 13-38 32-38s31 15 31 40l-7 41h-54Z" fill="#174c90" />
      <ellipse cx="300" cy="105" rx="19" ry="23" fill="#94573f" />
      <path d="M281 102c0-20 8-34 23-34 16 0 27 11 27 34-10-1-19-7-25-16-5 8-14 14-25 16Z" fill="#171f36" />
      <path d="M277 132c-18 4-27 20-30 53h86l-7-40-21-12Z" fill="#14a7a4" />
      <path d="M125 117c0-27 15-46 39-46s40 19 40 47l-7 45h-67Z" fill="#f2a35f" />
      <ellipse cx="164" cy="110" rx="24" ry="28" fill="#d98761" />
      <path d="M139 103c0-27 13-42 33-42 18 0 31 15 31 40-13-3-23-10-31-21-7 12-18 20-33 23Z" fill="#20253c" />
      <circle cx="156" cy="111" r="1.7" fill="#302848" /><circle cx="173" cy="111" r="1.7" fill="#302848" />
      <path d="M158 122c5 4 11 4 15 0" fill="none" stroke="#8b3e47" strokeWidth="2" strokeLinecap="round" />
      <path d="M135 145c12-9 46-11 60 0l16 50h-91Z" fill="#ffb32e" />
      <path d="M89 167c17-12 29-15 40-11l13 10-18 8-19 19Z" fill="#e99b72" />
      <path d="M206 164c20-15 34-18 47-10l11 9-22 10-20 17Z" fill="#e99b72" />
      <rect x="16" y="27" width="62" height="39" rx="17" fill="#fff" />
      <path d="m39 63-5 12 16-9" fill="#fff" />
      <circle cx="36" cy="47" r="3" fill="#3887ff" /><circle cx="47" cy="47" r="3" fill="#3887ff" /><circle cx="58" cy="47" r="3" fill="#3887ff" />
      <rect x="250" y="22" width="70" height="43" rx="18" fill="#fff" />
      <path d="m284 62 8 11-1-13" fill="#fff" />
      <circle cx="272" cy="43" r="3" fill="#3887ff" /><circle cx="284" cy="43" r="3" fill="#3887ff" /><circle cx="296" cy="43" r="3" fill="#3887ff" />
      <circle cx="169" cy="34" r="19" fill="#ffd45a" opacity=".2" />
      <path d="M169 17c-9 0-14 7-14 14 0 6 4 10 8 13v5h12v-5c4-3 8-8 8-14 0-7-6-13-14-13Z" fill="#ffd34f" />
      <path d="M163 53h12M165 58h8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M168 8V2m-17 8-4-4m39 4 4-4" stroke="#ffd34f" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export default function AuthLayout({ mode, children }) {
  const isRegister = mode === 'register';
  return (
    <main className="auth-page">
      <section className={`auth-card${isRegister ? ' auth-register' : ' auth-login'}`}>
        <aside className="auth-aside">
          <Link to="/login" className="auth-brand">
            <BrandMark />
            <span><strong>ChatQ</strong><small>Ask · Learn · Together</small></span>
          </Link>
          <div className="auth-aside-copy">
            <h1>{isRegister ? 'Join ChatQ' : 'Welcome Back'}</h1>
            <p>{isRegister ? 'Get access to a community where you can ask questions, share ideas, and learn together in real-time.' : 'Log in to continue your conversation, access your saved questions, and be part of our growing community.'}</p>
          </div>
          <ul className="auth-features">
            <li><span><AuthIcon name="chat" /></span><div><strong>Real-time Chat</strong><small>Talk with others instantly</small></div></li>
            <li><span><AuthIcon name="question" /></span><div><strong>Q&amp;A Platform</strong><small>Get answers to your questions</small></div></li>
            <li><span><AuthIcon name="users" /></span><div><strong>Learn Together</strong><small>Share knowledge &amp; grow</small></div></li>
          </ul>
          <CommunityIllustration />
          <p className="auth-tagline">Better Questions.<br />Brighter Ideas.</p>
        </aside>

        <section className="auth-content">
          <div className="auth-top-link">
            <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Log in' : 'Sign up'}</Link>
          </div>
          <div className="auth-form-content">{children}</div>
        </section>
      </section>
    </main>
  );
}
