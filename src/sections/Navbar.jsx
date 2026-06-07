export default function Navbar({ onSignInClick, user, onSignOutClick }) {
  return (
    <header className="topbar">
      <a className="brand" href="#home" aria-label="PropertyDNA">
        <img src="/logo.png" alt="PropertyDNA Logo" className="brandLogo" />
        <span className="brandName">Property<b>DNA</b></span>
      </a>
      <nav aria-label="Main navigation">
        <a className="active" href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#works">How It Works</a>
        <a href="#contact">Contact</a>
      </nav>
      {user ? (
        <div className="navUserSection">
          <a href="/dashboard" target="_blank" rel="noopener noreferrer" className="userGreeting" style={{ textDecoration: 'none', cursor: 'pointer', color: 'inherit' }} title="Go to Dashboard">
            Hi, <b style={{ color: '#16a34a' }}>{user.name.split(' ')[0]}</b>
          </a>
          <a href="/dashboard" target="_blank" rel="noopener noreferrer" className="signInBtn" style={{ textDecoration: 'none', marginLeft: '12px', marginRight: '8px', padding: '10px 16px' }}>
            Dashboard
          </a>
          <button className="signInBtn" onClick={onSignOutClick}>Sign Out</button>
        </div>
      ) : (
        <button className="signInBtn" onClick={onSignInClick}>Sign In</button>
      )}
      <a className="try" href="#predictor">Try Predictor</a>
    </header>
  );
}
