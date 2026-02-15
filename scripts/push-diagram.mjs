#!/usr/bin/env node
// Push pipeline.excalidraw elements to the local Excalidraw server API.
// Usage: node scripts/push-diagram.mjs

import { readFileSync } from 'fs';
import http from 'http';

const d = JSON.parse(readFileSync('pipeline.excalidraw', 'utf8'));

// Convert Excalidraw file elements to the server's CreateElement schema
const converted = d.elements.map(el => {
  const out = {
    id: el.id,
    type: el.type,
    x: el.x,
    y: el.y,
  };
  if (el.width != null) out.width = el.width;
  if (el.height != null) out.height = el.height;
  if (el.backgroundColor && el.backgroundColor !== 'transparent') out.backgroundColor = el.backgroundColor;
  if (el.strokeColor) out.strokeColor = el.strokeColor;
  if (el.strokeWidth != null) out.strokeWidth = el.strokeWidth;
  if (el.strokeStyle) out.strokeStyle = el.strokeStyle;
  if (el.roughness != null) out.roughness = el.roughness;
  if (el.opacity != null && el.opacity !== 100) out.opacity = el.opacity;
  if (el.text) out.text = el.text;
  if (el.fontSize) out.fontSize = el.fontSize;
  if (el.fontFamily) out.fontFamily = String(el.fontFamily);
  if (el.groupIds && el.groupIds.length) out.groupIds = el.groupIds;
  if (el.roundness) out.roundness = el.roundness;
  if (el.fillStyle) out.fillStyle = el.fillStyle;

  // Arrow-specific
  if (el.points) out.points = el.points;
  if (el.startBinding) out.start = { id: el.startBinding.elementId };
  if (el.endBinding) out.end = { id: el.endBinding.elementId };
  if (el.startArrowhead !== undefined) out.startArrowhead = el.startArrowhead;
  if (el.endArrowhead !== undefined) out.endArrowhead = el.endArrowhead;

  // Mark contained text for label merging
  if (el.containerId) {
    out._skip = true;
    out._containerId = el.containerId;
  }

  return out;
});

// Merge contained text into parent as label
const containerMap = new Map();
for (const e of converted) {
  if (e._skip) containerMap.set(e._containerId, e.text);
}

const toSend = [];
for (const e of converted) {
  if (e._skip) continue;
  const label = containerMap.get(e.id);
  if (label) e.label = { text: label };
  delete e._skip;
  delete e._containerId;
  toSend.push(e);
}

console.log(`Pushing ${toSend.length} elements to localhost:3000...`);

const body = JSON.stringify({ elements: toSend });

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/elements/batch',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
}, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log(`Done: ${result.count} elements created`);
      } else {
        console.error('Server error:', result.error);
      }
    } catch {
      console.error('Bad response:', data.slice(0, 200));
    }
  });
});

req.on('error', (err) => {
  console.error('Connection failed:', err.message);
});

req.write(body);
req.end();
