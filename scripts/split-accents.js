/**
 * Split accent SVGs that contain two separate designs into individual files.
 * Analyzes path coordinates to determine left/right or top/bottom grouping.
 */
const fs = require('fs');
const path = require('path');

const ACCENTS_DIR = path.join(__dirname, '..', 'public', 'assets', 'accents');

// Parse all numeric coordinates from an SVG path d attribute
function extractCoords(d) {
  // Match all numbers (including decimals and negatives)
  const nums = d.match(/-?\d+\.?\d*/g);
  if (!nums) return { minX: 0, maxX: 0, minY: 0, maxY: 0, cx: 0, cy: 0 };
  
  // SVG path commands use pairs of x,y - we'll extract rough bounding box
  // by treating consecutive number pairs as x,y coordinates
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  // Simple approach: scan through the d string for M/L/C/S/Q/T/A commands
  // and extract the coordinate pairs that follow
  const coords = [];
  const re = /([MLHVCSQTAZ])\s*([-\d.,\s]*)/gi;
  let match;
  while ((match = re.exec(d)) !== null) {
    const cmd = match[1];
    const args = match[2].trim();
    if (!args) continue;
    const numbers = args.match(/-?\d+\.?\d*/g);
    if (!numbers) continue;
    
    const upper = cmd.toUpperCase();
    if (upper === 'H') {
      numbers.forEach(n => {
        const x = parseFloat(n);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      });
    } else if (upper === 'V') {
      numbers.forEach(n => {
        const y = parseFloat(n);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      });
    } else if (upper === 'Z') {
      // no coords
    } else {
      // Treat pairs as x,y
      for (let i = 0; i < numbers.length - 1; i += 2) {
        const x = parseFloat(numbers[i]);
        const y = parseFloat(numbers[i + 1]);
        if (!isNaN(x) && !isNaN(y)) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          coords.push([x, y]);
        }
      }
    }
  }
  
  if (minX === Infinity) minX = 0;
  if (maxX === -Infinity) maxX = 0;
  if (minY === Infinity) minY = 0;
  if (maxY === -Infinity) maxY = 0;
  
  return {
    minX, maxX, minY, maxY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

function splitSvg(filename) {
  const filepath = path.join(ACCENTS_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  
  // Extract viewBox dimensions
  const vbMatch = content.match(/viewBox="([^"]+)"/);
  const widthMatch = content.match(/width="([^"]+)"/);
  const heightMatch = content.match(/height="([^"]+)"/);
  if (!vbMatch) { console.log(`No viewBox in ${filename}`); return; }
  
  const [vbX, vbY, vbW, vbH] = vbMatch[1].split(/\s+/).map(Number);
  const svgWidth = parseFloat(widthMatch?.[1] || vbW);
  const svgHeight = parseFloat(heightMatch?.[1] || vbH);
  
  // Extract all path elements
  const pathRe = /<path\s+d="([^"]+)"([^/]*)\/?>/g;
  const paths = [];
  let pm;
  while ((pm = pathRe.exec(content)) !== null) {
    const d = pm[1];
    const attrs = pm[2];
    const bounds = extractCoords(d);
    paths.push({ d, attrs, bounds, full: pm[0] });
  }
  
  console.log(`\n${filename}: ${paths.length} paths, viewBox=${vbW}x${vbH}`);
  
  // Determine split axis - use horizontal (left/right) for wide SVGs
  const isWide = vbW > vbH * 1.3;
  const splitAxis = isWide ? 'x' : 'x'; // default to horizontal split
  const midpoint = splitAxis === 'x' ? vbW / 2 : vbH / 2;
  
  console.log(`  Split axis: ${splitAxis}, midpoint: ${midpoint.toFixed(1)}`);
  
  // Group paths
  const groupA = []; // left or top
  const groupB = []; // right or bottom
  
  paths.forEach((p, i) => {
    const center = splitAxis === 'x' ? p.bounds.cx : p.bounds.cy;
    const span = splitAxis === 'x' 
      ? (p.bounds.maxX - p.bounds.minX) 
      : (p.bounds.maxY - p.bounds.minY);
    const svgSpan = splitAxis === 'x' ? vbW : vbH;
    
    // If the path spans more than 70% of the SVG, it might be shared/background
    if (span > svgSpan * 0.7) {
      // Put in both groups
      groupA.push(p);
      groupB.push(p);
      console.log(`  Path ${i}: SHARED (span=${span.toFixed(1)}, center=${center.toFixed(1)})`);
    } else if (center < midpoint) {
      groupA.push(p);
      console.log(`  Path ${i}: LEFT/TOP (center=${center.toFixed(1)})`);
    } else {
      groupB.push(p);
      console.log(`  Path ${i}: RIGHT/BOTTOM (center=${center.toFixed(1)})`);
    }
  });
  
  if (groupA.length === 0 || groupB.length === 0) {
    console.log(`  WARNING: Could not split - one group is empty!`);
    return;
  }
  
  // Compute bounding boxes for each group
  function groupBounds(group) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    group.forEach(p => {
      minX = Math.min(minX, p.bounds.minX);
      maxX = Math.max(maxX, p.bounds.maxX);
      minY = Math.min(minY, p.bounds.minY);
      maxY = Math.max(maxY, p.bounds.maxY);
    });
    const pad = 2;
    return {
      x: Math.max(0, minX - pad),
      y: Math.max(0, minY - pad),
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    };
  }
  
  const boundsA = groupBounds(groupA);
  const boundsB = groupBounds(groupB);
  
  // Generate SVG files
  function makeSvg(group, bounds) {
    const pathsStr = group.map(p => `  <path d="${p.d}"${p.attrs}/>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.w.toFixed(3)}" height="${bounds.h.toFixed(3)}" viewBox="${bounds.x.toFixed(3)} ${bounds.y.toFixed(3)} ${bounds.w.toFixed(3)} ${bounds.h.toFixed(3)}">
${pathsStr}
</svg>`;
  }
  
  const baseName = filename.replace('.svg', '');
  const fileA = `${baseName}a.svg`;
  const fileB = `${baseName}b.svg`;
  
  fs.writeFileSync(path.join(ACCENTS_DIR, fileA), makeSvg(groupA, boundsA));
  fs.writeFileSync(path.join(ACCENTS_DIR, fileB), makeSvg(groupB, boundsB));
  
  console.log(`  Created: ${fileA} (${groupA.length} paths, ${boundsA.w.toFixed(0)}x${boundsA.h.toFixed(0)})`);
  console.log(`  Created: ${fileB} (${groupB.length} paths, ${boundsB.w.toFixed(0)}x${boundsB.h.toFixed(0)})`);
  
  return { fileA, fileB, boundsA, boundsB, groupA, groupB };
}

// Split the problematic accents
const toSplit = ['ACCENT_03.svg', 'ACCENT_07.svg', 'ACCENT_09.svg', 'ACCENT_20.svg', 'ACCENT_21.svg'];

const results = {};
toSplit.forEach(f => {
  const result = splitSvg(f);
  if (result) results[f] = result;
});

console.log('\nDone! Split files created in accents directory.');
