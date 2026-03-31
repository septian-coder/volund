export default function Tag({ children }) {
  return (
    <span style={{
      fontSize: 9, color: "var(--text-primary)", background: "transparent",
      fontFamily: "'Inter',sans-serif", letterSpacing: ".2em", padding: "0",
      display: "inline-block", fontWeight: 400, opacity: .5,
      animation: "fade-in .5s ease both", textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}
