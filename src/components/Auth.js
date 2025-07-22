import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effect to check authentication state on component mount
  useEffect(() => {
    // onAuthStateChanged returns an unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // currentUser will be null if no user is logged in
      setLoading(false);    // Authentication state has been checked
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true); // Show loading state during login attempt
      await signInWithEmailAndPassword(auth, email, password);
      // setUser will be updated by the onAuthStateChanged listener
      // No need to set user directly here.
    } catch (error) {
      setError(error.message);
      console.error('Login error:', error);
      setLoading(false); // Reset loading state if login fails
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // setUser will be updated to null by the onAuthStateChanged listener
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <p>Loading user session...</p>
      </div>
    );
  }

  // If user is logged in, show their email; otherwise, show the form
  return (
    <div className="auth-container">
      {user ? (
        <div className="welcome-message">
          <h2>Welcome, {user.email}!</h2>
          <p>You are logged in to Night Cricket.</p>
          <div className="main-app-content">
            <p>Ready to manage events, share photos, and create polls!</p>
          </div>
          <button onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="login-form">
          <h2>Night Cricket Login</h2>
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}
    </div>
  );
}

export default Auth;
