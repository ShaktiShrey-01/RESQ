import React from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

export default function ChatModal({ 
  isOpen, onClose, messages, currentUserId, otherPerson, 
  newMessage, setNewMessage, onSendMessage, chatEndRef 
}) {
  if (!isOpen) return null;
  const defaultAvatar = 'https://res.cloudinary.com/dxjzq6f0g/image/upload/v1690912345/avatars/default-avatar.png';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl flex flex-col h-[65vh] max-h-[600px] overflow-hidden border border-slate-200 dark:border-slate-800">
        
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <img src={otherPerson?.avatar || defaultAvatar} className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-200" alt="avatar" />
            <h3 className="font-bold text-slate-800 dark:text-white capitalize">
              {otherPerson?.name?.split(" ")[0]}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white dark:bg-slate-700 shadow-sm hover:scale-105 transition">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">Send a message to coordinate.</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2.5 max-w-[80%] text-[15px] font-medium shadow-sm ${
                    isMe 
                    ? 'bg-slate-900 text-white rounded-2xl rounded-br-sm' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={onSendMessage} className="flex gap-2 items-center">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 h-12 px-5 rounded-full bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-slate-900/20 text-[15px] font-medium text-slate-900 dark:text-white outline-none"
            />
            <button type="submit" disabled={!newMessage.trim()} className="h-12 w-12 flex items-center justify-center rounded-full bg-slate-900 text-white shadow-md disabled:opacity-50 hover:scale-105 transition">
              <Send className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}