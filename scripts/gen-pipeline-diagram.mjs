
 Phas#!/usr/bin/env node
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
  arrow_flow:"#495057",
  arrow_rub: "#1971c2",
  arrow_can: "#2f9e44",
  arrow_les: "#e8590c",
  arrow_prop:"#7048e8",
};

// ─── Layout constants ───
const PW = 170, PH = 72;   // phase box
const GAP = 38;             // horizontal gap
const GW = 70, GH = 70;    // gate diamond
const ROW1_Y = 420;
const ROW2_Y = 700;
const SRC_Y = 80;

// ─── Title ───
text(50, 20, "Lens Quality Pipeline", { fs: 28, ta: "left", va: "top", stroke: "#1e1e1e" });
text(50, 58, "11 phases · 4 machine gates · rubric + canon + lessons feedback loop", { fs: 14, ta: "left", va: "top", stroke: "#868e96" });

// ─── Source boxes ───
const SRC_W = 210, SRC_H = 100;

// Canon
const canonBox = rect(120, SRC_Y, SRC_W, SRC_H, { bg: COL.canon, stroke: "#2f9e44" });
text(0, 0, "Canon\n(Expert Knowledge)", { container: canonBox, fs: 16 });
text(125, SRC_Y + SRC_H + 6, "10 base brain skills\n+ domain auto-detect", { fs: 11, ta: "left", va: "top", stroke: "#868e96" });

// Rubric
const rubricBox = rect(400, SRC_Y, SRC_W, SRC_H, { bg: COL.rubric, stroke: "#1971c2" });
text(0, 0, "Rubric\n(Production Criteria)", { container: rubricBox, fs: 16 });
text(405, SRC_Y + SRC_H + 6, "base + product-quality\n+ web-api / cli / data / \u00b5svc", { fs: 11, ta: "left", va: "top", stroke: "#868e96" });

// Lessons
const lessonsBox = rect(680, SRC_Y, SRC_W, SRC_H, { bg: COL.lessons, stroke: "#e8590c" });
text(0, 0, "Lessons\n(Feedback Loop)", { container: lessonsBox, fs: 16 });
text(685, SRC_Y + SRC_H + 6, "workflow-skills/lessons.md\n.claude/lessons.md", { fs: 11, ta: "left", va: "top", stroke: "#868e96" });

// Eval Proposals
const proposalBox = rect(960, SRC_Y, SRC_W, SRC_H, { bg: COL.proposals, stroke: "#7048e8" });
text(0, 0, "Eval Proposals\n(Pipeline Feedback)", { container: proposalBox, fs: 16 });
text(965, SRC_Y + SRC_H + 6, ".claude/eval-proposals.md\nPENDING → surfaced in P1", { fs: 11, ta: "left", va: "top", stroke: "#868e96" });

// ─── Section labels ───
text(50, ROW1_Y - 35, "PLANNING & IMPLEMENTATION", { fs: 13, ta: "left", va: "top", stroke: "#868e96", ff: 3 });
text(50, ROW2_Y - 35, "QUALITY & VALIDATION", { fs: 13, ta: "left", va: "top", stroke: "#868e96", ff: 3 });

// ─── Phase builder ───
function phase(x, y, num, name, model, opts = {}) {
  const bg = model === "Opus" ? COL.opus : model === "Haiku" ? COL.haiku : COL.phase;
  const eid = rect(x, y, PW, PH, { bg, stroke: "#495057", ...opts });
  text(0, 0, `${num}. ${name}\n[${model}]`, { container: eid, fs: 13 });
  return { id: eid, cx: x + PW / 2, cy: y + PH / 2, r: x + PW, b: y + PH, x, y };
}

function gate(x, y, label, opts = {}) {
  const eid = diamond(x, y, GW, GH, { bg: COL.gate, stroke: "#adb5bd", ...opts });
  text(0, 0, label, { container: eid, fs: 10 });
  return { id: eid, cx: x + GW / 2, cy: y + GH / 2, r: x + GW, b: y + GH, x, y };
}

