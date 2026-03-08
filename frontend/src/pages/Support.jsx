// frontend/src/pages/Support.jsx
// Admin-only support dashboard — WhatsApp-style layout
// Left: conversation list | Right: active chat

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'https://ivey-production.up.railway.app/api';
const SOCKET_URL = API_BASE.replace('/api', '');

export default function Support() {
  const navigate                          = useNavigate();
  const [authorized, setAuthorized]       = useState(false);
  const [loading, setLoading]             = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [unreadMap, setUnreadMap]         = useState({});
  const socketRef                         = useRef(null);
  const messagesEndRef                    = useRef(null);
  const inputRef                          = useRef(null);
  const token                             = localStorage.getItem('token') ||
                                            sessionStorage.getItem('token');

  // ── Auth check ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    fetch(`${API_BASE}/admin/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => {
      if (r.status === 403 || r.status === 401) { navigate('/'); return; }
      setAuthorized(true);
      return r.json();
    }).then(data => {
      if (data?.conversations) setConversations(data.conversations);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // ── Socket.io — listen for new incoming messages ──────────────────────────────
  useEffect(() => {
    if (!authorized) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    // Join admin room to receive all new messages
    socket.on('connect', () => {
      socket.emit('admin_join');
    });

    // New message from any user
    socket.on('new_user_message', ({ sessionId, message, created_at }) => {
      // Update conversation list
      setConversations(prev => {
        const exists = prev.find(c => c.session_id === sessionId);
        if (exists) {
          return [
            { ...exists, last_message: { sender: 'user', message, created_at }, updated_at: created_at },
            ...prev.filter(c => c.session_id !== sessionId),
          ];
        }
        return [
          { session_id: sessionId, last_message: { sender: 'user', message, created_at }, updated_at: created_at, status: 'open' },
          ...prev,
        ];
      });

      // Add to unread if not the active session
      setActiveSession(current => {
        if (current !== sessionId) {
          setUnreadMap(u => ({ ...u, [sessionId]: (u[sessionId] || 0) + 1 }));
        } else {
          // If active, append message live
          setMessages(m => [...m, { sender: 'user', message, created_at }]);
        }
        return current;
      });
    });

    return () => socket.disconnect();
  }, [authorized]);

  // ── Load conversation messages ─────────────────────────────────────────────
  const openConversation = useCallback(async (sessionId) => {
    setActiveSession(sessionId);
    setUnreadMap(u => ({ ...u, [sessionId]: 0 }));
    setMessages([]);

    const res = await fetch(`${API_BASE}/admin/conversations/${sessionId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setMessages(data.messages || []);
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [token]);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send reply ────────────────────────────────────────────────────────────
  const sendReply = useCallback(async () => {
    const text = input.trim();
    if (!text || !activeSession || sending) return;

    setSending(true);
    const optimistic = { sender: 'support', message: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, optimistic]);
    setInput('');

    try {
      await fetch(`${API_BASE}/admin/conversations/${activeSession}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      // Update conversation preview
      setConversations(prev => prev.map(c =>
        c.session_id === activeSession
          ? { ...c, last_message: { sender: 'support', message: text, created_at: optimistic.created_at } }
          : c
      ));
    } catch {
      setMessages(prev => prev.filter(m => m !== optimistic));
    } finally {
      setSending(false);
    }
  }, [input, activeSession, sending, token]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
  };

  // ── Refresh conversation list ─────────────────────────────────────────────
  const refreshConversations = async () => {
    const res = await fetch(`${API_BASE}/admin/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.conversations) setConversations(data.conversations);
  };

  // ── Delete conversation ───────────────────────────────────────────────────
  const deleteConversation = async (sessionId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this conversation?')) return;

    await fetch(`${API_BASE}/admin/conversations/${sessionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    setConversations(prev => prev.filter(c => c.session_id !== sessionId));
    if (activeSession === sessionId) { setActiveSession(null); setMessages([]); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })
      : d.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
  };

  const shortSession = (id) => id?.slice(0, 8) || '—';

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ color: '#f97316', fontSize: '16px' }}>Loading support dashboard...</div>
    </div>
  );

  if (!authorized) return null;

  return (
    <div style={{
      height: 'calc(100vh - 64px)', display: 'flex',
      background: '#0f172a', overflow: 'hidden',
      fontFamily: 'inherit',
    }}>

      {/* ── Left sidebar — conversation list ─────────────────────────────────── */}
      <div style={{
        width: '320px', flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
        background: '#0f172a',
      }}>
        {/* Sidebar header */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#f1f5f9' }}>
              Support Inbox
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={refreshConversations}
            style={{
              background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
              color: '#f97316', fontSize: '12px', fontWeight: '600',
            }}
          >↻ Refresh</button>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
              No conversations yet.<br />They'll appear here when users message you.
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = activeSession === conv.session_id;
              const unread = unreadMap[conv.session_id] || 0;

              return (
                <div
                  key={conv.session_id}
                  onClick={() => openConversation(conv.session_id)}
                  style={{
                    padding: '14px 16px', cursor: 'pointer',
                    background: isActive ? 'rgba(249,115,22,0.1)' : 'transparent',
                    borderLeft: isActive ? '3px solid #f97316' : '3px solid transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                    background: `hsl(${parseInt(conv.session_id, 16) % 360}, 60%, 35%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: '700', color: 'white',
                  }}>
                    {shortSession(conv.session_id)[0].toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9' }}>
                        User #{shortSession(conv.session_id)}
                      </span>
                      <span style={{ fontSize: '11px', color: '#475569' }}>
                        {formatTime(conv.updated_at)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                      <span style={{
                        fontSize: '12px', color: '#64748b',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: '160px',
                      }}>
                        {conv.last_message
                          ? `${conv.last_message.sender === 'support' ? 'You: ' : ''}${conv.last_message.message}`
                          : 'No messages yet'}
                      </span>
                      {unread > 0 && (
                        <span style={{
                          background: '#f97316', color: 'white', borderRadius: '10px',
                          padding: '2px 7px', fontSize: '11px', fontWeight: '700', flexShrink: 0,
                        }}>{unread}</span>
                      )}
                    </div>
                  </div>

                  {/* Delete btn */}
                  <button
                    onClick={(e) => deleteConversation(conv.session_id, e)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#475569', fontSize: '14px', padding: '4px',
                      opacity: 0, transition: 'opacity 0.15s', flexShrink: 0,
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                    title="Delete conversation"
                  >🗑</button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel — active chat ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {!activeSession ? (
          /* Empty state */
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '12px',
          }}>
            <div style={{ fontSize: '48px' }}>💬</div>
            <h3 style={{ margin: 0, color: '#f1f5f9', fontSize: '18px' }}>Select a conversation</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>
              Choose a conversation from the left to start replying
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '12px',
              background: '#0f172a',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: `hsl(${parseInt(activeSession, 16) % 360}, 60%, 35%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', fontWeight: '700', color: 'white', flexShrink: 0,
              }}>
                {shortSession(activeSession)[0].toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#f1f5f9', fontWeight: '600', fontSize: '15px' }}>
                  User #{shortSession(activeSession)}
                </div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>
                  Session: {activeSession}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: '12px',
              scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent',
            }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: msg.sender === 'support' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end', gap: '8px',
                }}>
                  {msg.sender === 'user' && (
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: `hsl(${parseInt(activeSession, 16) % 360}, 60%, 35%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: '700', color: 'white',
                    }}>
                      {shortSession(activeSession)[0].toUpperCase()}
                    </div>
                  )}
                  <div style={{
                    maxWidth: '65%',
                    background: msg.sender === 'support'
                      ? 'linear-gradient(135deg, #f97316, #ea580c)'
                      : '#1e293b',
                    color: '#f1f5f9',
                    padding: '10px 14px',
                    borderRadius: msg.sender === 'support'
                      ? '14px 14px 4px 14px'
                      : '14px 14px 14px 4px',
                    fontSize: '14px', lineHeight: '1.5',
                    border: msg.sender === 'user' ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    wordBreak: 'break-word',
                  }}>
                    {msg.message}
                    <div style={{
                      fontSize: '11px', marginTop: '5px', opacity: 0.6,
                      textAlign: msg.sender === 'support' ? 'right' : 'left',
                    }}>
                      {msg.sender === 'support' ? 'You • ' : ''}{formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', gap: '12px', alignItems: 'flex-end',
              background: '#0f172a',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your reply... (Enter to send, Shift+Enter for new line)"
                rows={1}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: '14px',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  background: '#1e293b', color: '#f1f5f9',
                  fontSize: '14px', outline: 'none', resize: 'none',
                  fontFamily: 'inherit', lineHeight: '1.5',
                  maxHeight: '120px', overflowY: 'auto',
                }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={sendReply}
                disabled={!input.trim() || sending}
                style={{
                  padding: '12px 20px', borderRadius: '14px', border: 'none',
                  background: input.trim() && !sending
                    ? 'linear-gradient(135deg, #f97316, #ea580c)'
                    : 'rgba(255,255,255,0.08)',
                  color: input.trim() && !sending ? 'white' : '#475569',
                  fontSize: '14px', fontWeight: '700',
                  cursor: input.trim() && !sending ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', flexShrink: 0,
                  boxShadow: input.trim() && !sending ? '0 4px 16px rgba(249,115,22,0.35)' : 'none',
                }}
              >
                {sending ? '...' : 'Send ➤'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}