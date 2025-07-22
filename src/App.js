import React from 'react';
import Auth from './components/Auth'; // Import the Auth component
import './App.css'; // Or remove if not using it for App component itself

function App() {
  return (
    <div className="App">
      <Auth /> {/* Render our Auth component here */}
    </div>
  );
}

export default App;