// ─── Row 1: Phases 1–5 + gate 3.5 ───
let rx = 100;
const p1 = phase(rx, ROW1_Y, 1, "create-plan", "Sonnet"); rx += PW + GAP;
const p2 = phase(rx, ROW1_Y, 2, "structure-first", "Sonnet"); rx += PW + GAP;
const p3 = phase(rx, ROW1_Y, 3, "implement-plan", "Opus"); rx += PW + GAP;
const g35 = gate(rx + 10, ROW1_Y + 1, "3.5\nGate"); rx += GW + GAP + 20;
const p4 = phase(rx, ROW1_Y, 4, "refactor-fix", "Sonnet"); rx += PW + GAP;
const p5 = phase(rx, ROW1_Y, 5, "dedupe-fix", "Haiku");

// ─── Row 2: Phases 6–11 + gates ───
rx = 100;
const p6 = phase(rx, ROW2_Y, 6, "gemini-fix", "Sonnet"); rx += PW + GAP;
const g75 = gate(rx + 10, ROW2_Y + 1, "7.5\nQodana"); rx += GW + GAP + 20;
const p7 = phase(rx, ROW2_Y, 7, "codex-fix", "Sonnet"); rx += PW + GAP;
const p8 = phase(rx, ROW2_Y, 8, "adversarial", "Sonnet"); rx += PW + GAP;
const p9 = phase(rx, ROW2_Y, 9, "ai-smell-fix", "Haiku"); rx += PW + GAP;
const g95 = gate(rx + 10, ROW2_Y + 1, "9.5\nTest"); rx += GW + GAP + 20;
const p10 = phase(rx, ROW2_Y, 10, "write-tests", "Sonnet"); rx += PW + GAP;
const p11 = phase(rx, ROW2_Y, 11, "final-eval", "Sonnet"); rx += PW + GAP;
const g115 = gate(rx + 10, ROW2_Y + 1, "11.5\nFinal");

// ─── Flow arrows (phase to phase) ───
const flowPairs = [
  [p1, p2], [p2, p3], [p3, g35], [g35, p4], [p4, p5],
];
for (const [a, b] of flowPairs) {
  arrow(a.r, a.cy, b.x, b.cy, { stroke: COL.arrow_flow, from: a.id, to: b.id, sw: 2 });
}

// Row transition: p5 → p6 (down and left)
arrow(p5.cx, p5.b, p5.cx, ROW2_Y - 15, { stroke: COL.arrow_flow, sw: 2 });
arrow(p5.cx, ROW2_Y - 15, p6.r + 5, ROW2_Y - 15, { stroke: COL.arrow_flow, sw: 2,
  points: [[0, 0], [-(p5.cx - p6.r - 5), 0]] });
arrow(p6.r + 5, ROW2_Y - 15, p6.cx, p6.y, { stroke: COL.arrow_flow, sw: 2,
  points: [[0, 0], [-(p6.r + 5 - p6.cx), p6.y - ROW2_Y + 15]] });

// Row 2 flow
const flowPairs2 = [
  [p6, g75], [g75, p7], [p7, p8], [p8, p9], [p9, g95], [g95, p10], [p10, p11], [p11, g115],
];
for (const [a, b] of flowPairs2) {
  arrow(a.r, a.cy, b.x, b.cy, { stroke: COL.arrow_flow, from: a.id, to: b.id, sw: 2 });
}

// ─── Canon arrows (green, dashed) ───
// Phases that read canon: 1, 2, 3, 4, 5, 8, 10
const canonTargets = [p1, p2, p3, p4, p5, p8, p10];
for (const p of canonTargets) {
  arrow(canonBox.x || 225, SRC_Y + SRC_H, p.cx, p.y, {
    stroke: COL.arrow_can, sw: 1, ss: "dashed", opacity: 50,
    from: canonBox, to: p.id,
    points: [[0, 0], [p.cx - 225, p.y - SRC_Y - SRC_H]],
  });
}

// ─── Rubric arrows (blue, dashed) ───
// Phases that read rubric: 1, 6, 7, 11
const rubricTargets = [p1, p6, p7, p11];
for (const p of rubricTargets) {
  arrow(505, SRC_Y + SRC_H, p.cx, p.y, {
    stroke: COL.arrow_rub, sw: 1, ss: "dashed", opacity: 50,
    from: rubricBox, to: p.id,
    points: [[0, 0], [p.cx - 505, p.y - SRC_Y - SRC_H]],
  });
}

