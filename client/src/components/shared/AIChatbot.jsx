import React, { useState, useEffect, useRef } from 'react';
import { request } from '../../api/client';
import { COLORS, FONTS } from '../../styles/tokens';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([
    {
      role: 'assistant',
      content: 'Namaskar! I am Aagah Krishi Sahayak, your AI agricultural assistant. I can help you with crop guidance, soil health, weather, mandi prices, and government farming schemes. How can I assist you today?'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMessage = message.trim();
    setMessage('');
    setHistory((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Send chat request to backend
      const response = await request('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: userMessage,
          history: history.slice(1) // skip the initial greeting
        })
      });

      setHistory((prev) => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please check your internet connection and try again.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // CSS Styles for Chatbot Window Animations
  const chatbotStyles = `
    .aagah-chatbot-window {
      opacity: 0;
      transform: translateY(20px) scale(0.92);
      transform-origin: bottom right;
      transition: opacity 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      visibility: hidden;
    }
    .aagah-chatbot-window.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      visibility: visible;
    }
    .aagah-chatbot-window.closed {
      opacity: 0;
      transform: translateY(20px) scale(0.92);
      visibility: hidden;
    }
    .aagah-chatbot-fab {
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.25s, box-shadow 0.25s;
    }
    .aagah-chatbot-fab:hover {
      box-shadow: 0 6px 20px rgba(92, 64, 51, 0.35);
    }
    .aagah-chatbot-fab:active {
      transform: scale(0.92) !important;
    }
  `;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: FONTS.body }}>
      <style>{chatbotStyles}</style>

      {/* Floating Chat Window */}
      <div
        className={`aagah-chatbot-window ${isOpen ? 'open' : 'closed'}`}
        style={{
          position: 'absolute',
          bottom: '70px',
          right: '0',
          width: '350px',
          height: '460px',
          backgroundColor: COLORS.cream,
          border: `2.5px solid ${COLORS.soil}`,
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(92, 64, 51, 0.15)',
          boxSizing: 'border-box',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: COLORS.soil,
            color: COLORS.cream,
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `2.5px solid ${COLORS.soil}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🤖</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: FONTS.display, fontSize: '14px', fontWeight: '700', letterSpacing: '-0.01em' }}>
                Aagah Krishi Sahayak
              </span>
              <span style={{ fontSize: '10px', color: COLORS.riceLight, fontWeight: 'bold' }}>
                Farming Support AI
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.cream,
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none'
            }}
          >
            ✕
          </button>
        </div>

        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: COLORS.parchment + '30'
          }}
        >
          {history.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  backgroundColor: isUser ? COLORS.soil : COLORS.cream,
                  color: isUser ? COLORS.cream : COLORS.ink,
                  padding: '10px 14px',
                  borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  border: `1px solid ${isUser ? COLORS.soil : COLORS.soil + '20'}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}
              >
                <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </p>
              </div>
            );
          })}
          
          {loading && (
            <div
              style={{
                alignSelf: 'flex-start',
                backgroundColor: COLORS.cream,
                border: `1px solid ${COLORS.soil}20`,
                padding: '10px 14px',
                borderRadius: '12px 12px 12px 2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <div style={{ fontSize: '11px', color: COLORS.inkMuted, fontStyle: 'italic' }}>
                Sahayak is typing...
              </div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Footer Input Area */}
        <form
          onSubmit={handleSend}
          style={{
            padding: '12px',
            borderTop: `1.5px solid ${COLORS.soil}20`,
            backgroundColor: COLORS.cream,
            display: 'flex',
            gap: '8px'
          }}
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about crops, weather, seeds..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${COLORS.soil}40`,
              fontSize: '13px',
              outline: 'none',
              fontFamily: FONTS.body,
              backgroundColor: '#ffffff'
            }}
            disabled={loading}
          />
          <button
            type="submit"
            style={{
              backgroundColor: COLORS.turmeric,
              color: COLORS.soil,
              border: `1.5px solid ${COLORS.soil}`,
              borderRadius: '6px',
              padding: '8px 14px',
              fontWeight: '700',
              fontSize: '13px',
              fontFamily: FONTS.display,
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.1s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.turmericLight;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.turmeric;
            }}
            disabled={loading || !message.trim()}
          >
            Send
          </button>
        </form>
      </div>

      {/* Floating Trigger Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="aagah-chatbot-fab"
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: isOpen ? COLORS.soil : COLORS.turmeric,
          color: isOpen ? COLORS.cream : COLORS.soil,
          border: `2.5px solid ${COLORS.soil}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(92, 64, 51, 0.25)',
          outline: 'none',
          transform: isOpen ? 'scale(1.05) rotate(135deg)' : 'scale(1) rotate(0deg)'
        }}
        aria-label="Toggle Chatbot"
      >
        {isOpen ? '✕' : '✨'}
      </button>
    </div>
  );
}
