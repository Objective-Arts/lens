#!/usr/bin/env node
// Generates an Excalidraw diagram of the Lens quality pipeline.
// Run: node scripts/gen-pipeline-diagram.mjs > pipeline.excalidraw

let idN = 0;
const id = () => `e${++idN}`;
const seed = () => Math.floor(Math.random() * 2e9);
const elements = [];

// Track bound elements for cross-referencing
const boundMap = new Map(); // elementId -> [{id, type}]
function addBound(parentId, childId, type) {
  if (!boundMap.has(parentId)) boundMap.set(parentId, []);
  boundMap.get(parentId).push({ id: childId, type });
}

function rect(x, y, w, h, opts = {}) {
  const eid = opts.id || id();
  elements.push({
    id: eid, type: "rectangle", x, y, width: w, height: h, angle: 0,
    strokeColor: opts.stroke || "#1e1e1e",
    backgroundColor: opts.bg || "transparent",
    fillStyle: "solid", strokeWidth: opts.sw || 2, strokeStyle: opts.ss || "solid",
    roughness: 0, opacity: 100, groupIds: opts.gids || [], frameId: null,
    roundness: { type: 3 }, seed: seed(), version: 1, versionNonce: seed(),
    isDeleted: false, boundElements: null, // patched later
    updated: Date.now(), link: null, locked: false,
  });
  return eid;
}

function diamond(x, y, w, h, opts = {}) {
  const eid = opts.id || id();
  elements.push({
    id: eid, type: "diamond", x, y, width: w, height: h, angle: 0,
    strokeColor: opts.stroke || "#1e1e1e",
    backgroundColor: opts.bg || "#e9ecef",
    fillStyle: "solid", strokeWidth: opts.sw || 2, strokeStyle: "solid",
    roughness: 0, opacity: 100, groupIds: opts.gids || [], frameId: null,
    roundness: { type: 2 }, seed: seed(), version: 1, versionNonce: seed(),
    isDeleted: false, boundElements: null,
    updated: Date.now(), link: null, locked: false,
  });
  return eid;
}

function text(x, y, txt, opts = {}) {
  const eid = opts.id || id();
  const fontSize = opts.fs || 16;
  const lines = txt.split("\n");
  const lineHeight = fontSize * 1.25;
  const estWidth = Math.max(...lines.map(l => l.length)) * fontSize * 0.55;
  const estHeight = lines.length * lineHeight;
  elements.push({
    id: eid, type: "text", x, y, width: opts.w || estWidth, height: opts.h || estHeight,
    angle: 0, strokeColor: opts.stroke || "#1e1e1e", backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 1, strokeStyle: "solid",
    roughness: 0, opacity: 100, groupIds: opts.gids || [], frameId: null,
    roundness: null, seed: seed(), version: 1, versionNonce: seed(),
    isDeleted: false, boundElements: null,
    updated: Date.now(), link: null, locked: false,
    text: txt, fontSize, fontFamily: opts.ff || 1,
    textAlign: opts.ta || "center", verticalAlign: opts.va || "middle",
    containerId: opts.container || null, originalText: txt, autoResize: true,
    lineHeight: 1.25,
  });
  if (opts.container) addBound(opts.container, eid, "text");
  return eid;
}

function arrow(x1, y1, x2, y2, opts = {}) {
  const eid = opts.id || id();
  const dx = x2 - x1, dy = y2 - y1;
  const points = opts.points || [[0, 0], [dx, dy]];
  elements.push({
    id: eid, type: "arrow", x: x1, y: y1,
    width: Math.abs(dx), height: Math.abs(dy), angle: 0,
    strokeColor: opts.stroke || "#868e96",
    backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: opts.sw || 2,
    strokeStyle: opts.ss || "solid",
    roughness: 0, opacity: opts.opacity || 100,
    groupIds: [], frameId: null,
    roundness: { type: 2 }, seed: seed(), version: 1, versionNonce: seed(),
    isDeleted: false, boundElements: null,
    updated: Date.now(), link: null, locked: false,
    points,
    startBinding: opts.from ? { elementId: opts.from, focus: 0, gap: 5 } : null,
    endBinding: opts.to ? { elementId: opts.to, focus: 0, gap: 5 } : null,
    startArrowhead: null, endArrowhead: "arrow",
    lastCommittedPoint: null,
  });
  if (opts.from) addBound(opts.from, eid, "arrow");
  if (opts.to) addBound(opts.to, eid, "arrow");
  return eid;
}