// ─── Lessons READ arrows (orange, dashed) ───
// Phases that READ lessons: 1, 2, 3, 4, 5, 9, 11(dedup only)
const lessonsReadTargets = [p1, p2, p3, p4, p5, p9, p11];
for (const p of lessonsReadTargets) {
  arrow(785, SRC_Y + SRC_H, p.cx, p.y, {
    stroke: COL.arrow_les, sw: 1, ss: "dashed", opacity: 40,
    from: lessonsBox, to: p.id,
    points: [[0, 0], [p.cx - 785, p.y - SRC_Y - SRC_H]],
  });
}

// ─── Lessons WRITE arrows (orange, solid, pointing UP) ───
// Phases that WRITE lessons: 6, 8, 9, 11
const lessonsWriteTargets = [p6, p8, p9, p11];
for (const p of lessonsWriteTargets) {
  arrow(p.cx, p.y, 785, SRC_Y + SRC_H, {
    stroke: "#e8590c", sw: 2, ss: "solid", opacity: 70,
    from: p.id, to: lessonsBox,
    points: [[0, 0], [785 - p.cx, SRC_Y + SRC_H - p.y]],
  });
}

// ─── Proposal arrows ───
// P11 writes proposals
arrow(p11.cx + 20, p11.y, 1065, SRC_Y + SRC_H, {
  stroke: COL.arrow_prop, sw: 2, opacity: 70,
  from: p11.id, to: proposalBox,
  points: [[0, 0], [1065 - p11.cx - 20, SRC_Y + SRC_H - p11.y]],
});
// P1 reads proposals
arrow(1065, SRC_Y + SRC_H, p1.cx + 20, p1.y, {
  stroke: COL.arrow_prop, sw: 1, ss: "dashed", opacity: 50,
  from: proposalBox, to: p1.id,
  points: [[0, 0], [p1.cx + 20 - 1065, p1.y - SRC_Y - SRC_H]],
});

// ─── Legend ───
const LX = 100, LY = 920;
text(LX, LY, "LEGEND", { fs: 13, ta: "left", va: "top", stroke: "#868e96", ff: 3 });

// Model colors
rect(LX, LY + 25, 20, 14, { bg: COL.sonnet, stroke: "#adb5bd", sw: 1 });
text(LX + 28, LY + 25, "Sonnet", { fs: 12, ta: "left", va: "top", stroke: "#495057" });

rect(LX + 110, LY + 25, 20, 14, { bg: COL.opus, stroke: "#adb5bd", sw: 1 });
text(LX + 138, LY + 25, "Opus", { fs: 12, ta: "left", va: "top", stroke: "#495057" });

rect(LX + 200, LY + 25, 20, 14, { bg: COL.haiku, stroke: "#adb5bd", sw: 1 });
text(LX + 228, LY + 25, "Haiku", { fs: 12, ta: "left", va: "top", stroke: "#495057" });

// Arrow types
line(LX + 340, LY + 32, LX + 370, LY + 32, { stroke: COL.arrow_flow, ss: "solid" });
text(LX + 378, LY + 25, "Pipeline flow", { fs: 12, ta: "left", va: "top", stroke: "#495057" });

line(LX + 510, LY + 32, LX + 540, LY + 32, { stroke: COL.arrow_can, ss: "dashed" });
text(LX + 548, LY + 25, "Canon reads", { fs: 12, ta: "left", va: "top", stroke: "#495057" });

line(LX + 680, LY + 32, LX + 710, LY + 32, { stroke: COL.arrow_rub, ss: "dashed" });
text(LX + 718, LY + 25, "Rubric reads", { fs: 12, ta: "left", va: "top", stroke: "#495057" });

line(LX + 860, LY + 32, LX + 890, LY + 32, { stroke: COL.arrow_les, ss: "dashed" });
text(LX + 898, LY + 25, "Lessons read", { fs: 12, ta: "left", va: "top", stroke: "#495057" });

line(LX + 1040, LY + 32, LX + 1070, LY + 32, { stroke: "#e8590c", ss: "solid" });
text(LX + 1078, LY + 25, "Lessons write", { fs: 12, ta: "left", va: "top", stroke: "#495057" });

line(LX + 1220, LY + 32, LX + 1250, LY + 32, { stroke: COL.arrow_prop, ss: "dashed" });
text(LX + 1258, LY + 25, "Proposal read/write", { fs: 12, ta: "left", va: "top", stroke: "#495057" });

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
  },
  files: {},
};

process.stdout.write(JSON.stringify(doc, null, 2));
