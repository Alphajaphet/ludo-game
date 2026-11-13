import { COLORS, CELL, centerOf } from "./ludoData.js";

export default function Board({ players, tokens, ci, movable, onMove }) {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 440,
        padding: 6,
        borderRadius: 24,
        boxSizing: "border-box",
        background: "linear-gradient(135deg,#fff3a0,#a65a00,#ffe66b,#6c3500)",
        boxShadow: "0 0 25px #00aaff, 0 12px 25px rgba(0,11,0,.7)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          background: "#dce7ff",
          borderRadius: 15,
          overflow: "hidden",
        }}
      >
        {COLORS.map((col) => (
          <div
            key={col.name}
            style={{
              position: "absolute",
              left: (col.origin[0] / 15) * 100 + "%",
              top: (col.origin[1] / 15) * 100 + "%",
              width: "40%",
              height: "40%",
              background: col.grad,
              border: "2px solid rgba(255,255,255,.5)",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "16%",
                background: "rgba(6,19,59,.35)",
                borderRadius: 14,
                boxShadow: "inset 0 0 16px rgba(0,0,0,.55)",
              }}
            />
          </div>
        ))}

        {COLORS.map((col) =>
          col.base.map(([c, r], i) => (
            <div
              key={col.name + i}
              style={{
                position: "absolute",
                left: ((c + 0.5) / 15) * 100 + "%",
                top: ((r + 0.5) / 15) * 100 + "%",
                width: (100 / 15) * 0.85 + "%",
                height: (100 / 15) * 0.85 + "%",
                transform: "translate(-50%,-50%)",
                borderRadius: "50%",
                background: "rgba(0,0,0,.3)",
              }}
            />
          ))
        )}

        <div
          style={{
            position: "absolute",
            left: "40%",
            top: "40%",
            width: "20%",
            height: "20%",
            background: `conic-gradient(from 45deg, ${COLORS[2].hex} 0 25%, ${COLORS[3].hex} 25% 50%, ${COLORS[0].hex} 50% 75%, ${COLORS[1].hex} 75% 100%)`,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontSize: 20,
            textShadow: "0 0 10px #fff",
          }}
        >
          ✦
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: "repeat(15,1fr)",
            gridTemplateRows: "repeat(15,1fr)",
          }}
        >
          {Array.from({ length: 225 }).map((_, i) => {
            const c = i % 15;
            const r = Math.floor(i / 15);
            const cell = CELL[c + "," + r];
            return (
              <div
                key={i}
                style={{
                  background: cell ? cell.bg : "transparent",
                  border: cell
                    ? cell.lane
                      ? "1px solid rgba(255,255,255,.45)"
                      : "1px solid #aab8d0"
                    : "none",
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "clamp(9px, 3.2vw, 14px)",
                  color: cell && cell.onColor ? "#fff" : "#8a5a00",
                }}
              >
                {cell && cell.star ? "★" : ""}
              </div>
            );
          })}
        </div>

        {players.map((pi) =>
          tokens[pi].map((pos, t) => {
            const [x, y] = centerOf(pi, pos, t);
            const isMovable = pi === ci && movable.includes(t);
            const pc = COLORS[pi].pawn;
            return (
              <div
                key={pi + "-" + t}
                onClick={() => isMovable && onMove(t)}
                style={{
                  position: "absolute",
                  left: (x / 15) * 100 + "%",
                  top: (y / 15) * 100 + "%",
                  width: (100 / 15) * 0.7 + "%",
                  height: (100 / 15) * 0.7 + "%",
                  transform: "translate(-50%,-50%)",
                  borderRadius: "50%",
                  background: `radial-gradient(circle at 32% 25%, #fff, ${pc[0]}, ${pc[2]})`,
                  border: "2px solid rgba(255,255,255,.7)",
                  boxSizing: "border-box",
                  boxShadow: `0 5px 5px rgba(0,0,0,.6), 0 0 9px ${pc[1]}`,
                  transition: "left .25s, top .25s",
                  zIndex: isMovable ? 6 : 4,
                  cursor: isMovable ? "pointer" : "default",
                  animation: isMovable ? "pulse .8s infinite" : "none",
                }}
              >
                <i
                  style={{
                    position: "absolute",
                    width: "43%",
                    height: "43%",
                    borderRadius: "50%",
                    left: "28%",
                    top: "-28%",
                    background: `radial-gradient(circle, #fff, ${pc[0]}, ${pc[2]})`,
                  }}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
        }
