// Fixed full-viewport aurora backdrop for the simulator. Decorative only.
export function Aurora() {
  return (
    <div className="sim-aurora" aria-hidden>
      <div
        className="sim-aurora__blob sim-aurora__blob--a"
        style={{
          width: "min(70vw, 900px)",
          height: "min(70vw, 900px)",
          top: "-12%",
          left: "-8%",
          background: "#14b8a6",
        }}
      />
      <div
        className="sim-aurora__blob sim-aurora__blob--b"
        style={{
          width: "min(65vw, 820px)",
          height: "min(65vw, 820px)",
          bottom: "-18%",
          right: "-10%",
          background: "#8b5cf6",
        }}
      />
      <div
        className="sim-aurora__blob sim-aurora__blob--c"
        style={{
          width: "min(55vw, 700px)",
          height: "min(55vw, 700px)",
          top: "20%",
          left: "45%",
          background: "#3b82f6",
          opacity: 0.4,
        }}
      />
      <div className="sim-aurora__grid" />
    </div>
  );
}