function line(x1, y1, x2, y2, opts = {}) {
  const eid = id();
  const dx = x2 - x1, dy = y2 - y1;
  elements.push({
    id: eid, type: "line", x: x1, y: y1,
    width: Math.abs(dx), height: Math.abs(dy), angle: 0,
    strokeColor: opts.stroke || "#dee2e6", backgroundColor: "transparent",
    fillStyle: "solid", strokeWidth: 1, strokeStyle: opts.ss || "dashed",
    roughness: 0, opacity: 60, groupIds: [], frameId: null,
    roundness: { type: 2 }, seed: seed(), version: 1, versionNonce: seed(),
    isDeleted: false, boundElements: null,
    updated: Date.now(), link: null, locked: false,
    points: [[0, 0], [dx, dy]],
    startBinding: null, endBinding: null,
    startArrowhead: null, endArrowhead: null,
    lastCommittedPoint: null,
  });
  return eid;
}

// ─── Color palette ───
const COL = {
  canon:     "#d3f9d8", // green tint
  rubric:    "#d0ebff", // blue tint
  lessons:   "#fff3bf", // yellow/orange tint
  proposals: "#e5dbff", // purple tint
  phase:     "#f8f9fa", // light gray
  gate:      "#e9ecef", // slightly darker gray
  sonnet:    "#f1f3f5",
  opus:      "#ffe8cc", // warm for Opus
  haiku:     "#d0ebff", // cool for Haiku
  review:    "#fff4e6", // warm tint for parallel review box
  scan:      "#fff9db", // scan sub-box
  arrow_flow:"#495057",
  arrow_rub: "#1971c2",
  arrow_can: "#2f9e44",
  arrow_les: "#e8590c",
  arrow_prop:"#7048e8",
};

// ─── Layout constants ───
const PW = 120, PH = 50;   // station box (compact)
const GAP = 18;             // horizontal gap
const GW = 50, GH = 50;    // gate diamond
const ROW_Y = 200;          // single pipeline row
const SRC_Y = 30;           // knowledge boxes

// ─── Title ───
text(30, 6, "Lens Quality Pipeline", { fs: 20, ta: "left", va: "top", stroke: "#1e1e1e" });

// ─── Knowledge boxes (small, top row) ───
const SRC_W = 130, SRC_H = 48;
const SRC_GAP = 20;
let sx = 30;

const canonBox = rect(sx, SRC_Y, SRC_W, SRC_H, { bg: COL.canon, stroke: "#2f9e44" });
text(0, 0, "Canon", { container: canonBox, fs: 12 }); sx += SRC_W + SRC_GAP;

const rubricBox = rect(sx, SRC_Y, SRC_W, SRC_H, { bg: COL.rubric, stroke: "#1971c2" });
text(0, 0, "Rubrics", { container: rubricBox, fs: 12 }); sx += SRC_W + SRC_GAP;

const lessonsBox = rect(sx, SRC_Y, SRC_W, SRC_H, { bg: COL.lessons, stroke: "#e8590c" });
text(0, 0, "Lessons", { container: lessonsBox, fs: 12 }); sx += SRC_W + SRC_GAP;

const proposalBox = rect(sx, SRC_Y, SRC_W, SRC_H, { bg: COL.proposals, stroke: "#7048e8" });
text(0, 0, "Proposals", { container: proposalBox, fs: 12 });

