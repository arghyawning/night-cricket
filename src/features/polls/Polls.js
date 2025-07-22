import { db } from '../../firebaseConfig';
import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore';

import './Polls.css';

function Polls({ user }) {
  const [polls, setPolls] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState('');
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [error, setError] = useState('');

  const fetchPolls = async () => {
    setLoadingPolls(true);
    try {
      const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const pollsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPolls(pollsData);
    } catch (err) {
      console.error("Error fetching polls:", err);
      setError("Failed to load polls. Please try again.");
    } finally {
      setLoadingPolls(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    setError('');

    const optionsArray = pollOptions.split(',').map(opt => opt.trim()).filter(opt => opt !== '');

    if (!pollQuestion || optionsArray.length < 2) {
      setError('Please provide a question and at least two comma-separated options.');
      return;
    }

    try {
      await addDoc(collection(db, 'polls'), {
        question: pollQuestion,
        options: optionsArray.map(option => ({ name: option, votes: 0 })),
        createdBy: user.email,
        creatorId: user.uid,
        userVotes: [],
        createdAt: Timestamp.now()
      });

      setPollQuestion('');
      setPollOptions('');
      setShowForm(false);
      await fetchPolls();
      alert('Poll created successfully!');
    } catch (err) {
      console.error("Error creating poll:", err);
      setError('Failed to create poll. See console for details.');
    }
  };

  // --- NEW handleVote Logic for changing votes ---
  const handleVote = async (pollId, newOptionName) => {
    const pollRef = doc(db, 'polls', pollId);
    const userId = user.uid;

    try {
      const currentPoll = polls.find(p => p.id === pollId);
      if (!currentPoll) return;

      const currentUserVote = currentPoll.userVotes?.find(vote => vote.userId === userId);
      let updatedOptions = [...currentPoll.options];

      if (currentUserVote) {
        if (currentUserVote.optionName === newOptionName) {
            return;
        }
        updatedOptions = updatedOptions.map(option =>
          option.name === currentUserVote.optionName ? { ...option, votes: option.votes - 1 } : option
        );
      }

      updatedOptions = updatedOptions.map(option =>
        option.name === newOptionName ? { ...option, votes: option.votes + 1 } : option
      );

      if (currentUserVote) {
          await updateDoc(pollRef, {
              userVotes: arrayRemove(currentUserVote)
          });
      }
      await updateDoc(pollRef, {
        options: updatedOptions,
        userVotes: arrayUnion({ userId, optionName: newOptionName }) // Store the specific vote
      });

      await fetchPolls();
      console.log(`User ${user.email} voted for ${newOptionName} in poll ${pollId}`);
    } catch (err) {
      console.error(`Error voting on poll ${pollId}:`, err);
      alert('Failed to cast vote. Please try again.');
    }
  };

  const handleDeletePoll = async (pollId, pollQuestion) => {
    if (window.confirm(`Are you sure you want to delete the poll "${pollQuestion}"? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'polls', pollId));
        await fetchPolls();
        alert(`Poll "${pollQuestion}" deleted successfully.`);
      } catch (error) {
        console.error(`Error deleting poll ${pollId}:`, error);
        alert('Failed to delete poll. See console for details.');
      }
    }
  };

  return (
    <div className="polls-container">
      <h2>Polls</h2>

      <button onClick={() => setShowForm(!showForm)} className="create-poll-toggle-btn">
        {showForm ? 'Hide Poll Form' : 'Create New Poll'}
      </button>

      {showForm && (
        <form onSubmit={handleCreatePoll} className="poll-form">
          <h3>Create New Poll</h3>
          <div className="form-group">
            <label>Question:</label>
            <input type="text" value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Options (comma-separated):</label>
            <input
              type="text"
              value={pollOptions}
              onChange={(e) => setPollOptions(e.target.value)}
              placeholder="Option 1, Option 2, Another option"
              required
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit">Add Poll</button>
        </form>
      )}

      <h3>Active Polls</h3>
      {loadingPolls ? (
        <p>Loading polls...</p>
      ) : polls.length === 0 ? (
        <p>No polls found. Be the first to create one!</p>
      ) : (
        <ul className="poll-list">
          {polls.map(poll => {
            const currentUserVote = poll.userVotes?.find(vote => vote.userId === user.uid);
            const userSelectedOption = currentUserVote ? currentUserVote.optionName : null;

            const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
            const isCreator = user.uid === poll.creatorId;

            return (
              <li key={poll.id} className="poll-item">
                <div className="poll-header-row">
                  <h4>{poll.question}</h4>
                  {isCreator && (
                    <button
                      onClick={() => handleDeletePoll(poll.id, poll.question)}
                      className="delete-poll-button"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <p className="poll-meta">Created by: {poll.createdBy} - {poll.createdAt?.toDate().toLocaleString()}</p>
                <p className="poll-total-votes">Total Votes: {totalVotes}</p>

                <div className="poll-options">
                  {poll.options.map(option => (
                    <div key={option.name} className="poll-option-item">
                      <button
                        onClick={() => handleVote(poll.id, option.name)}
                        className={`vote-button ${userSelectedOption === option.name ? 'selected-vote' : ''}`}
                      >
                        {userSelectedOption === option.name ? '✅ ' : ''}
                        {option.name}
                      </button>
                      <span className="vote-count">{option.votes} votes</span>
                      {totalVotes > 0 && (
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar"
                            style={{ width: `${(option.votes / totalVotes) * 100}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {userSelectedOption && (
                  <p className="voted-message">
                    You voted for: <strong>{userSelectedOption}</strong>. Click another option to change your vote.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Polls;
