function LedIndicator({ active, label }) {
  return (
    <div style={styles.box}>
      <span
        style={{
          ...styles.led,
          backgroundColor: active ? "#22c55e" : "#ef4444",
          boxShadow: active
            ? "0 0 14px rgba(34,197,94,0.7)"
            : "0 0 14px rgba(239,68,68,0.7)",
        }}
      />
      <span style={styles.text}>
        {label}: {active ? "Açık" : "Kapalı"}
      </span>
    </div>
  );
}

const styles = {
  box: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(15, 23, 42, 0.7)",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  led: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  text: {
    color: "white",
    fontWeight: "700",
  },
};

export default LedIndicator;