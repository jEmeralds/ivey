// frontend/src/components/ChatWidget.jsx
// Real-time support chat via Socket.io
// Sessions persist via localStorage. Anonymous — no login required.

import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "https://ivey-production.up.railway.app";

const SESSION_KEY = "ivey_support_session";

function getOrCreateSession() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatWidget({ isDark = true }) {
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState("");
  const [connected, setConnected] = useState(false);
  const [unread, setUnread]       = useState(0);
  const [typing, setTyping]       = useState(false);
  const socketRef                 = useRef(null);
  const sessionId                 = useRef(getOrCreateSession());
  const messagesEndRef            = useRef(null);
  const inputRef                  = useRef(null);
  const typingTimer               = useRef(null);

  // ── Scroll to bottom ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // ── Socket connection ─────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join_session", sessionId.current);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("chat_history", (history) => {
      setMessages(history.map(m => ({
        sender: m.sender,
        text: m.message,
        time: m.created_at,
      })));
    });

    socket.on("user_message_saved", (msg) => {
      setMessages(prev => [...prev, {
        sender: "user",
        text: msg.message,
        time: msg.created_at,
      }]);
    });

    socket.on("support_message", (msg) => {
      setTyping(false);
      clearTimeout(typingTimer.current);
      setMessages(prev => [...prev, {
        sender: "support",
        text: msg.message,
        time: msg.created_at,
      }]);
      if (!open) setUnread(prev => prev + 1);
    });

    socket.on("support_typing", () => {
      setTyping(true);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setTyping(false), 4000);
    });

    return () => socket.disconnect();
  }, []);

  // ── Open/close ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // ── Send message ──────────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !socketRef.current?.connected) return;
    socketRef.current.emit("user_message", {
      sessionId: sessionId.current,
      message: text,
    });
    setInput("");
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Format time ───────────────────────────────────────────────────────────────
  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("en-KE", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  };

  // ── Theme ─────────────────────────────────────────────────────────────────────
  const bg          = isDark ? "#0f172a" : "#ffffff";
  const surface     = isDark ? "#1e293b" : "#f1f5f9";
  const border      = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const text        = isDark ? "#f1f5f9" : "#0f172a";
  const muted       = isDark ? "#64748b" : "#94a3b8";
  const inputBg     = isDark ? "#1e293b" : "#f8fafc";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";

  return (
    <>
      {/* ── Floating Button ───────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          position: "fixed", bottom: "28px", right: "28px",
          width: "58px", height: "58px", borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg, #374151, #1f2937)"
            : "linear-gradient(135deg, #f97316, #ea580c)",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "24px",
          boxShadow: open
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 8px 32px rgba(249,115,22,0.45), 0 0 0 4px rgba(249,115,22,0.12)",
          transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          zIndex: 9999,
        }}
        aria-label="Support chat"
      >
        {open ? "✕" : "💬"}
        {!open && unread > 0 && (
          <div style={{
            position: "absolute", top: "2px", right: "2px",
            width: "18px", height: "18px", borderRadius: "50%",
            background: "#ef4444", border: "2px solid white",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: "800", color: "white",
          }}>
            {unread}
          </div>
        )}
      </button>

      {/* ── Chat Panel ────────────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", bottom: "100px", right: "28px",
        width: "360px", maxWidth: "calc(100vw - 40px)",
        background: bg, border: `1px solid ${border}`,
        borderRadius: "20px",
        boxShadow: isDark
          ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)"
          : "0 32px 80px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column",
        height: "520px", overflow: "hidden", zIndex: 9998,
        transform: open ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "all" : "none",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        transformOrigin: "bottom right",
      }}>

        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #f97316, #ea580c)",
          padding: "16px 20px", flexShrink: 0,
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "50%",
            background: "rgba(255,255,255,0.2)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", border: "2px solid rgba(255,255,255,0.3)",
          }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>IVey Support</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <div style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: connected ? "#4ade80" : "#94a3b8",
                boxShadow: connected ? "0 0 6px #4ade80" : "none",
                transition: "all 0.3s",
              }} />
              <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "12px" }}>
                {connected ? "Online — replies in real time" : "Connecting..."}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem(SESSION_KEY);
              sessionId.current = getOrCreateSession();
              setMessages([]);
              if (socketRef.current?.connected) {
                socketRef.current.emit("join_session", sessionId.current);
              }
            }}
            title="Start new conversation"
            style={{
              background: "rgba(255,255,255,0.15)", border: "none",
              borderRadius: "8px", padding: "5px 8px",
              cursor: "pointer", color: "white", fontSize: "11px", fontWeight: "600",
            }}
          >New chat</button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "16px",
          display: "flex", flexDirection: "column", gap: "10px",
          scrollbarWidth: "thin",
          scrollbarColor: isDark
            ? "rgba(255,255,255,0.1) transparent"
            : "rgba(0,0,0,0.1) transparent",
        }}>
          {messages.length === 0 && (
            <div style={{
              background: surface, border: `1px solid ${border}`,
              borderRadius: "14px 14px 14px 4px",
              padding: "12px 14px", alignSelf: "flex-start", maxWidth: "85%",
            }}>
              <p style={{ color: text, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                👋 Hi! How can we help you today? Send us a message and we'll reply right here.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: "flex",
              flexDirection: msg.sender === "user" ? "row-reverse" : "row",
              alignItems: "flex-end", gap: "8px",
            }}>
              {msg.sender === "support" && (
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #f97316, #ea580c)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "13px", flexShrink: 0,
                }}>⚡</div>
              )}
              <div style={{
                maxWidth: "75%",
                background: msg.sender === "user"
                  ? "linear-gradient(135deg, #f97316, #ea580c)"
                  : surface,
                color: msg.sender === "user" ? "white" : text,
                padding: "10px 13px",
                borderRadius: msg.sender === "user"
                  ? "14px 14px 4px 14px"
                  : "14px 14px 14px 4px",
                fontSize: "13px", lineHeight: "1.5",
                border: msg.sender === "support" ? `1px solid ${border}` : "none",
                wordBreak: "break-word",
              }}>
                {msg.text}
                <div style={{
                  fontSize: "10px", marginTop: "4px", opacity: 0.6,
                  textAlign: msg.sender === "user" ? "right" : "left",
                }}>
                  {formatTime(msg.time)}
                </div>
              </div>
            </div>
          ))}

          {typing && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "linear-gradient(135deg, #f97316, #ea580c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "13px",
              }}>⚡</div>
              <div style={{
                background: surface, border: `1px solid ${border}`,
                borderRadius: "14px 14px 14px 4px",
                padding: "12px 16px", display: "flex", gap: "4px", alignItems: "center",
              }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: "6px", height: "6px", borderRadius: "50%", background: muted,
                    animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: "12px 16px", borderTop: `1px solid ${border}`,
          display: "flex", gap: "10px", alignItems: "flex-end", flexShrink: 0,
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            style={{
              flex: 1, padding: "10px 13px", borderRadius: "12px",
              border: `1.5px solid ${inputBorder}`,
              background: inputBg, color: text, fontSize: "13px",
              outline: "none", resize: "none", fontFamily: "inherit",
              lineHeight: "1.5", maxHeight: "80px", overflowY: "auto",
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !connected}
            style={{
              width: "40px", height: "40px", borderRadius: "12px", border: "none",
              background: input.trim() && connected
                ? "linear-gradient(135deg, #f97316, #ea580c)"
                : isDark ? "#1e293b" : "#e2e8f0",
              cursor: input.trim() && connected ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", flexShrink: 0,
              transition: "all 0.2s",
              boxShadow: input.trim() && connected ? "0 4px 12px rgba(249,115,22,0.4)" : "none",
            }}
          >➤</button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}