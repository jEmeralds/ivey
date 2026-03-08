// frontend/src/components/ChatWidget.jsx
// Floating chat widget — bottom right corner
// Stays on every page. User types inside IVey, message goes to WhatsApp + Gmail.

import { useState, useEffect, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "https://ivey-production.up.railway.app";

export default function ChatWidget({ isDark = true }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState("idle"); // idle | chat | sending | success | error
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [activeField, setActiveField] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [unread, setUnread] = useState(1); // shows badge until opened
  const panelRef = useRef(null);
  const messageRef = useRef(null);

  // Auto-focus message when panel opens
  useEffect(() => {
    if (open) {
      setUnread(0);
      setStep("chat");
      setTimeout(() => messageRef.current?.focus(), 300);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const btn = document.getElementById("chat-widget-btn");
        if (!btn?.contains(e.target)) setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (name === "message") setCharCount(value.length);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === "sending") return;
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;

    setStep("sending");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong.");
        setStep("error");
        setTimeout(() => setStep("chat"), 4000);
        return;
      }

      setStep("success");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStep("error");
      setTimeout(() => setStep("chat"), 4000);
    }
  };

  const resetWidget = () => {
    setForm({ name: "", email: "", message: "" });
    setCharCount(0);
    setStep("chat");
    setErrorMsg("");
  };

  // ── Colors ──────────────────────────────────────────────────────────────────
  const bg = isDark ? "#0f172a" : "#ffffff";
  const surface = isDark ? "#1e293b" : "#f8fafc";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const text = isDark ? "#f1f5f9" : "#0f172a";
  const muted = isDark ? "#94a3b8" : "#64748b";
  const inputBg = isDark ? "rgba(15,23,42,0.9)" : "#ffffff";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)";
  const focusBorder = "#f97316";
  const labelColor = isDark ? "#64748b" : "#9ca3af";

  const inputStyle = (name) => ({
    width: "100%",
    padding: "10px 13px",
    borderRadius: "10px",
    border: `1.5px solid ${activeField === name ? focusBorder : inputBorder}`,
    background: inputBg,
    color: text,
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  });

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    color: labelColor,
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  return (
    <>
      {/* ── Floating Button ─────────────────────────────────────────────────── */}
      <button
        id="chat-widget-btn"
        onClick={() => setOpen((p) => !p)}
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          width: "58px",
          height: "58px",
          borderRadius: "50%",
          background: open
            ? "linear-gradient(135deg, #374151, #1f2937)"
            : "linear-gradient(135deg, #f97316, #ea580c)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          boxShadow: open
            ? "0 8px 32px rgba(0,0,0,0.4)"
            : "0 8px 32px rgba(249,115,22,0.45), 0 0 0 4px rgba(249,115,22,0.12)",
          transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          zIndex: 9999,
          transform: open ? "rotate(0deg) scale(1)" : "scale(1)",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
        aria-label="Open support chat"
      >
        {open ? "✕" : "💬"}

        {/* Unread badge */}
        {!open && unread > 0 && (
          <div style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#ef4444",
            border: "2px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            fontWeight: "800",
            color: "white",
          }}>
            {unread}
          </div>
        )}
      </button>

      {/* ── Chat Panel ──────────────────────────────────────────────────────── */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          bottom: "100px",
          right: "28px",
          width: "360px",
          maxWidth: "calc(100vw - 40px)",
          background: bg,
          border: `1px solid ${border}`,
          borderRadius: "20px",
          boxShadow: isDark
            ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)"
            : "0 32px 80px rgba(0,0,0,0.15)",
          overflow: "hidden",
          zIndex: 9998,
          transform: open ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          transformOrigin: "bottom right",
        }}
      >
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #f97316, #ea580c)",
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          {/* Avatar */}
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
            border: "2px solid rgba(255,255,255,0.3)",
          }}>
            ⚡
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>IVey Support</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
              <div style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#4ade80",
                boxShadow: "0 0 6px #4ade80",
              }} />
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>Online — replies via WhatsApp & Email</span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>

          {/* ── Success State ── */}
          {step === "success" ? (
            <div style={{ textAlign: "center", padding: "24px 8px" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "rgba(22,163,74,0.12)",
                border: "2px solid rgba(22,163,74,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "28px", margin: "0 auto 16px",
              }}>
                ✅
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: "700", color: text, marginBottom: "10px", marginTop: 0 }}>
                Message received!
              </h3>
              <p style={{ color: muted, fontSize: "13px", lineHeight: "1.6", marginBottom: "20px" }}>
                We'll reply to <strong style={{ color: text }}>{form.email || "your email"}</strong> — and also on WhatsApp if possible. Usually within 1–2 hours.
              </p>
              <button
                onClick={resetWidget}
                style={{
                  padding: "9px 20px", borderRadius: "10px",
                  border: `1.5px solid ${inputBorder}`, background: "transparent",
                  color: muted, fontSize: "13px", cursor: "pointer", fontWeight: "600",
                }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <>
              {/* Greeting bubble */}
              <div style={{
                background: surface,
                border: `1px solid ${border}`,
                borderRadius: "14px 14px 14px 4px",
                padding: "12px 14px",
                marginBottom: "20px",
              }}>
                <p style={{ color: text, fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                  👋 Hi there! Leave us a message and we'll get back to you on <strong>WhatsApp</strong> or <strong>email</strong>.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                {/* Name + Email side by side */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={labelStyle}>Name</label>
                    <input
                      type="text" name="name" value={form.name}
                      onChange={handleChange} placeholder="Your name" required
                      style={inputStyle("name")}
                      onFocus={() => setActiveField("name")}
                      onBlur={() => setActiveField(null)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="email" name="email" value={form.email}
                      onChange={handleChange} placeholder="you@email.com" required
                      style={inputStyle("email")}
                      onFocus={() => setActiveField("email")}
                      onBlur={() => setActiveField(null)}
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Message</label>
                    <span style={{ fontSize: "11px", color: charCount > 400 ? "#f97316" : labelColor }}>
                      {charCount}/500
                    </span>
                  </div>
                  <textarea
                    ref={messageRef}
                    name="message" value={form.message}
                    onChange={handleChange}
                    placeholder="What can we help you with?"
                    required maxLength={500} rows={4}
                    style={{
                      ...inputStyle("message"),
                      resize: "none",
                      lineHeight: "1.5",
                    }}
                    onFocus={() => setActiveField("message")}
                    onBlur={() => setActiveField(null)}
                  />
                </div>

                {/* Error */}
                {step === "error" && (
                  <div style={{
                    padding: "10px 14px", borderRadius: "10px",
                    background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)",
                    color: "#f87171", fontSize: "12px",
                  }}>
                    ❌ {errorMsg}
                  </div>
                )}

                {/* Send button */}
                <button
                  type="submit"
                  disabled={step === "sending"}
                  style={{
                    width: "100%", padding: "12px",
                    borderRadius: "12px", border: "none",
                    background: step === "sending"
                      ? "rgba(249,115,22,0.5)"
                      : "linear-gradient(135deg, #f97316, #ea580c)",
                    color: "white", fontSize: "14px", fontWeight: "700",
                    cursor: step === "sending" ? "not-allowed" : "pointer",
                    boxShadow: step === "sending" ? "none" : "0 4px 16px rgba(249,115,22,0.4)",
                    transition: "all 0.25s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  }}
                >
                  {step === "sending" ? (
                    <>
                      <span style={{
                        width: "14px", height: "14px", borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid white",
                        display: "inline-block",
                        animation: "spin 0.8s linear infinite",
                      }} />
                      Sending...
                    </>
                  ) : (
                    <>Send Message <span>→</span></>
                  )}
                </button>

                {/* Footer note */}
                <div style={{
                  display: "flex", justifyContent: "center", alignItems: "center",
                  gap: "10px", paddingTop: "4px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "13px" }}>✈️</span>
                    <span style={{ fontSize: "11px", color: labelColor }}>Telegram</span>
                  </div>
                  <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: labelColor }} />
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ fontSize: "13px" }}>✉️</span>
                    <span style={{ fontSize: "11px", color: labelColor }}>Email</span>
                  </div>
                  <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: labelColor }} />
                  <span style={{ fontSize: "11px", color: labelColor }}>Reply in ~1–2 hrs</span>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}