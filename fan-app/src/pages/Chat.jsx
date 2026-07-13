import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Globe, Send, Bot, User, Shield } from 'lucide-react';
import { useAuth } from '../App';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' },
  { code: 'de', label: 'Deutsch' },
];

const quickReplies = [
  "Where's my seat?",
  'Find food',
  'Restrooms',
  'Emergency help',
];

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const msgVariants = {
  initial: { opacity: 0, y: 12, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: "Hello! 👋 I'm your AI Stadium Assistant. I can help you find your seat, locate food & drinks, get directions, or handle emergencies. How can I help you today?",
      confidence: 0.99,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lang, setLang] = useState('en');
  const [showLangPicker, setShowLangPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fan_id: user?.id || 'anonymous',
          message: text.trim(),
          language: lang,
          context: {
            zone: user?.zone_id || 'sec-101',
            seat: user?.seat || 'Row H, Seat 12',
            ticket_class: user?.ticket_class || 'General Admission',
            user_name: user?.name || 'Fan'
          },
        }),
      });

      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      const botMsg = {
        id: `bot-${Date.now()}`,
        role: 'bot',
        text: data.response || data.message || "I'm sorry, I couldn't process that. Please try again.",
        confidence: data.confidence ?? 0.85,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg = {
        id: `bot-err-${Date.now()}`,
        role: 'bot',
        text: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        confidence: 0,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (text) => {
    sendMessage(text);
  };

  const formatTime = (d) => {
    const date = new Date(d);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const confidenceLabel = (c) => {
    if (c >= 0.9) return { text: 'High', cls: 'badge--green' };
    if (c >= 0.7) return { text: 'Medium', cls: 'badge--gold' };
    return { text: 'Low', cls: 'badge--red' };
  };

  /* Determine if quick replies should show: after last bot message and no user follow-up */
  const lastMsg = messages[messages.length - 1];
  const showQuickReplies = lastMsg?.role === 'bot' && !isTyping;

  return (
    <motion.div className="chat-container" variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {/* Header */}
      <div className="chat-header" id="chat-header">
        <button
          onClick={() => navigate('/')}
          className="btn btn--icon btn--secondary"
          id="chat-back-btn"
          aria-label="Go back"
          style={{ width: 38, height: 38, borderRadius: 10 }}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="chat-header__title" id="chat-title">AI Assistant</div>

        {/* Language selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="btn btn--icon btn--secondary"
            id="chat-lang-btn"
            aria-label="Select language"
            style={{ width: 38, height: 38, borderRadius: 10 }}
          >
            <Globe size={18} />
          </button>

          {showLangPicker && (
            <div
              id="chat-lang-dropdown"
              style={{
                position: 'absolute', top: '110%', right: 0,
                minWidth: 150, padding: 6,
                background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-sm)', zIndex: 20,
                boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              }}
            >
              {languages.map((l) => (
                <button
                  key={l.code}
                  id={`chat-lang-${l.code}`}
                  onClick={() => { setLang(l.code); setShowLangPicker(false); }}
                  style={{
                    display: 'block', width: '100%', padding: '10px 14px',
                    textAlign: 'left', fontSize: '0.875rem', borderRadius: 6,
                    color: lang === l.code ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    background: lang === l.code ? 'rgba(6,182,212,0.1)' : 'transparent',
                    fontWeight: lang === l.code ? 600 : 400,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = lang === l.code ? 'rgba(6,182,212,0.1)' : 'transparent';
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" id="chat-messages">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div key={msg.id} variants={msgVariants} initial="initial" animate="animate">
              {msg.role === 'user' ? (
                <div className="chat-bubble chat-bubble--user" id={msg.id}>
                  {msg.text}
                  <div style={{ fontSize: '0.6875rem', opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              ) : (
                <div className="chat-bot-row" id={msg.id}>
                  <div className="chat-bubble__avatar">
                    <Bot size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="chat-bubble chat-bubble--bot">
                      {msg.text}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 }}>
                        {msg.confidence > 0 && (
                          <span className={`badge ${confidenceLabel(msg.confidence).cls}`} style={{ fontSize: '0.5625rem' }}>
                            <Shield size={9} />
                            {confidenceLabel(msg.confidence).text}
                          </span>
                        )}
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <div className="chat-bot-row">
            <div className="chat-bubble__avatar">
              <Bot size={16} />
            </div>
            <div className="chat-bubble chat-bubble--bot chat-typing" id="chat-typing-indicator">
              <span className="chat-typing__dot" />
              <span className="chat-typing__dot" />
              <span className="chat-typing__dot" />
            </div>
          </div>
        )}

        {/* Quick replies */}
        {showQuickReplies && (
          <motion.div
            className="chat-suggestions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            id="chat-quick-replies"
          >
            {quickReplies.map((qr) => (
              <button
                key={qr}
                className="chat-suggestion-chip"
                id={`chat-qr-${qr.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => handleQuickReply(qr)}
              >
                {qr}
              </button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form className="chat-input-bar" onSubmit={handleSubmit} id="chat-input-form">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          id="chat-input-field"
          aria-label="Type a message"
        />
        <button
          type="submit"
          className="chat-send-btn"
          id="chat-send-btn"
          disabled={!input.trim() || isTyping}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </motion.div>
  );
}
