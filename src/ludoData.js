export const TRACK = [
  [1,6],[2,6],[3,6],[4,6],[5,6],
  [6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
  [7,0],[8,0],
  [8,1],[8,2],[8,3],[8,4],[8,5],
  [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
  [14,7],[14,8],
  [13,8],[12,8],[11,8],[10,8],[9,8],
  [8,9],[8,10],[8,11],[8,12],[8,13],[8,14],
  [7,14],[6,14],
  [6,13],[6,12],[6,11],[6,10],[6,9],
  [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
  [0,7],[0,6],
];
export const SAFE = [0, 8, 13, 21, 26, 34, 39, 47];

export const COLORS = [
  { name: "Yellow", hex: "#ffca05",
    grad: "linear-gradient(145deg,#fff36a,#ffb900,#d77b00)",
    pawn: ["#ffce00", "#fff7a1", "#a75a00"],
    start: 0, origin: [0, 0],
    home: [[1,7],[2,7],[3,7],[4,7],[5,7]],
    base: [[1,1],[4,1],[1,4],[4,4]], done: [6.7, 7.5] },
  { name: "Blue", hex: "#087cff",
    grad: "linear-gradient(145deg,#60eaff,#0879ff,#0641a8)",
    pawn: ["#00caff", "#baffff", "#003dba"],
    start: 13, origin: [9, 0],
    home: [[7,1],[7,2],[7,3],[7,4],[7,5]],
    base: [[10,1],[13,1],[10,4],[13,4]], done: [7.5, 6.7] },
  { name: "Red", hex: "#f21d16",
    grad: "linear-gradient(145deg,#ff8982,#fa211b,#a50016)",
    pawn: ["#ff302b", "#ffc0ad", "#970000"],
    start: 26, origin: [9, 9],
    home: [[13,7],[12,7],[11,7],[10,7],[9,7]],
    base: [[10,10],[13,10],[10,13],[13,13]], done: [8.3, 7.5] },
  { name: "Green", hex: "#0fd63a",
    grad: "linear-gradient(145deg,#aaff54,#00db38,#00852a)",
    pawn: ["#39f500", "#d6ff8c", "#087b00"],
    start: 39, origin: [0, 9],
    home: [[7,13],[7,12],[7,11],[7,10],[7,9]],
    base: [[1,10],[4,10],[1,13],[4,13]], done: [7.5, 8.3] },
];

const NEUTRAL = "linear-gradient(145deg,#ffffff,#dce6f7)";
export const CELL = {};
TRACK.forEach(([c, r], i) => {
  CELL[c + "," + r] = { bg: NEUTRAL, star: SAFE.includes(i) };
});
COLORS.forEach((col) => {
  col.home.forEach(([c, r]) => {
    CELL[c + "," + r] = { bg: col.hex, lane: true };
  });
  const [sc, sr] = TRACK[col.start];
  CELL[sc + "," + sr] = { bg: col.hex, star: true, onColor: true, lane: true };
});

export const PIPS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
export const EMOJIS = ["😂","😎","😡","😭","😍","🤔","👏","🔥","🎉","😱","🙏","😴"];
export const PHRASES = ["Hello!","Play fast!","That was close!","Well Played","Why?! Why?!","Sorry mate!"];

export const canMove = (pos, v) => (pos === -1 ? v === 6 : pos + v <= 56);

export function centerOf(ci, pos, t) {
  const col = COLORS[ci];
  if (pos === -1) return [col.base[t][0] + 0.5, col.base[t][1] + 0.5];
  let c, r;
  if (pos <= 50) [c, r] = TRACK[(col.start + pos) % 52];
  else if (pos <= 55) [c, r] = col.home[pos - 51];
  else {
    const [dx, dy] = col.done;
    const off = (t - 1.5) * 0.14;
    return ci % 2 === 0 ? [dx, dy + off] : [dx + off, dy];
  }
  const ox = ((t % 2) - 0.5) * 0.22;
  const oy = (Math.floor(t / 2) - 0.5) * 0.22;
  return [c + 0.5 + ox, r + 0.5 + oy];
}

export const page = {
  minHeight: "100vh",
  background:
    "radial-gradient(ellipse at 50% 12%, rgba(62,130,255,.55), transparent 45%), linear-gradient(145deg,#02072b,#081a55,#16043b)",
  color: "#fff",
  fontFamily: "system-ui, Arial, sans-serif",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "10px 10px 130px",
  boxSizing: "border-box",
  textAlign: "center",
};
export const pill = {
  border: "2px solid #ffcf54",
  background: "linear-gradient(145deg,#15245d,#050b2d)",
  boxShadow: "0 0 12px #148bff",
  borderRadius: 14,
  padding: "6px 10px",
  fontWeight: 700,
  color: "#fff",
  fontSize: 14,
  cursor: "pointer",
};
export const round = {
  ...pill,
  width: 40,
  height: 40,
  padding: 0,
  fontSize: 24,
  display: "grid",
  placeItems: "center",
};
export const chatBtn = {
  ...pill,
  background: "linear-gradient(145deg,#32236c,#080f3c)",
  border: "2px solid #d7aaff",
  boxShadow: "0 0 10px #8a4dff",
  borderRadius: 20,
  padding: "8px 16px",
  fontSize: 15,
};
export const yellowBtn = {
  padding: "14px 28px",
  fontSize: 18,
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(180deg,#ffd54a,#f5a623)",
  color: "#5a2a00",
  fontWeight: 800,
  cursor: "pointer",
  margin: 6,
  boxShadow: "0 4px 0 #b36b00",
};
export const phrase = {
  background: "#fff",
  color: "#16245d",
  border: "2px solid #ffcf54",
  borderRadius: 20,
  padding: "10px 6px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
};
export const logo = {
  fontSize: 22,
  fontWeight: 900,
  color: "#fff2a2",
  textShadow: "0 3px #a34a00, 0 0 18px #ffcf35",
  lineHeight: 1,
};
