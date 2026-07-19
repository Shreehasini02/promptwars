export default function Navbar({ user, onSignInClick, onLogoClick, onLogout }) {
  return (
    <nav className="navbar">
      <div className="logo-container" id="logo-btn" onClick={onLogoClick}>
        <div className="logo-icon">✈</div>
        <span className="logo-text">travelcopilot</span>
      </div>

      <div className="nav-links">
        <a href="#">Stays</a>
        <a href="#">Flights</a>
        <a href="#">Itineraries</a>
        <a href="#">Guides</a>
      </div>

      {user ? (
        <div className="user-badge">
          <div className="user-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="user-name">{user.name}</span>
          <button className="logout-btn" onClick={onLogout}>Sign out</button>
        </div>
      ) : (
        <button className="sign-in-btn" id="sign-in-btn" onClick={onSignInClick}>
          Sign in
        </button>
      )}
    </nav>
  )
}
