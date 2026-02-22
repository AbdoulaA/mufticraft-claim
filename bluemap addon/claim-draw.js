(() => {
  // ===== Config =====
  const GRID = 1; // 1=block, 16=chunk
  const STORAGE_KEY = "mufticraft_draw_points_v5";
  const snap = (n) => Math.round(n / GRID) * GRID;

  // ===== API Config (NEW) =====
const API_URL = "https://api.mufticraft.store/api/claims";
  const WORLD_NAME = "world"; // change if needed

  // ===== Targets =====
  const target = document.querySelector("#map-container") || window;
  const root = document.querySelector("#app") || document.body;

  // ===== Overlay container (toggle pointerEvents to lock camera) =====
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.pointerEvents = "none"; // Draw OFF = click-through
  overlay.style.zIndex = "999999";
  root.appendChild(overlay);

  // Prevent browser weirdness when overlay captures events
  overlay.addEventListener("pointerdown", (e) => e.preventDefault(), {
    passive: false,
  });
  overlay.addEventListener("pointermove", (e) => e.preventDefault(), {
    passive: false,
  });
  overlay.addEventListener("pointerup", (e) => e.preventDefault(), {
    passive: false,
  });
  overlay.addEventListener("contextmenu", (e) => e.preventDefault(), {
    passive: false,
  }); // no right-click menu

  // ===== Canvas for yellow blocks =====
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  overlay.appendChild(canvas);

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redrawAll();
  }
  window.addEventListener("resize", resize);

  // ===== Toolbar =====
  const bar = document.createElement("div");
  bar.style.position = "fixed";
  bar.style.left = "16px";
  bar.style.bottom = "16px";
  bar.style.display = "flex";
  bar.style.flexWrap = "wrap";
  bar.style.gap = "8px";
  bar.style.alignItems = "center";
  bar.style.padding = "10px";
  bar.style.borderRadius = "14px";
  bar.style.border = "1px solid rgba(255,255,255,0.18)";
  bar.style.background = "rgba(0,0,0,0.38)";
  bar.style.backdropFilter = "blur(10px)";
  bar.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
  bar.style.pointerEvents = "auto";
  bar.style.maxWidth = "calc(100vw - 32px)";
  overlay.appendChild(bar);

  const mkBtn = (label) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.padding = "10px 14px";
    b.style.borderRadius = "12px";
    b.style.border = "1px solid rgba(255,255,255,0.20)";
    b.style.background = "rgba(255,255,255,0.10)";
    b.style.color = "white";
    b.style.fontWeight = "800";
    b.style.cursor = "pointer";
    b.onmouseenter = () => (b.style.background = "rgba(255,255,255,0.16)");
    b.onmouseleave = () => (b.style.background = "rgba(255,255,255,0.10)");
    return b;
  };

  const drawBtn = mkBtn("Draw OFF");
  const modeBtn = mkBtn("Mode: Paint");
  const undoBtn = mkBtn("Undo");
  const clearBtn = mkBtn("Clear");
  const saveBtn = mkBtn("Save");
  const submitBtn = mkBtn("Submit"); // NEW

  const status = document.createElement("div");
  status.style.color = "rgba(255,255,255,0.9)";
  status.style.fontSize = "12px";
  status.style.fontWeight = "800";
  status.style.padding = "0 6px";
  status.style.whiteSpace = "nowrap";
  status.textContent = "Ready";

  bar.append(drawBtn, modeBtn, undoBtn, clearBtn, saveBtn, submitBtn, status);
  const setStatus = (t) => (status.textContent = t);

  // ===== State =====
  let drawing = false;
  let painting = false;

  // mode: "paint" | "erase"
  let mode = "paint";

  let points = []; // {x,y,z}  (kept exactly)
  let pointSet = new Set(); // "x,y,z" (kept exactly)

  let mapViewer = null;
  let Vector3Ctor = null;

  let lastPaintKey = null;
  let lastPaintAt = 0;

  // ===== Capture MapViewer from camera event =====
  function tryCaptureMapViewer(ev) {
    const cm = ev?.detail?.controlsManager;
    const mv = cm?.mapViewer || cm?.data?.mapViewer || ev?.detail?.mapViewer;
    const real = mv?.mapViewer ? mv.mapViewer : mv;
    if (real && real.isMapViewer) mapViewer = real;
  }
  target.addEventListener("bluemapCameraMoved", tryCaptureMapViewer);

  // ===== Overlay capture toggle (locks camera) =====
  function setOverlayCapture(on) {
    overlay.style.pointerEvents = on ? "auto" : "none";
    canvas.style.pointerEvents = "none";
    bar.style.pointerEvents = "auto";
  }

  // ===== Projection helpers =====
  function worldToScreen(x, y, z) {
    if (!mapViewer?.camera || !Vector3Ctor) return null;
    const v = new Vector3Ctor(x, y, z);
    v.project(mapViewer.camera);
    const px = (v.x * 0.5 + 0.5) * window.innerWidth;
    const py = (-v.y * 0.5 + 0.5) * window.innerHeight;
    if (!isFinite(px) || !isFinite(py)) return null;
    return { x: px, y: py, ndcZ: v.z };
  }

  function blockScreenSizeAt(x, y, z) {
    const a = worldToScreen(x, y, z);
    const b = worldToScreen(x + 1, y, z);
    const c = worldToScreen(x, y, z + 1);
    if (!a || !b || !c) return null;
    const w = Math.hypot(b.x - a.x, b.y - a.y);
    const h = Math.hypot(c.x - a.x, c.y - a.y);
    return { w: Math.max(6, w), h: Math.max(6, h) };
  }

  function drawBlockMarker(x, y, z) {
    const p = worldToScreen(x + 0.5, y + 0.5, z + 0.5);
    if (!p || p.ndcZ > 1) return;
    const size = blockScreenSizeAt(x, y, z) || { w: 12, h: 12 };

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(250, 204, 21, 0.55)";
    ctx.strokeStyle = "rgba(250, 204, 21, 0.95)";
    ctx.lineWidth = 2;
    ctx.fillRect(p.x - size.w / 2, p.y - size.h / 2, size.w, size.h);
    ctx.strokeRect(p.x - size.w / 2, p.y - size.h / 2, size.w, size.h);
    ctx.restore();
  }

  function redrawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const pt of points) drawBlockMarker(pt.x, pt.y, pt.z);
  }

  function keyOf(bx, by, bz) {
    return `${bx},${by},${bz}`;
  }

  function addPoint(bx, by, bz) {
    const key = keyOf(bx, by, bz);
    if (pointSet.has(key)) return false;
    pointSet.add(key);
    points.push({ x: bx, y: by, z: bz });
    return true;
  }

  function removePoint(bx, by, bz) {
    const key = keyOf(bx, by, bz);
    if (!pointSet.has(key)) return false;
    pointSet.delete(key);
    const idx = points.findIndex((p) => p.x === bx && p.y === by && p.z === bz);
    if (idx >= 0) points.splice(idx, 1);
    return true;
  }

  // ===== UI actions =====
  function updateButtons() {
    drawBtn.textContent = drawing ? "Draw ON" : "Draw OFF";
    drawBtn.style.background = drawing
      ? "rgba(250, 204, 21, 0.95)"
      : "rgba(255,255,255,0.10)";
    drawBtn.style.color = drawing ? "#0b1b3a" : "white";

    modeBtn.textContent = mode === "paint" ? "Mode: Paint" : "Mode: Erase";
    modeBtn.style.background =
      mode === "erase" ? "rgba(239, 68, 68, 0.95)" : "rgba(255,255,255,0.10)";
    modeBtn.style.color = "white";
  }

  function setActive(on) {
    drawing = on;
    setOverlayCapture(on); // lock camera when drawing
    if (!on) {
      painting = false;
      lastPaintKey = null;
    }
    updateButtons();
    setStatus(on ? `Draw ON (${mode}) — drag to ${mode}` : "Ready");
  }

  drawBtn.onclick = () => setActive(!drawing);

  modeBtn.onclick = () => {
    mode = mode === "paint" ? "erase" : "paint";
    updateButtons();
    setStatus(
      drawing ? `Draw ON (${mode}) — drag to ${mode}` : `Mode set to ${mode}`,
    );
  };

  undoBtn.onclick = () => {
    const last = points.pop();
    if (last) pointSet.delete(keyOf(last.x, last.y, last.z));
    redrawAll();
    setStatus(`Undo. points=${points.length}`);
  };

  clearBtn.onclick = () => {
    points = [];
    pointSet = new Set();
    redrawAll();
    setStatus("Cleared.");
  };

  saveBtn.onclick = () => {
    const payload = { grid: GRID, points };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    alert(`Saved to localStorage: ${STORAGE_KEY} (${points.length} blocks)`);
    console.log("[draw] saved:", payload);
  };

  // ===== Apply paint/erase based on mode =====
  function applyMode(bx, by, bz) {
    if (mode === "paint") {
      const ok = addPoint(bx, by, bz);
      return ok ? "painted" : "already";
    } else {
      const ok = removePoint(bx, by, bz);
      return ok ? "erased" : "notfound";
    }
  }

  // ===== Receive map-hit from MapViewer.js =====
  target.addEventListener("bluemapMapInteraction", (ev) => {
    const d = ev.detail || {};
    const hit = d.hiresHit || d.hit;
    const p = hit?.point;
    if (!p) return;

    if (!Vector3Ctor && p?.constructor) Vector3Ctor = p.constructor;

    const bx = snap(Math.floor(p.x));
    const by = Math.floor(p.y);
    const bz = snap(Math.floor(p.z));

    if (!drawing) {
      setStatus(`Selected x=${bx} y=${by} z=${bz} (turn Draw ON)`);
      return;
    }

    const key = keyOf(bx, by, bz);
    if (key === lastPaintKey) return;

    const result = applyMode(bx, by, bz);
    redrawAll();

    if (result === "painted")
      setStatus(`Painted (${bx}, ${bz}) blocks=${points.length}`);
    else if (result === "erased")
      setStatus(`Erased (${bx}, ${bz}) blocks=${points.length}`);
    else if (result === "already")
      setStatus(`Already painted (${bx}, ${bz}) blocks=${points.length}`);
    else
      setStatus(`Nothing to erase at (${bx}, ${bz}) blocks=${points.length}`);

    lastPaintKey = key;
  });

  // ===== Drag paint/erase: call mapViewer.handleMapInteraction while dragging =====
  function paintAtClientXY(clientX, clientY) {
    if (!drawing || !painting) return;
    if (!mapViewer?.handleMapInteraction) return;

    const now = performance.now();
    if (now - lastPaintAt < 16) return; // ~60fps
    lastPaintAt = now;

    mapViewer.handleMapInteraction(
      { x: clientX, y: clientY },
      { __muftiPaint: true },
    );
  }

  // Pointer listeners on overlay (so BlueMap never receives them when Draw ON)
  overlay.addEventListener(
    "pointerdown",
    (e) => {
      if (!drawing) return;

      // If we never captured mapViewer yet, grab it from the last cameraMoved quickly
      // (fallback: keep drawing on click only)
      painting = true;
      lastPaintKey = null;

      // Right mouse button -> temporary erase while held
      if (e.button === 2) {
        mode = "erase";
        updateButtons();
      }

      paintAtClientXY(e.clientX, e.clientY);
    },
    { capture: true, passive: false },
  );

  overlay.addEventListener(
    "pointermove",
    (e) => {
      if (!painting) return;
      paintAtClientXY(e.clientX, e.clientY);
    },
    { capture: true, passive: false },
  );

  function stopPaint() {
    painting = false;
    lastPaintKey = null;
  }

  overlay.addEventListener("pointerup", stopPaint, { capture: true });
  overlay.addEventListener("pointercancel", stopPaint, { capture: true });
  overlay.addEventListener("pointerleave", stopPaint, { capture: true });

  // Keep overlay aligned with camera changes
  target.addEventListener("bluemapRenderFrame", () => {
    if (points.length) redrawAll();
  });

  /**********************************************************
   * NEW: Convert painted blocks -> ordered border polygon
   * We treat each painted (x,z) as a filled cell and extract the outside boundary.
   * Output is vertices in order: [{x,z}, ...]
   **********************************************************/
  function getCellSetXZ() {
    const s = new Set();
    for (const p of points) {
      s.add(`${p.x},${p.z}`);
    }
    return s;
  }

  // Returns an ordered list of boundary vertices (grid corners) in world coords.
  function extractOutlineVertices(cellSet) {
    // Build directed boundary edges along missing neighbors.
    // Each cell is [x,x+1] x [z,z+1] in XZ.
    const edges = new Map(); // key "x1,z1|x2,z2" -> {a:{x,z}, b:{x,z}}
    const addEdge = (ax, az, bx, bz) => {
      const k = `${ax},${az}|${bx},${bz}`;
      edges.set(k, { a: { x: ax, z: az }, b: { x: bx, z: bz } });
    };

    for (const key of cellSet) {
      const [xStr, zStr] = key.split(",");
      const x = parseInt(xStr, 10);
      const z = parseInt(zStr, 10);

      // Neighbor checks
      const nN = cellSet.has(`${x},${z - 1}`); // north (z-1)
      const nS = cellSet.has(`${x},${z + 1}`); // south (z+1)
      const nW = cellSet.has(`${x - 1},${z}`); // west (x-1)
      const nE = cellSet.has(`${x + 1},${z}`); // east (x+1)

      // If no neighbor on that side, add boundary edge (clockwise)
      // North side: (x,z) -> (x+1,z)
      if (!nN) addEdge(x, z, x + 1, z);
      // East side: (x+1,z) -> (x+1,z+1)
      if (!nE) addEdge(x + 1, z, x + 1, z + 1);
      // South side: (x+1,z+1) -> (x,z+1)
      if (!nS) addEdge(x + 1, z + 1, x, z + 1);
      // West side: (x,z+1) -> (x,z)
      if (!nW) addEdge(x, z + 1, x, z);
    }

    if (edges.size === 0) return [];

    // Build adjacency from a->b (each vertex has 0/1 outgoing in a simple outline)
    const out = new Map(); // "x,z" -> {x,z} next
    for (const e of edges.values()) {
      out.set(`${e.a.x},${e.a.z}`, e.b);
    }

    // Find a start vertex: smallest (z then x) for stability
    let startKey = null;
    for (const k of out.keys()) {
      if (!startKey) startKey = k;
      else {
        const [sx, sz] = startKey.split(",").map(Number);
        const [kx, kz] = k.split(",").map(Number);
        if (kz < sz || (kz === sz && kx < sx)) startKey = k;
      }
    }

    // Walk the loop
    const loop = [];
    const seen = new Set();
    let curKey = startKey;

    for (let i = 0; i < 200000; i++) {
      if (!curKey) break;
      if (seen.has(curKey)) break;
      seen.add(curKey);

      const [cx, cz] = curKey.split(",").map(Number);
      loop.push({ x: cx, z: cz });

      const nxt = out.get(curKey);
      if (!nxt) break;
      curKey = `${nxt.x},${nxt.z}`;
      if (curKey === startKey) break;
    }

    // Convert grid-corner loop into block-coordinate vertices.
    // These are corner coords; for polygon in block space, this is fine.
    // We'll simplify collinear points to reduce vertex count.
    return simplifyCollinear(loop);
  }

  function simplifyCollinear(poly) {
    if (poly.length < 4) return poly;

    const keep = [];
    const n = poly.length;

    const isCollinear = (a, b, c) => {
      const abx = b.x - a.x,
        abz = b.z - a.z;
      const bcx = c.x - b.x,
        bcz = c.z - b.z;
      return abx * bcz - abz * bcx === 0; // cross product == 0
    };

    for (let i = 0; i < n; i++) {
      const prev = poly[(i - 1 + n) % n];
      const cur = poly[i];
      const next = poly[(i + 1) % n];

      if (!isCollinear(prev, cur, next)) keep.push(cur);
    }

    // Ensure at least 3
    return keep.length >= 3 ? keep : poly;
  }

  async function submitClaimPolygon(verticesXZ) {
    const payload = {
      world: WORLD_NAME,
      vertices: verticesXZ.map((v) => ({ x: v.x, z: v.z })),
    };

    setStatus("Submitting claim…");
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      console.warn("[submit] failed", res.status, text);
      setStatus(`Submit failed: ${res.status}`);
      alert(`Submit failed: ${res.status}\n${text}`);
      return;
    }

    console.log("[submit] ok:", text);
    setStatus("Submitted ✅");
    alert(`Submitted ✅\n${text}`);
  }

  submitBtn.onclick = async () => {
    if (points.length < 1) {
      alert("Draw something first.");
      return;
    }

    const cellSet = getCellSetXZ();
    const outline = extractOutlineVertices(cellSet);

    if (outline.length < 3) {
      alert(
        "Could not extract a valid outline. Try drawing a thicker border or closed shape.",
      );
      return;
    }

    console.log("[outline vertices]", outline);
    await submitClaimPolygon(outline);
  };

  // ===== init =====
  resize();
  setActive(false);
  updateButtons();
  console.log(
    "[mufticraft-draw] ready. Toggle Draw ON, choose Mode Paint/Erase, then drag. Submit sends polygon to API.",
  );
})();
