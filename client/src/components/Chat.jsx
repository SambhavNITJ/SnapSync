import React, { useState, useEffect } from 'react';
import { useSocket } from '../providers/Socket';
import Picker from 'emoji-picker-react';

function Chat({ email, room }) {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);


  const sendMessage = () => {
    if (newMessage.trim() === "") return;
    const timestamp = new Date().toISOString();
    socket.emit('chat-message', { room, email, message: newMessage, timestamp });
    setNewMessage("");
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Handler for emoji selection
  const onEmojiClick = (emojiData) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      console.log("Received message:", data);
      setMessages((prev) => [...prev, data]);
    };

    socket.on('chat-message', handleMessage);
    return () => {
      socket.off('chat-message', handleMessage);
    };
  }, [socket]);

  return (
    <div className="h-full flex flex-col p-2 bg-gray-100 border rounded-lg shadow-md">
      {/* Chat messages list */}
      <div className="flex-1 overflow-y-scroll min-h-0 p-2 space-y-2"> 
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`p-1.5 rounded-md max-w-xs text-sm break-words ${
              msg.email === email ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 text-black self-start'
            }`}
          >
            <strong className="block text-xs opacity-70">{msg.email}</strong>
            <span>{msg.message}</span>
          </div>
        ))}
      </div>
      
      {/* Message input box */}
      <div className="p-2 flex flex-col border-t bg-white">
        <div className="flex items-center">
          <input
            type="text"
            className="flex-grow p-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-blue-500 w-4/5"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
          />
          <button 
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="ml-2 w-9 h-9 flex items-center justify-center bg-gray-300 text-xl rounded-full hover:bg-gray-400 transition"
          >
            😊
          </button>
          <button 
            onClick={sendMessage} 
            className="ml-2 w-24 h-12 flex items-center justify-center text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Send
          </button>
        </div>
        {showEmojiPicker && (
          <div className="mt-2">
            <Picker 
              onEmojiClick={onEmojiClick} 
              disableSearchBar={true} 
              disableSkinTonePicker={true} 
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
