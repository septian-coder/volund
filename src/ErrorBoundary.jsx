import { Component } from "react";

// ── Error Boundary ─────────────────────────────────────────────────────────────
// Catches unexpected React render errors and shows a friendly fallback UI
// instead of a blank/broken screen.

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production you'd send this to Sentry / LogRocket etc.
    console.error("[ErrorBoundary] Caught error:", error, info?.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label = "component" } = this.props;

    return (
      <div style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', sans-serif",
        padding: "40px 24px",
      }}>
        <div style={{
          maxWidth: 420,
          width: "100%",
          border: "1px solid rgba(248,113,113,0.3)",
          borderRadius: 16,
          padding: "36px 32px",
          background: "rgba(248,113,113,0.04)",
          textAlign: "center",
        }}>
          {/* Icon */}
          <div style={{ fontSize: 36, marginBottom: 16 }}>⚠</div>

          {/* Title */}
          <div style={{
            fontSize: 11,
            letterSpacing: ".2em",
            color: "#f87171",
            marginBottom: 12,
            textTransform: "uppercase",
          }}>
            Unexpected Error
          </div>

          <div style={{
            fontSize: 18,
            fontWeight: 300,
            color: "#e8e3d5",
            marginBottom: 12,
            letterSpacing: "-0.01em",
          }}>
            Something went wrong
          </div>

          <div style={{
            fontSize: 11,
            color: "rgba(232,227,213,0.5)",
            lineHeight: 1.8,
            marginBottom: 28,
          }}>
            An error occurred in the {label}. Your wallet and data are safe.
          </div>

          {/* Error detail (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              fontSize: 9,
              color: "#f87171",
              background: "rgba(248,113,113,0.07)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 8,
              padding: "10px 12px",
              textAlign: "left",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              marginBottom: 24,
              lineHeight: 1.7,
            }}>
              {this.state.error.message}
            </pre>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: "10px 24px",
                background: "#e8e3d5",
                color: "#000",
                fontWeight: 700,
                fontSize: 11,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                letterSpacing: ".12em",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={e => e.target.style.background = "#fff"}
              onMouseLeave={e => e.target.style.background = "#e8e3d5"}
            >
              RETRY
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 24px",
                background: "transparent",
                color: "#e8e3d5",
                fontWeight: 400,
                fontSize: 11,
                border: "1px solid rgba(232,227,213,0.3)",
                borderRadius: 8,
                cursor: "pointer",
                letterSpacing: ".12em",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              RELOAD PAGE
            </button>
          </div>
        </div>
      </div>
    );
  }
}
