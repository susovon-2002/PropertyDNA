import React, { useEffect, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Clock, Home, TrendingUp, User, X, RefreshCw } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || "https://propertydna.onrender.com";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const MicrosoftIcon = () => (
  <svg viewBox="0 0 23 23" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path fill="#f35325" d="M0 0h11v11H0z"/>
    <path fill="#81bc06" d="M12 0h11v11H12z"/>
    <path fill="#05a6f0" d="M0 12h11v11H0z"/>
    <path fill="#ffba08" d="M12 12h11v11H12z"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
  </svg>
);

const DotsGrid = ({ className }) => (
  <svg className={className} width="72" height="48" viewBox="0 0 72 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    {Array.from({ length: 4 }).map((_, r) =>
      Array.from({ length: 6 }).map((_, c) => (
        <circle key={`${r}-${c}`} cx={c * 12 + 6} cy={r * 12 + 6} r="2.5" fill="#a4bdc6" opacity="0.4" />
      ))
    )}
  </svg>
);

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setAuthError('');
      
      // Auto-fill email if remember me was previously checked
      const rememberMeData = localStorage.getItem('property_dna_remember_me');
      if (rememberMeData && activeTab === 'signin') {
        try {
          const data = JSON.parse(rememberMeData);
          if (data.email) {
            setEmail(data.email);
            setRememberMe(true);
          }
        } catch (err) {
          console.error('Failed to parse remember me data:', err);
        }
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError('');

    try {
      const endpoint = activeTab === 'signin' ? '/api/auth/signin' : '/api/auth/signup';
      const body = activeTab === 'signin' 
        ? { email, password } 
        : { name, email, password };

      const response = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }

      // Remember me functionality - persist user session
      if (activeTab === 'signin' && rememberMe) {
        localStorage.setItem('property_dna_remember_me', JSON.stringify({
          email: email,
          timestamp: Date.now()
        }));
      } else {
        localStorage.removeItem('property_dna_remember_me');
      }

      onClose();
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialAuth = (provider) => {
    setAuthError(`${provider} login is not enabled yet. Please sign up with your real name, email, and password.`);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setAuthError('Please enter your email address first.');
      return;
    }

    try {
      const response = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send password reset email');
      }

      alert('Password reset email sent successfully! Please check your email for the reset link.');
    } catch (err) {
      setAuthError(err.message || 'Failed to send password reset email.');
    }
  };

  return (
    <div className="authOverlay" onMouseDown={onClose}>
      <div className="authContainer" onMouseDown={(event) => event.stopPropagation()}>
        <button className="authClose" onClick={onClose} aria-label="Close authentication window">
          <X size={20} />
        </button>

        {/* Left Brand Pane with Full-size Blurred Building Image */}
        <div className="authLeft">
          <img 
            src="/building.jpg" 
            className="authLeftBgImage" 
            alt="PropertyDNA modern building background" 
          />
          <div className="authLeftOverlay"></div>
          
          <DotsGrid className="authDotsLeft" />

          {/* Center Brand and Logo */}
          <div className="authBrandGroup">
            <div className="authLogoWrapper">
              <div className="authLogoCircle">
                <img src="/logo.png" className="authLogoImage" alt="PropertyDNA Logo" />
              </div>
            </div>
            
            <div className="authDivider">
              <span className="dividerLine blueLine"></span>
              <span className="dividerText">Know Your Home's Age and Value</span>
              <span className="dividerLine greenLine"></span>
            </div>

            <h2 className="authSlogan">
              AI-Powered Insights for<br />Smarter <span className="text-green">Property</span> Decisions
            </h2>

            {/* Feature lists */}
            <div className="authFeatures">
              <div className="authFeatureItem">
                <div className="authFeatureIcon clockIcon">
                  <Clock size={20} />
                </div>
                <span>Discover<br />Property Age</span>
              </div>
              <div className="authFeatureItem">
                <div className="authFeatureIcon houseIcon">
                  <Home size={20} />
                </div>
                <span>Estimate<br />Property Value</span>
              </div>
              <div className="authFeatureItem">
                <div className="authFeatureIcon chartIcon">
                  <TrendingUp size={20} />
                </div>
                <span>Make Smarter<br />Investments</span>
              </div>
            </div>
          </div>

          {/* Security Glass Badge at the very bottom of the Left Pane */}
          <div className="authSecurityBadge">
            <div className="authSecurityIcon">
              <ShieldCheck size={20} />
            </div>
            <div className="authSecurityText">
              <h4>Secure. Reliable. Intelligent.</h4>
              <p>Your data is protected with enterprise-grade security.</p>
            </div>
          </div>
        </div>

        {/* Right Form Pane */}
        <div className="authRight">
          <div>
            {/* Centered Sign In / Sign Up Tabs */}
            <div className="authTabs">
              <button 
                type="button" 
                className={`authTab ${activeTab === 'signin' ? 'active' : ''}`} 
                onClick={() => setActiveTab('signin')}
              >
                Sign In
              </button>
              <button 
                type="button" 
                className={`authTab ${activeTab === 'signup' ? 'active' : ''}`} 
                onClick={() => setActiveTab('signup')}
              >
                Sign Up
              </button>
            </div>

            <div className="authHeader">
              <h3>{activeTab === 'signin' ? 'Welcome Back!' : 'Create an Account'}</h3>
              <p>
                {activeTab === 'signin' 
                  ? 'Sign in to access your PropertyDNA account' 
                  : 'Sign up to start analyzing properties'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="authForm">
              {activeTab === 'signup' && (
                <div className="authField">
                  <label htmlFor="auth-name">Full Name</label>
                  <div className="authInputWrapper">
                    <User className="authInputIcon" size={18} />
                    <input 
                      id="auth-name"
                      type="text" 
                      placeholder="Enter your name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      pattern="[A-Za-z][A-Za-z .'-]{1,58}[A-Za-z]"
                      title="Use your first and last name. Letters, spaces, apostrophes, periods, and hyphens only."
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="authField">
                <label htmlFor="auth-email">Email Address</label>
                <div className="authInputWrapper">
                  <Mail className="authInputIcon" size={18} />
                  <input 
                    id="auth-email"
                    type="email" 
                    placeholder="Enter your Gmail address" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    pattern="^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@gmail\.com$"
                    title="Incorrect details provided. Only email addresses ending with @gmail.com are allowed."
                    required 
                  />
                </div>
              </div>

              <div className="authField">
                <label htmlFor="auth-password">Password</label>
                <div className="authInputWrapper">
                  <Lock className="authInputIcon" size={18} />
                  <input 
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Enter your password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    minLength={8}
                    pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}"
                    title="Password must include uppercase, lowercase, number, and special character."
                    required 
                  />
                  <button 
                    type="button" 
                    className="authPasswordToggle" 
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {activeTab === 'signin' && (
                <>
                  <div className="authForgotPasswordWrapper">
                    <a 
                      href="#forgot" 
                      className="authForgotPassword" 
                      onClick={handleForgotPassword}
                    >
                      Forgot Password?
                    </a>
                  </div>
                  <div className="authRememberMeWrapper">
                    <label className="authRememberMe" htmlFor="auth-remember">
                      <input 
                        id="auth-remember"
                        type="checkbox" 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)} 
                      />
                      <span>Remember me</span>
                    </label>
                  </div>
                </>
              )}

              {authError && <div className="authErrorMessage">{authError}</div>}

              <button type="submit" className="authSubmitBtn" disabled={isSubmitting}>
                <span>{isSubmitting ? 'Please wait...' : activeTab === 'signin' ? 'Sign In' : 'Sign Up'}</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="authDividerRow">
              <div className="authDividerLine"></div>
              <span className="authDividerText">or continue with</span>
              <div className="authDividerLine"></div>
            </div>

            {/* Social Logins */}
            <div className="authSocialBtns">
              <button type="button" className="authSocialBtn" onClick={() => handleSocialAuth('Google')}>
                <GoogleIcon />
                <span>{activeTab === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}</span>
              </button>
              <button type="button" className="authSocialBtn" onClick={() => handleSocialAuth('Microsoft')}>
                <MicrosoftIcon />
                <span>{activeTab === 'signin' ? 'Sign in with Microsoft' : 'Sign up with Microsoft'}</span>
              </button>
              <button type="button" className="authSocialBtn" onClick={() => handleSocialAuth('Apple')}>
                <AppleIcon />
                <span>{activeTab === 'signin' ? 'Sign in with Apple' : 'Sign up with Apple'}</span>
              </button>
            </div>
          </div>

          {/* Footer Switching and Encryption */}
          <div className="authFooterLinks">
            <p className="authSwitchPrompt">
              {activeTab === 'signin' ? (
                <>Don't have an account? <button type="button" className="authLinkBtn" onClick={() => setActiveTab('signup')}>Sign Up</button></>
              ) : (
                <>Already have an account? <button type="button" className="authLinkBtn" onClick={() => setActiveTab('signin')}>Sign In</button></>
              )}
            </p>
            <div className="authEncryptionMessage">
              <Lock size={12} />
              <span>Your data is encrypted and secure with us.</span>
            </div>
          </div>

          <DotsGrid className="authDotsRight" />
        </div>
      </div>
    </div>
  );
}