// ─── Station + gate builders ───
function phase(x, y, num, name, model, opts = {}) {
  const bg = model === "Opus" ? COL.opus : model === "Haiku" ? COL.haiku : opts.bg || COL.phase;
  const eid = rect(x, y, PW, PH, { bg, stroke: "#495057", ...opts });
  text(0, 0, `${num}. ${name}\n[${model}]`, { container: eid, fs: 11 });
  return { id: eid, cx: x + PW / 2, cy: y + PH / 2, r: x + PW, b: y + PH, x, y };
}

function gate(x, y, label, opts = {}) {
  const eid = diamond(x, y, GW, GH, { bg: COL.gate, stroke: "#adb5bd", ...opts });
  text(0, 0, label, { container: eid, fs: 9 });
  return { id: eid, cx: x + GW / 2, cy: y + GH / 2, r: x + GW, b: y + GH, x, y };
}

// ─── Single row: all 8 stations + 2 gates ───
let rx = 30;
const s1 = phase(rx, ROW_Y, 1, "plan", "Sonnet"); rx += PW + GAP;
const s2 = phase(rx, ROW_Y, 2, "structure", "Sonnet"); rx += PW + GAP;
const s3 = phase(rx, ROW_Y, 3, "implement", "Opus"); rx += PW + GAP;
const g35 = gate(rx, ROW_Y, "3.5"); rx += GW + GAP;
const s4 = phase(rx, ROW_Y, 4, "refactor", "Sonnet"); rx += PW + GAP;
const s5 = phase(rx, ROW_Y, 5, "dedupe", "Haiku"); rx += PW + GAP;
const s6 = phase(rx, ROW_Y, 6, "review", "Sonnet", { bg: COL.review }); rx += PW + GAP;
const s7 = phase(rx, ROW_Y, 7, "testing", "Sonnet"); rx += PW + GAP;
const s8 = phase(rx, ROW_Y, 8, "evaluation", "Sonnet"); rx += PW + GAP;
const g85 = gate(rx, ROW_Y, "8.5");

// ─── Annotation below S6: parallel scans ───
text(s6.cx, s6.b + 6, "gemini | codex | ai-smell", { fs: 9, ta: "center", va: "top", stroke: "#868e96" });
text(s6.cx, s6.b + 20, "dedupe \u2192 fix", { fs: 9, ta: "center", va: "top", stroke: "#868e96" });

// ─── Flow arrows ───
const all = [s1, s2, s3, g35, s4, s5, s6, s7, s8, g85];
for (let i = 0; i < all.length - 1; i++) {
  const a = all[i], b = all[i + 1];
  arrow(a.r, a.cy, b.x, b.cy, { stroke: COL.arrow_flow, from: a.id, to: b.id, sw: 2 });
}

// ─── Canon arrows (green, dashed) → S1-S5 ───
const canonSrcX = 30 + SRC_W / 2;
for (const s of [s1, s2, s3, s4, s5]) {
  arrow(canonSrcX, SRC_Y + SRC_H, s.cx, s.y, {
    stroke: COL.arrow_can, sw: 1, ss: "dashed", opacity: 40,
    points: [[0, 0], [s.cx - canonSrcX, s.y - SRC_Y - SRC_H]],
  });
}

// ─── Rubric arrows (blue, dashed) → S1, S6, S8 ───
const rubricSrcX = 30 + SRC_W + SRC_GAP + SRC_W / 2;
for (const s of [s1, s6, s8]) {
  arrow(rubricSrcX, SRC_Y + SRC_H, s.cx, s.y, {
    stroke: COL.arrow_rub, sw: 1, ss: "dashed", opacity: 40,
    points: [[0, 0], [s.cx - rubricSrcX, s.y - SRC_Y - SRC_H]],
  });
}

// ─── Lessons READ arrows (orange, dashed) → S1-S5 ───
const lessonSrcX = 30 + (SRC_W + SRC_GAP) * 2 + SRC_W / 2;
for (const s of [s1, s2, s3, s4, s5]) {
  arrow(lessonSrcX, SRC_Y + SRC_H, s.cx, s.y, {
    stroke: COL.arrow_les, sw: 1, ss: "dashed", opacity: 35,
    points: [[0, 0], [s.cx - lessonSrcX, s.y - SRC_Y - SRC_H]],
  });
}

