import React, { useState } from 'react';

import './Dashboard.css';
import Polls from '../features/polls/Polls'; 
import Events from '../features/events/Events';

function Dashboard({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('events'); 

  const renderContent = () => {
    switch (activeTab) {
      case 'events':
        return <Events user={user} />;
      case 'polls':
        return <Polls user={user} />;
      default:
        return <Events user={user} />;
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Night Cricket</h1>
        <p>Welcome, {user.email}!</p>
        <button onClick={onSignOut} className="sign-out-button">Sign Out</button>
      </header>

      <nav className="dashboard-nav">
        <ul>
          <li>
            <button
              onClick={() => setActiveTab('events')}
              className={activeTab === 'events' ? 'active-tab' : ''}
            >
              Events
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('polls')}
              className={activeTab === 'polls' ? 'active-tab' : ''}
            >
              Polls
            </button>
          </li>
        </ul>
      </nav>

      <main className="dashboard-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default Dashboard;
