import React from 'react';

import './Dashboard.css';
import Events from '../features/events/Events';


function Dashboard({ user, onSignOut }) {
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Night Cricket</h1>
        <p>Welcome, {user.email}!</p>
        <button onClick={onSignOut} className="sign-out-button">Sign Out</button>
      </header>

      <nav className="dashboard-nav">
        <ul>
          <li><button>Events</button></li>
          <li><button>Gallery</button></li>
          <li><button>Polls</button></li>
        </ul>
      </nav>

      <main className="dashboard-content">
        <Events user={user} />
      </main>
    </div>
  );
}

export default Dashboard;