// ─── Lessons WRITE arrows (orange, solid) S6, S8 → lessons ───
for (const s of [s6, s8]) {
  arrow(s.cx, s.y, lessonSrcX, SRC_Y + SRC_H, {
    stroke: "#e8590c", sw: 2, ss: "solid", opacity: 60,
    points: [[0, 0], [lessonSrcX - s.cx, SRC_Y + SRC_H - s.y]],
  });
}

// ─── Proposal arrows ───
const proposalSrcX = 30 + (SRC_W + SRC_GAP) * 3 + SRC_W / 2;

// S8 writes proposals
arrow(s8.cx, s8.y, proposalSrcX, SRC_Y + SRC_H, {
  stroke: COL.arrow_prop, sw: 2, opacity: 60,
  points: [[0, 0], [proposalSrcX - s8.cx, SRC_Y + SRC_H - s8.y]],
});
// S1 reads proposals
arrow(proposalSrcX, SRC_Y + SRC_H, s1.cx, s1.y, {
  stroke: COL.arrow_prop, sw: 1, ss: "dashed", opacity: 40,
  points: [[0, 0], [s1.cx - proposalSrcX, s1.y - SRC_Y - SRC_H]],
});

// ─── Legend (compact, one line) ───
const LX = 30, LY = ROW_Y + PH + 50;

rect(LX, LY, 14, 10, { bg: COL.sonnet, stroke: "#adb5bd", sw: 1 });
text(LX + 18, LY, "Sonnet", { fs: 10, ta: "left", va: "top", stroke: "#868e96" });

rect(LX + 80, LY, 14, 10, { bg: COL.opus, stroke: "#adb5bd", sw: 1 });
text(LX + 98, LY, "Opus", { fs: 10, ta: "left", va: "top", stroke: "#868e96" });

rect(LX + 148, LY, 14, 10, { bg: COL.haiku, stroke: "#adb5bd", sw: 1 });
text(LX + 166, LY, "Haiku", { fs: 10, ta: "left", va: "top", stroke: "#868e96" });

line(LX + 230, LY + 5, LX + 250, LY + 5, { stroke: COL.arrow_can, ss: "dashed" });
text(LX + 256, LY, "Canon", { fs: 10, ta: "left", va: "top", stroke: "#868e96" });

line(LX + 310, LY + 5, LX + 330, LY + 5, { stroke: COL.arrow_rub, ss: "dashed" });
text(LX + 336, LY, "Rubric", { fs: 10, ta: "left", va: "top", stroke: "#868e96" });

line(LX + 390, LY + 5, LX + 410, LY + 5, { stroke: COL.arrow_les, ss: "dashed" });
text(LX + 416, LY, "Lessons \u2193", { fs: 10, ta: "left", va: "top", stroke: "#868e96" });

line(LX + 490, LY + 5, LX + 510, LY + 5, { stroke: "#e8590c", ss: "solid" });
text(LX + 516, LY, "Lessons \u2191", { fs: 10, ta: "left", va: "top", stroke: "#868e96" });

line(LX + 590, LY + 5, LX + 610, LY + 5, { stroke: COL.arrow_prop, ss: "dashed" });
text(LX + 616, LY, "Proposals", { fs: 10, ta: "left", va: "top", stroke: "#868e96" });

// ─── Patch boundElements ───
for (const el of elements) {
  const bounds = boundMap.get(el.id);
  el.boundElements = bounds || [];
}

// ─── Output ───
const doc = {
  type: "excalidraw",
  version: 2,
  source: "https://excalidraw.com",
  elements,
  appState: {
    viewBackgroundColor: "#ffffff",
    gridSize: null,
    scrollX: 0,
    scrollY: 0,
    zoom: { value: 1 },
    currentItemFontFamily: 1,
  },
  files: {},
};

process.stdout.write(JSON.stringify(doc, null, 2));
