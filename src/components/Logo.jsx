import { LOGO_SRC } from "../assets/logo";

export default function Logo({ size = 20 }) {
  const s = size * 1.5;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img src={LOGO_SRC} width={s} height={s} style={{ display: "block", filter: "var(--logo-filter, none)" }} alt="Volund" />
      <span style={{ fontSize: size, fontWeight: 800, color: "var(--text)", fontFamily: "'Inter',sans-serif", letterSpacing: "-0.03em" }}>Volund</span>
    </div>
  );
}
