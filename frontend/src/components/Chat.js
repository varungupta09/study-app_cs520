import React, { useState, useEffect } from 'react';
import './Chat.css'; 

const Chat = ({ studySetId, userId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch chat messages when the component mounts or when the studySetId changes
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/chats/${studySetId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      console.log('Fetched messages:', data);
      if (data && Array.isArray(data)) {
        setMessages(data);
      } else {
        console.log('Received invalid data format:', data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
    setLoading(false);
  };

  // UseEffect to fetch messages initially or when the studySetId changes
  useEffect(() => {
    fetchMessages();
  }, [studySetId]); // Depend on studySetId

  // Handle the message input change
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };

  // Send new message to the backend
  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return; // Prevent sending empty messages

    const messageData = {
      studySetId,
      userId,
      message: newMessage,
    };

    try {
      const response = await fetch(`http://localhost:5001/api/chats/${studySetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage = await response.json();
      console.log('New message added:', newMessage);

      // Refetch messages to reflect the newly added message
      fetchMessages();

      setNewMessage(''); // Reset input field after sending
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-container">
      {/* Add header with "Study Set Chat" */}
      <header className="chat-header">
        <h1>Study Set Chat</h1>
      </header>
      
      <div className="messages">
        {loading ? (
          <p>Loading messages...</p>
        ) : (
          messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.id} className="message">
                <strong>{message.username}</strong>: {message.message}
              </div>
            ))
          ) : (
            <p>No messages yet</p>
          )
        )}
      </div>

      <form onSubmit={sendMessage}>
        <input
          type="text"
          placeholder="Type your message"
          value={newMessage}
          onChange={handleMessageChange}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default Chat;
