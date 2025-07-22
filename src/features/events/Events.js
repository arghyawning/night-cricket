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

import './Events.css';

function Events({ user }) {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const q = query(collection(db, 'events'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const dateTimeString = `${eventDate}T${eventTime}`;
      const dateTimestamp = Timestamp.fromDate(new Date(dateTimeString));

      await addDoc(collection(db, 'events'), {
        name: eventName,
        date: dateTimestamp,
        location: eventLocation,
        description: eventDescription,
        organizerId: user.uid,
        organizerEmail: user.email,
        rsvps: [],
        createdAt: Timestamp.now()
      });

      setEventName('');
      setEventDate('');
      setEventTime('');
      setEventLocation('');
      setEventDescription('');
      setShowForm(false);
      await fetchEvents();
      alert('Event created successfully!');
    } catch (error) {
      console.error("Error creating event:", error);
      alert('Failed to create event. See console for details.');
    }
  };

  const handleRsvp = async (eventId, type) => {
    const eventRef = doc(db, 'events', eventId);
    const userId = user.uid;
    const userEmail = user.email;

    try {
      const currentEvent = events.find(e => e.id === eventId);
      const currentRsvps = currentEvent.rsvps || [];

      const rsvpToRemove = currentRsvps.find(rsvp => rsvp.userId === userId);
      if (rsvpToRemove) {
        await updateDoc(eventRef, {
          rsvps: arrayRemove(rsvpToRemove)
        });
      }

      if (type !== 'cancel') {
        await updateDoc(eventRef, {
          rsvps: arrayUnion({ userId, userEmail, type, timestamp: Timestamp.now() })
        });
      }

      await fetchEvents();
      console.log(`RSVP ${type} for event ${eventId} by ${userEmail}`);

    } catch (error) {
      console.error(`Error updating RSVP for event ${eventId}:`, error);
      alert('Failed to update RSVP. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId, eventName) => {
    if (window.confirm(`Are you sure you want to delete the event "${eventName}"? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
        await fetchEvents();
        alert(`Event "${eventName}" deleted successfully.`);
      } catch (error) {
        console.error(`Error deleting event ${eventId}:`, error);
        alert('Failed to delete event. See console for details.');
      }
    }
  };

  const formatFirebaseTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleString(undefined, options);
  };

  return (
    <div className="events-container">
      <h2>Events</h2>

      <button onClick={() => setShowForm(!showForm)} className="create-event-toggle-btn">
        {showForm ? 'Hide Event Form' : 'Create New Event'}
      </button>

      {showForm && (
        <form onSubmit={handleCreateEvent} className="event-form">
          <h3>Create New Event</h3>
          <div className="form-group">
            <label>Event Name:</label>
            <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Date:</label>
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Time:</label>
            <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Location:</label>
            <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Description (optional):</label>
            <textarea value={eventDescription} onChange={(e) => setEventDescription(e.target.value)}></textarea>
          </div>
          <button type="submit">Add Event</button>
        </form>
      )}

      <h3>Upcoming/Past Events</h3>
      {loadingEvents ? (
        <p>Loading events...</p>
      ) : events.length === 0 ? (
        <p>No events found. Be the first to create one!</p>
      ) : (
        <ul className="event-list">
          {events.map(event => {
            const userRsvp = event.rsvps?.find(rsvp => rsvp.userId === user.uid)?.type;
            const goingCount = event.rsvps?.filter(rsvp => rsvp.type === 'going').length || 0;
            const maybeCount = event.rsvps?.filter(rsvp => rsvp.type === 'maybe').length || 0;
            const notGoingCount = event.rsvps?.filter(rsvp => rsvp.type === 'not-going').length || 0;

            const isOrganizer = user.uid === event.organizerId;

            return (
              <li key={event.id} className="event-item">
                <div className="event-header-row">
                    <h4>{event.name}</h4>
                    {isOrganizer && (
                        <button
                            onClick={() => handleDeleteEvent(event.id, event.name)}
                            className="delete-event-button"
                        >
                            Delete
                        </button>
                    )}
                </div>

                <p><strong>When:</strong> {formatFirebaseTimestamp(event.date)}</p>
                <p><strong>Where:</strong> {event.location}</p>
                {event.description && <p><strong>Details:</strong> {event.description}</p>}
                <p><strong>Organizer:</strong> {event.organizerEmail}</p>

                <div className="rsvps-section">
                  <p>
                    <span className="rsvp-count going">Going: {goingCount}</span> |
                    <span className="rsvp-count maybe"> Maybe: {maybeCount}</span> |
                    <span className="rsvp-count not-going"> Not Going: {notGoingCount}</span>
                  </p>

                  <div className="rsvp-actions">
                    <button
                      onClick={() => handleRsvp(event.id, 'going')}
                      className={`rsvp-button ${userRsvp === 'going' ? 'active' : ''}`}
                    >
                      {userRsvp === 'going' ? '✅ Going' : 'Going'}
                    </button>
                    <button
                      onClick={() => handleRsvp(event.id, 'maybe')}
                      className={`rsvp-button ${userRsvp === 'maybe' ? 'active' : ''}`}
                    >
                      {userRsvp === 'maybe' ? '🤔 Maybe' : 'Maybe'}
                    </button>
                    <button
                      onClick={() => handleRsvp(event.id, 'not-going')}
                      className={`rsvp-button ${userRsvp === 'not-going' ? 'active' : ''}`}
                    >
                      {userRsvp === 'not-going' ? '❌ Not Going' : 'Not Going'}
                    </button>
                    {userRsvp && (
                      <button
                        onClick={() => handleRsvp(event.id, 'cancel')}
                        className="rsvp-button cancel-rsvp"
                      >
                        Cancel RSVP
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Events;
