---
title: "360° Panorama Viewer — Part 2: The Code, Line by Line"
description: "A code-focused walkthrough of the PanoramaViewer Astro component — WebGL setup, geometry construction, event wiring, quaternion gyro tracking, synchronization guards, and failure recovery patterns."
date: 2026-06-24
tags: ["webgl", "three.js", "panorama", "astro", "typescript", "quaternion", "device-orientation", "code-walkthrough"]
---

In [Part 1](/posts/panorama-viewer-webgl-geometry-and-motion), we explored the mathematics behind the panorama viewer — equirectangular projections, quaternion algebra, SLERP interpolation, and coordinate system transformations. This post covers the same ground from a **code implementation** perspective: how the component is structured, why each line exists, what patterns solve what problems, and where the gotchas hide.

---

## 1. Component Structure — Astro's Island Architecture

### 1.1 The Frontmatter

```astro
---
interface Props {
  src: string;
  alt: string;
}
const { src, alt } = Astro.props;
---
```

Astro components run their frontmatter at **build time** (SSG) or **request time** (SSR). The props are typed with TypeScript. `src` is the panorama image URL, `alt` is accessibility text.

The props are passed to the DOM via data attributes rather than being serialized into the script:

```html
<div class="pano-wrap" id="pano-wrap" aria-label={alt} role="img" data-src={src}>
```

**Why `data-src` instead of passing directly to the script?** Astro's `<script>` tags are bundled and deduplicated — they don't have access to per-instance props. The DOM serves as the bridge: the script reads `wrap.dataset.src` at runtime.

### 1.2 The HTML Skeleton

```html
<canvas id="pano-canvas"></canvas>
```

A bare canvas — no width/height attributes. The renderer sizes it programmatically via `renderer.setSize()`. Setting dimensions in HTML would fight with the CSS `width: 100%; height: 100%` and cause blurriness.

```html
<div class="pano-loader" id="pano-loader">
  <div class="pano-spinner"></div>
  <span class="pano-progress" id="pano-progress">0%</span>
  <span class="pano-error" id="pano-error" hidden></span>
</div>
```

The loader overlay sits above the canvas (via `z-index: 2`). It's hidden with `display: none` on success — not removed from DOM, because that would complicate error recovery paths.

```html
<button class="pano-motion" id="pano-motion" type="button" aria-pressed="false" hidden>
```

The motion button starts `hidden`. It's conditionally shown by JavaScript only when gyro hardware is detected. This prevents a flash of non-functional UI on desktop.

### 1.3 The Script Tag

```html
<script>
  import { WebGLRenderer, Scene, ... } from "three";
  // ...
</script>
```

Astro processes `<script>` tags through Vite — this import is tree-shaken at build time. Only the imported Three.js modules end up in the bundle. No `client:load` directive needed — Astro scripts in `.astro` files are always client-side.

---

## 2. Initialization and Guard Patterns

### 2.1 The Setup Function

```typescript
function setupPanoramaViewer() {
  const wrap = document.getElementById("pano-wrap") as HTMLElement | null;
  const canvas = document.getElementById("pano-canvas");
  const loader = document.getElementById("pano-loader") as HTMLElement | null;
  // ...

  if (!wrap || !canvas || !loader) return;
```

**DOM queries by ID** — fast, unambiguous, no risk of matching a wrong element. The null checks are an early exit pattern: if the DOM isn't ready or the elements were removed, bail immediately.

### 2.2 The Re-binding Trick

```typescript
const src = wrap.dataset.src!;
const el = wrap;  // Re-bind as definitely non-null
```

TypeScript narrows `wrap` to `HTMLElement` after the null check, but closures inside callbacks lose this narrowing (the compiler can't prove the variable isn't reassigned between definition and invocation). Re-binding to `const el` preserves the narrowing in all nested scopes.

The `!` on `dataset.src` is safe because the Astro template guarantees the attribute exists.

### 2.3 Double-Initialization Guard

```typescript
if (el.dataset.panoInitialized === "true") return;
el.dataset.panoInitialized = "true";
```

**Problem:** The setup function is called from two places:

```typescript
document.addEventListener("astro:page-load", setupPanoramaViewer);
setupPanoramaViewer();  // immediate call for first page load
```

The immediate call handles the initial page load (where `astro:page-load` may have already fired). The event listener handles View Transition navigations. Without the guard, navigating away and back would create a second WebGL context on the same canvas.

**Why a data attribute instead of a module-level boolean?** If the user navigates away and the cleanup handler fires (removing the old DOM), the data attribute dies with the element. When the page is re-created with fresh DOM, the new element has no `data-pano-initialized` — init runs correctly.

### 2.4 The Block Scope

```typescript
{
  // ── Renderer ──
  let renderer: WebGLRenderer;
  // ... entire viewer logic
}
```

The naked `{ }` block is unusual. It creates a closure scope that:
1. Prevents variable leaks to the outer `setupPanoramaViewer` scope
2. Allows `let`/`const` declarations that would otherwise conflict if `setupPanoramaViewer` were called twice (though the guard prevents this)
3. Groups the entire viewer state as a logical unit

---

## 3. WebGL Renderer Setup

```typescript
let renderer: WebGLRenderer;
try {
  renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false });
} catch (e) {
  // ... error handling
  return;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

### 3.1 Constructor Options Explained

| Option | Value | Reason |
|--------|-------|--------|
| `canvas` | DOM element | Reuse existing canvas (don't create a new one) |
| `antialias` | `false` | Panoramas are texture-bound, not geometry-bound. AA wastes GPU cycles smoothing edges you can't see |
| `alpha` | `false` | Opaque background. Setting `false` allows the browser to skip alpha compositing — measurable perf win on mobile |

### 3.2 Why try/catch on Constructor?

The `WebGLRenderer` constructor calls `canvas.getContext("webgl2")` (or `"webgl"` fallback). This can throw if:
- The GPU is blocklisted
- Too many contexts are active (hard limit varies: 8 on Chrome, 16 on Firefox)
- The driver crashed recently and the browser refuses new contexts

The `try/catch` is the **only** reliable way to detect this — there's no `navigator.gpu.available` API for WebGL.

### 3.3 Pixel Ratio Clamping

```typescript
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

`setPixelRatio` controls the internal resolution of the framebuffer. On a 3× device (iPhone 14 Pro) with a 390×844 CSS-pixel viewport:
- At 3×: internal buffer = 1170×2532 = 2.96M pixels
- At 2×: internal buffer = 780×1688 = 1.32M pixels (55% fewer pixels)

The visual difference is negligible for panoramic textures (the texture is the resolution bottleneck, not the canvas). The performance and thermal difference is significant.

---

## 4. Scene and Camera Construction

```typescript
const scene = new Scene();
const camera = new PerspectiveCamera(90, 1, 0.1, 1000);
camera.rotation.order = "YXZ";
```

### 4.1 Camera Parameters

- `fov: 90` — initial vertical field of view in degrees
- `aspect: 1` — placeholder; immediately overwritten by `resize()`
- `near: 0.1` — near clipping plane distance
- `far: 1000` — far clipping plane distance

The near/far values define the depth buffer range. Our geometry is at radius 500, so we need `near < 500 < far`. The ratio `far/near = 10000` determines depth buffer precision — more than adequate when we only have a single surface.

### 4.2 Rotation Order

```typescript
camera.rotation.order = "YXZ";
```

This is set **once** at initialization and affects every subsequent `.rotation.set()` call. If we forgot this line, Three.js defaults to `"XYZ"` — pitch before yaw — which causes gimbal lock at the poles and unintuitive drag behaviour.

### 4.3 Material

```typescript
const material = new MeshBasicMaterial({ map: null, side: BackSide });
```

`MeshBasicMaterial` — no lighting calculations. The panorama is a photograph; applying lighting would darken parts of the sphere, which makes no physical sense. Setting `map: null` initially lets us create the material before the texture loads; we assign it later:

```typescript
material.map = tex;
material.needsUpdate = true;
```

`needsUpdate = true` forces Three.js to recompile the material's shader program. Without it, the shader was compiled for `map: null` (solid color) and won't sample the texture.

---

## 5. Texture Loading — The Full Implementation

```typescript
const texLoader = new TextureLoader();

const LOAD_TIMEOUT_MS = 30000;
let loadTimedOut = false;
const loadTimer = setTimeout(() => {
  loadTimedOut = true;
  if (progressEl) progressEl.textContent = "";
  if (errorEl) {
    errorEl.hidden = false;
    errorEl.textContent = "Loading is taking longer than expected.";
  }
}, LOAD_TIMEOUT_MS);
```

### 5.1 The Timeout Pattern

The timeout is **non-cancelling** — it doesn't abort the fetch. It only shows a warning. This is a deliberate UX choice: a slow connection might eventually succeed, and cancelling would guarantee failure.

The `loadTimedOut` boolean is checked in both the error callback (to provide a specific message) and is implicitly irrelevant on success (the timer is cleared).

### 5.2 Success Callback — Texture Configuration

```typescript
texLoader.load(
  src,
  (tex) => {
    clearTimeout(loadTimer);
    tex.colorSpace = SRGBColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = LinearFilter;
    tex.wrapS = RepeatWrapping;
    tex.repeat.x = -1;
```

Line by line:

**`tex.colorSpace = SRGBColorSpace`** — Tells Three.js the texture is in sRGB. The renderer will convert to linear space for correct lighting math (even though we use `MeshBasicMaterial`, this affects gamma-correct blending).

**`tex.generateMipmaps = false`** — Mipmaps are progressively downsampled copies of the texture (½, ¼, ⅛ sizes). They're used when a texture is viewed at a distance. For a panorama:
- The camera is always at the centre — no "distance" varies
- Mipmaps would cost 33% extra VRAM (sum of geometric series: 1 + 1/4 + 1/16 + ... = 4/3)
- For a 16K×8K texture at 4 bytes/pixel: ~512MB → 683MB with mipmaps. Not acceptable on mobile.

**`tex.minFilter = LinearFilter`** — Required when `generateMipmaps = false`. The default `LinearMipmapLinearFilter` would sample non-existent mipmaps, causing a black texture on some GPUs.

**`tex.wrapS = RepeatWrapping`** — Enables the negative repeat trick. Default `ClampToEdgeWrapping` doesn't allow `repeat.x = -1`.

**`tex.repeat.x = -1`** — Flips the horizontal UV to counter the BackSide mirror. Without this, text in the panorama reads backwards.

### 5.3 Geometry Decision Based on Aspect Ratio

```typescript
const imgW = tex.image.width;
const imgH = tex.image.height;
const ratio = imgW / imgH;

let mesh: Mesh;
if (ratio > 3) {
  // Cylindrical
} else {
  // Spherical
}
```

The `tex.image` is the decoded `HTMLImageElement`. Its `width`/`height` are the natural pixel dimensions, available synchronously after load.

**Why ratio > 3?** An equirectangular image has ratio 2:1. Anything significantly wider than 2:1 means the image covers very little vertical angle — a sphere would waste surface. The threshold of 3 catches images like 4:1, 6:1, 9:1 strip panoramas while keeping 2.5:1 (partial photospheres with ~144° vertical coverage) on the sphere path.

### 5.4 Spherical Geometry Construction

```typescript
const fullHeight = imgW / 2;
const thetaLength = Math.min(Math.PI, (imgH / fullHeight) * Math.PI);
const thetaStart = (Math.PI - thetaLength) / 2;
const geometry = new SphereGeometry(500, 60, 40, 0, Math.PI * 2, thetaStart, thetaLength);
mesh = new Mesh(geometry, material);
```

`fullHeight = imgW / 2` — the height an image would have if it covered a full 180° vertically. This is the reference for proportional computation.

The `Math.min(Math.PI, ...)` guard prevents `thetaLength` from exceeding π (180°). This could happen if someone provides a nearly-square image — we cap at a full hemisphere rather than attempting impossible geometry.

### 5.5 Cylindrical Geometry Construction

```typescript
const radius = 500;
const height = 2 * Math.PI * radius * (imgH / imgW);
const geometry = new CylinderGeometry(radius, radius, height, 64, 1, true);
mesh = new Mesh(geometry, material);
```

`CylinderGeometry` parameters: `(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded)`.

- Equal radii (no taper) — it's a true cylinder, not a cone
- `openEnded: true` — no cap geometry at top/bottom. Caps would show a solid colour disc if the user managed to look past the edge
- 64 radial segments (vs 60 for sphere) — because cylinders have no latitude bands, the radial count is the sole smoothness control

### 5.6 Post-Load Setup

```typescript
scene.add(mesh);
loader.style.display = "none";
needsRender = true;
resize();
animate();
setTimeout(() => {
  if (hint) hint.style.opacity = "0";
}, 3500);
```

Order matters:
1. `scene.add(mesh)` — mesh must be in scene before first render
2. `loader.style.display = "none"` — hide overlay, reveal canvas
3. `needsRender = true` — flag first frame
4. `resize()` — set correct canvas dimensions (may have changed during load)
5. `animate()` — start the render loop (called once; it self-chains via rAF)
6. 3.5s timeout to fade hint — gives user time to notice the interaction hint

### 5.7 Progress Callback

```typescript
(progressEvent) => {
  if (progressEvent.lengthComputable && progressEvent.total > 0) {
    const pct = Math.round((progressEvent.loaded / progressEvent.total) * 100);
    if (progressEl) progressEl.textContent = `${pct}%`;
  } else if (progressEvent.loaded > 0) {
    const mb = (progressEvent.loaded / (1024 * 1024)).toFixed(1);
    if (progressEl) progressEl.textContent = `${mb} MB`;
  }
}
```

Two display modes:
1. **Percentage** — when the server sends `Content-Length` header
2. **MB loaded** — fallback when no `Content-Length` (common with CDNs that use chunked transfer encoding)

The `progressEvent.total > 0` guard catches the case where `lengthComputable` is true but `total` is 0 (observed on some proxy servers).

---

## 6. View State Variables

```typescript
let lon = 0;
let lat = 0;
let fov = 90;
let LAT_MAX = 85;
const FOV_MIN = 30;
const FOV_MAX = 110;
let needsRender = false;
let manualViewDirty = false;
let paused = false;
let destroyed = false;
const DEG2RAD = Math.PI / 180;
```

### 6.1 Mutable vs. Const

- `lon`, `lat`, `fov` — continuously modified by input handlers
- `LAT_MAX` — modified once (at geometry creation for cylinders), then stable
- `FOV_MIN/MAX` — truly constant, never change
- `needsRender` — flag, toggled every frame
- `manualViewDirty` — synchronization flag between Euler and quaternion paths
- `destroyed` — one-way latch (false → true, never back)
- `DEG2RAD` — precomputed constant (avoids repeated division in hot paths)

### 6.2 The `needsRender` Flag

This is the render-on-demand gate. Any code path that changes visual state must set it:

```typescript
// Zoom changed:
needsRender = true;

// Resize:
needsRender = true;

// Orientation event received:
needsRender = true;
```

The flag is consumed in the animation loop:

```typescript
if (moved || needsRender) {
  renderer.render(scene, camera);
  needsRender = false;
}
```

**Why not just always render?** A panorama viewer spends most of its time idle. On a mobile device, continuous 60fps rendering:
- Drains battery (GPU never clocks down)
- Generates heat (thermal throttling triggers within 30-60s)
- Prevents background tab optimizations

### 6.3 The `manualViewDirty` Flag

This flag distinguishes between "camera was moved via lon/lat" and "camera was moved via quaternion SLERP":

```typescript
// Drag handler:
lon += velocityX;
manualViewDirty = true;

// Animation loop:
if (manualViewDirty) {
  camera.rotation.set(lat * DEG2RAD, -lon * DEG2RAD, 0, "YXZ");
  manualViewDirty = false;
}
```

If we always called `camera.rotation.set(...)`, it would overwrite the quaternion that SLERP just set — the two control paths would fight.

---

## 7. Pointer Event Handling — The Full Implementation

### 7.1 Pointer Down

```typescript
el.addEventListener("pointerdown", (e) => {
  if (activePointers.size === 0) {
    didDrag = false;
    didPinch = false;
  }
  activePointers.add(e.pointerId);
  pointerX = e.clientX;
  pointerY = e.clientY;
  velocityX = 0;
  velocityY = 0;
  el.setPointerCapture(e.pointerId);
  el.style.cursor = "grabbing";
});
```

**`activePointers.size === 0` check** — only reset drag/pinch flags on the *first* finger down. A second finger shouldn't clear the `didDrag` flag that records whether we already started dragging.

**`el.setPointerCapture(e.pointerId)`** — critical. Without capture, moving the pointer outside the element boundary would stop receiving events. With capture, the element receives all pointer events until release, regardless of cursor position. This prevents "stuck drag" when the user moves fast.

**`velocityX = 0; velocityY = 0;`** — kill any ongoing momentum immediately. If the user taps during a spin, the panorama should stop dead.

### 7.2 Pointer Move

```typescript
el.addEventListener("pointermove", (e) => {
  if (activePointers.size === 0 || isPinching) return;
  const fovScale = fov / 90;
  const dx = (e.clientX - pointerX) * DRAG_SENSITIVITY * fovScale;
  const dy = (e.clientY - pointerY) * DRAG_SENSITIVITY * fovScale;
  velocityX = -dx;
  velocityY = dy;
  didDrag = true;
  lon += velocityX;
  lat += velocityY;
  lat = Math.max(-LAT_MAX, Math.min(LAT_MAX, lat));
  pointerX = e.clientX;
  pointerY = e.clientY;
  manualViewDirty = true;
  needsRender = true;
});
```

**Guard: `activePointers.size === 0`** — ignore stray move events when no button is pressed (happens on touch devices that fire pointermove for hover).

**Guard: `isPinching`** — if two fingers are down, don't interpret movement as a drag.

**`velocityX = -dx`** — we store the per-frame displacement as velocity. When the user releases, this last value becomes the initial momentum. The negation makes "drag right" = "scene moves right" = "camera turns left".

**`lat` clamping inline** — applied immediately, not deferred. If we deferred, the unclamped value could accumulate during rapid swipes, causing a snapping effect when rendering catches up.

**`pointerX = e.clientX`** — update reference point after computing delta. If we updated first, `dx` would always be 0.

### 7.3 Pointer Up

```typescript
el.addEventListener("pointerup", (e) => {
  activePointers.delete(e.pointerId);
  if (activePointers.size === 0) {
    if (motionEnabled && didDrag && !didPinch) resetMotionOrigin();
    el.style.cursor = "grab";
  }
});
```

**`motionEnabled && didDrag && !didPinch`** — recalibrate gyro ONLY if:
- Motion mode is on (otherwise no-op)
- The user actually dragged (not just tapped)
- It wasn't a pinch gesture (pinch has its own recalibration path)

The `didPinch` check prevents double-recalibration: pinch-end already calls `resetMotionOrigin()`.

### 7.4 Pointer Cancel

```typescript
el.addEventListener("pointercancel", (e) => {
  activePointers.delete(e.pointerId);
  if (activePointers.size === 0) {
    velocityX = 0;
    velocityY = 0;
    el.style.cursor = "grab";
  }
});
```

`pointercancel` fires when the browser decides to take over the gesture (e.g., system gesture, palm rejection on tablets). We kill momentum entirely — it's unsafe to assume the last velocity was intentional.

---

## 8. Zoom Implementation

### 8.1 Wheel Zoom

```typescript
el.addEventListener("wheel", (e) => {
  e.preventDefault();
  fov += e.deltaY * 0.05;
  fov = Math.max(FOV_MIN, Math.min(FOV_MAX, fov));
  camera.fov = fov;
  camera.updateProjectionMatrix();
  needsRender = true;
}, { passive: false });
```

**`e.preventDefault()`** — prevents page scroll. Without this, scrolling over the panorama would scroll the page behind it.

**`{ passive: false }`** — required to call `preventDefault()`. Passive listeners (the modern default for touch/wheel) cannot prevent the default action. Explicitly declaring non-passive tells the browser to wait for our handler before deciding whether to scroll.

**`camera.updateProjectionMatrix()`** — must be called after changing `fov`. Three.js caches the projection matrix; changing the property alone does nothing until you rebuild the matrix.

### 8.2 Touch Pinch Zoom

```typescript
let lastPinchDist = 0;

el.addEventListener("touchstart", (e) => {
  if (e.touches.length === 2) {
    isPinching = true;
    didPinch = true;
    velocityX = 0;
    velocityY = 0;
    cachedScreenAngle = screenAngle();
    lastPinchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: true });
```

**Why `touchstart`/`touchmove`/`touchend` alongside pointer events?** Pinch is a two-finger gesture that doesn't map cleanly to the pointer event model. With pointer events, you'd get two independent `pointermove` streams and have to manually compute the inter-finger distance. Touch events give you both fingers in one event (`e.touches`), making pinch detection trivial.

**`cachedScreenAngle = screenAngle()`** — lock the screen orientation reading. If the user starts a pinch and inadvertently crosses the portrait/landscape threshold, we don't want the gyro's screen correction to suddenly jump 90°.

**`{ passive: true }`** — `touchstart` doesn't need `preventDefault()` (we don't want to prevent scrolling from starting, we just want to detect pinch).

### 8.3 Touch Move (Pinch)

```typescript
el.addEventListener("touchmove", (e) => {
  if (e.touches.length === 2) {
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const delta = lastPinchDist - dist;
    fov += delta * 0.1;
    fov = Math.max(FOV_MIN, Math.min(FOV_MAX, fov));
    camera.fov = fov;
    camera.updateProjectionMatrix();
    lastPinchDist = dist;
    needsRender = true;
    e.preventDefault();
  }
}, { passive: false });
```

**`lastPinchDist - dist`** — positive when fingers move together (pinch in = zoom out). The sign convention matches the wheel: positive delta = zoom out (larger FOV).

**`e.preventDefault()`** here prevents the browser from interpreting the two-finger gesture as a page zoom (on browsers that support pinch-to-zoom). This requires `{ passive: false }`.

### 8.4 Touch End (Pinch Release)

```typescript
el.addEventListener("touchend", (e) => {
  if (e.touches.length < 2 && isPinching) {
    isPinching = false;
    cachedScreenAngle = null;
    if (motionEnabled) resetMotionOrigin();
    if (e.touches.length === 1) {
      pointerX = e.touches[0].clientX;
      pointerY = e.touches[0].clientY;
    }
  }
}, { passive: true });
```

**`e.touches.length < 2 && isPinching`** — only trigger transition when dropping FROM pinch. Without the `isPinching` check, every single-finger touchend would run this code.

**`cachedScreenAngle = null`** — unlock. Future orientation events will read the live value.

**Remaining finger sync:**
```typescript
if (e.touches.length === 1) {
  pointerX = e.touches[0].clientX;
  pointerY = e.touches[0].clientY;
}
```

This is the "finger transition" fix. After pinch ends with one finger still down, the `pointermove` handler will resume single-finger drag. Without this sync, the first `pointermove` would compute `dx = currentX - pointerX` where `pointerX` was set during the initial `pointerdown` (possibly hundreds of pixels away), causing a violent jump.

### 8.5 Double-Tap Reset

```typescript
let lastTapTime = 0;
el.addEventListener("touchend", (e) => {
  if (e.touches.length !== 0 || isPinching) return;
  const now = Date.now();
  if (now - lastTapTime < 300) {
    fov = 90;
    camera.fov = fov;
    camera.updateProjectionMatrix();
    needsRender = true;
    lastTapTime = 0;  // prevent triple-tap from triggering again
  } else {
    lastTapTime = now;
  }
}, { passive: true });
```

**`e.touches.length !== 0`** — only count when ALL fingers are up (full release).

**`isPinching`** guard — don't count the end of a pinch as a potential double-tap.

**`lastTapTime = 0` after trigger** — resets the detector so a third quick tap doesn't re-trigger.

---

## 9. Keyboard Input

```typescript
const KEYS: Record<string, boolean> = {};
const onKeyDown = (e: KeyboardEvent) => { KEYS[e.key] = true; needsRender = true; };
const onKeyUp = (e: KeyboardEvent) => { KEYS[e.key] = false; };
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
```

### 9.1 Why a Key Map Instead of Direct Handling?

Direct handling would apply rotation once per `keydown` event. But `keydown` repeats at the OS key-repeat rate (~30Hz on Windows, ~15Hz initially on macOS), which produces jerky rotation.

The key map pattern defers to the animation loop:

```typescript
// In animate():
if (KEYS["ArrowLeft"] || KEYS["a"] || KEYS["A"]) {
  lon -= 0.35;
  manualViewDirty = true;
  moved = true;
}
```

This applies rotation at the display refresh rate (60Hz), producing smooth motion independent of key-repeat settings.

### 9.2 Multiple Keys Simultaneously

The map naturally supports diagonal movement:
- `ArrowLeft` + `ArrowUp` → both `lon -= 0.35` and `lat += 0.35` per frame
- Works with any combination, including zoom keys (`+`/`-`)

### 9.3 Event Listener Cleanup

```typescript
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
```

These are on `window` (not `el`) so they work regardless of focus. The cleanup handler removes them:

```typescript
window.removeEventListener("keydown", onKeyDown);
window.removeEventListener("keyup", onKeyUp);
```

Named function references are stored specifically for removal — anonymous arrow functions can't be removed.

---

## 10. Device Motion — The Complete Implementation

### 10.1 Type Augmentation

```typescript
type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied" | "default">;
};
```

iOS 13+ added `requestPermission()` as a static method on `DeviceOrientationEvent`. The TypeScript DOM types don't include it. This augmentation adds it optionally — the `?` allows safe checking with `MotionEvent?.requestPermission`.

### 10.2 State Variables

```typescript
let motionEnabled = false;
let hasMotionTarget = false;
const MOTION_SMOOTHING = 0.18;
const motionEuler = new Euler(0, 0, 0, "YXZ");
const motionTargetQuaternion = new Quaternion();
const motionDeviceQuaternion = new Quaternion();
const motionCorrectionQuaternion = new Quaternion();
const motionScreenQuaternion = new Quaternion();
const motionZAxis = new Vector3(0, 0, 1);
const motionCameraAdjustment = new Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
```

**Why pre-allocate objects?** The `onDeviceOrientation` handler fires 60+ times per second. Creating `new Quaternion()` each time would generate garbage, triggering GC pauses that cause visible frame drops on mobile.

All quaternion/euler/vector objects are allocated once and reused via `.copy()`, `.set()`, `.multiply()` (mutating methods).

**`motionCameraAdjustment`** — pre-computed constant quaternion for the -90° X rotation. Never changes.

### 10.3 Screen Angle Helper

```typescript
function screenAngle() {
  if (cachedScreenAngle !== null) return cachedScreenAngle;
  if (typeof screen.orientation?.angle === "number") return screen.orientation.angle;
  const legacyWindow = window as Window & { orientation?: number };
  return typeof legacyWindow.orientation === "number" ? legacyWindow.orientation : 0;
}
```

Three fallback levels:
1. **Cached value** — during pinch, return the frozen angle
2. **`screen.orientation.angle`** — modern API (Chrome, Firefox)
3. **`window.orientation`** — deprecated iOS API (still needed on some WebViews)
4. **`0`** — default to portrait if nothing works

The `as Window & { orientation?: number }` cast is needed because TypeScript's strict DOM types removed `window.orientation`.

### 10.4 The Core Transform Function

```typescript
function setQuaternionFromDeviceOrientation(target: Quaternion, e: DeviceOrientationEvent) {
  const alpha = (e.alpha ?? 0) * DEG2RAD;
  const beta = (e.beta ?? 0) * DEG2RAD;
  const gamma = (e.gamma ?? 0) * DEG2RAD;
  const orient = screenAngle() * DEG2RAD;

  motionEuler.set(beta, alpha, -gamma, "YXZ");
  target.setFromEuler(motionEuler);
  target.multiply(motionCameraAdjustment);
  target.multiply(motionScreenQuaternion.setFromAxisAngle(motionZAxis, -orient));
}
```

**`e.alpha ?? 0`** — null coalescing. If the magnetometer hasn't initialized, alpha is null. We default to 0 (north) rather than crashing.

**`motionEuler.set(beta, alpha, -gamma, "YXZ")`** — the argument order is `(x, y, z, order)`. We place:
- `beta` (front-back tilt) in X position
- `alpha` (compass heading) in Y position
- `-gamma` (left-right tilt, negated) in Z position

This remapping is the W3C spec's intrinsic ZXY → extrinsic YXZ conversion.

**Three multiplications in sequence:**
```
target = Euler(device angles) × CameraAdjust(-90°X) × ScreenRotation(-orient°Z)
```

Quaternion multiplication is **right-to-left** in terms of rotation composition. The rightmost is applied first in world frame. So:
1. Start with device orientation
2. Adjust for "phone upright = camera forward"
3. Compensate for screen rotation

### 10.5 Sync Helper

```typescript
function syncLonLatFromCamera() {
  motionEuler.setFromQuaternion(camera.quaternion, "YXZ");
  lon = -motionEuler.y / DEG2RAD;
  lat = Math.max(-LAT_MAX, Math.min(LAT_MAX, motionEuler.x / DEG2RAD));
}
```

After SLERP modifies the camera quaternion, we decompose it back to Euler to keep `lon/lat` synchronized. The negation on `lon` reverses the same sign flip used in `camera.rotation.set(lat, -lon, 0)`.

The `lat` clamping here is a safety net — SLERP can produce values slightly beyond `LAT_MAX` during transitions. Without clamping, a subsequent manual drag would start from an out-of-bounds position.

### 10.6 The Orientation Event Handler

```typescript
function onDeviceOrientation(e: DeviceOrientationEvent) {
  if (!motionEnabled || e.alpha === null || e.beta === null || e.gamma === null) return;
  if (isPinching) return;

  setQuaternionFromDeviceOrientation(motionDeviceQuaternion, e);

  if (!hasMotionTarget) {
    motionCorrectionQuaternion
      .copy(camera.quaternion)
      .multiply(motionDeviceQuaternion.clone().invert());
  }

  motionTargetQuaternion
    .copy(motionCorrectionQuaternion)
    .multiply(motionDeviceQuaternion);
  hasMotionTarget = true;
  needsRender = true;
}
```

**Guard 1: `!motionEnabled`** — if user toggled off, ignore events (listener is removed, but belt-and-suspenders).

**Guard 2: null angles** — sensor not ready. Proceeding would produce `NaN` quaternions.

**Guard 3: `isPinching`** — pinch suppression (discussed in synchronization section).

**Calibration branch (`!hasMotionTarget`):**
```typescript
motionCorrectionQuaternion
  .copy(camera.quaternion)                        // start with current camera orientation
  .multiply(motionDeviceQuaternion.clone().invert());  // subtract current device orientation
```

Note `.clone().invert()` — we must clone before inverting because `.invert()` is a mutating operation. If we inverted `motionDeviceQuaternion` directly, we'd corrupt it for the next line.

**Target computation:**
```typescript
motionTargetQuaternion
  .copy(motionCorrectionQuaternion)     // apply the constant bias
  .multiply(motionDeviceQuaternion);    // then the live device rotation
```

This runs every frame (at sensor rate). The correction quaternion stays fixed between recalibrations.

### 10.7 Motion Button Toggle

```typescript
const onMotionButtonClick = async () => {
  if (!motionButton) return;

  if (motionEnabled) {
    // Turning OFF
    motionEnabled = false;
    window.removeEventListener("deviceorientation", onDeviceOrientation, true);
    resetMotionOrigin();
    setMotionButtonState();
    return;
  }

  // Turning ON
  const MotionEvent = window.DeviceOrientationEvent as DeviceOrientationEventWithPermission | undefined;
  if (MotionEvent?.requestPermission) {
    const permission = await MotionEvent.requestPermission();
    if (permission !== "granted") return;
  }

  motionEnabled = true;
  resetMotionOrigin();
  window.addEventListener("deviceorientation", onDeviceOrientation, true);
  setMotionButtonState();
};
```

**`async`** — needed for iOS permission request which returns a Promise.

**Turn-off path:**
1. Set flag to false
2. Remove listener (stops receiving events)
3. Reset origin (clears hasMotionTarget — if re-enabled later, fresh calibration occurs)
4. Update button visual state

**Turn-on path:**
1. Request permission (iOS only — the `?.` check skips this on Android/desktop)
2. If denied → silent return (no error shown — user made a conscious choice)
3. Set flag to true
4. Reset origin (ensures first event calibrates)
5. Add listener with `true` (capture phase — receives events before any child handlers could stopPropagation)
6. Update button visual state

### 10.8 Feature Detection

```typescript
if (motionButton && "DeviceOrientationEvent" in window && window.matchMedia("(pointer: coarse)").matches) {
  motionButton.hidden = false;
  motionButton.addEventListener("click", onMotionButtonClick);
}
```

Three conditions:
1. Button element exists in DOM
2. API is available (`"DeviceOrientationEvent" in window`)
3. Device has a touchscreen (`pointer: coarse`)

**Why check `pointer: coarse`?** Desktop Chrome and Firefox expose `DeviceOrientationEvent` in the API but have no physical gyroscope. Showing a motion button that does nothing confuses users. Touchscreen = likely mobile = likely has gyro.

This is a heuristic — it could false-positive (touch-screen laptop without gyro) or false-negative (desktop with external sensor). For a blog panorama viewer, it's good enough.

---

## 11. The Animation Loop

```typescript
function animate() {
  if (destroyed) return;
  requestAnimationFrame(animate);
  if (paused) return;

  let moved = false;

  // ── Momentum ──
  if (activePointers.size === 0) {
    if (Math.abs(velocityX) > MIN_VELOCITY || Math.abs(velocityY) > MIN_VELOCITY) {
      lon += velocityX;
      lat += velocityY;
      lat = Math.max(-LAT_MAX, Math.min(LAT_MAX, lat));
      velocityX *= FRICTION;
      velocityY *= FRICTION;
      manualViewDirty = true;
      moved = true;
    }
  }

  // ── SLERP ──
  if (motionEnabled && activePointers.size === 0 && !isPinching && hasMotionTarget) {
    if (1 - Math.abs(camera.quaternion.dot(motionTargetQuaternion)) > 0.000001) {
      camera.quaternion.slerp(motionTargetQuaternion, MOTION_SMOOTHING);
      syncLonLatFromCamera();
      moved = true;
    }
  }

  // ── Keyboard ──
  if (KEYS["ArrowLeft"]  || KEYS["a"] || KEYS["A"]) { lon -= 0.35; manualViewDirty = true; moved = true; }
  if (KEYS["ArrowRight"] || KEYS["d"] || KEYS["D"]) { lon += 0.35; manualViewDirty = true; moved = true; }
  if (KEYS["ArrowUp"]    || KEYS["w"] || KEYS["W"]) { lat = Math.min(LAT_MAX, lat + 0.35); manualViewDirty = true; moved = true; }
  if (KEYS["ArrowDown"]  || KEYS["s"] || KEYS["S"]) { lat = Math.max(-LAT_MAX, lat - 0.35); manualViewDirty = true; moved = true; }
  if (KEYS["+"] || KEYS["="]) { fov = Math.max(FOV_MIN, fov - 0.5); camera.fov = fov; camera.updateProjectionMatrix(); moved = true; }
  if (KEYS["-"])              { fov = Math.min(FOV_MAX, fov + 0.5); camera.fov = fov; camera.updateProjectionMatrix(); moved = true; }

  // ── Render ──
  if (moved || needsRender) {
    if (manualViewDirty) {
      camera.rotation.set(lat * DEG2RAD, -lon * DEG2RAD, 0, "YXZ");
      manualViewDirty = false;
    }
    renderer.render(scene, camera);
    needsRender = false;
  }
}
```

### 11.1 Loop Structure Decisions

**`if (destroyed) return;`** — first check. Don't call `requestAnimationFrame` if destroyed — this is the exit mechanism. The frame chain breaks here.

**`requestAnimationFrame(animate);`** — schedule next frame BEFORE doing work. This ensures even if processing takes >16ms, the next frame is already queued. Placing it after processing could cause frame drops.

**`if (paused) return;`** — after scheduling next frame. We still want the frame chain running (so it resumes when un-paused), but we skip all computation.

### 11.2 Priority Order: Momentum → SLERP → Keyboard → Render

This order is deliberate:

1. **Momentum first** — it modifies `lon/lat` and sets `manualViewDirty`. If SLERP runs after, it will override via quaternion.
2. **SLERP second** — it directly sets `camera.quaternion` and calls `syncLonLatFromCamera()`, which writes to `lon/lat` (potentially overriding momentum values). The guards (`activePointers.size === 0`) ensure only one of momentum/SLERP runs at a time.
3. **Keyboard third** — always applied additively. Even during motion mode, keyboard can nudge the view. This sets `manualViewDirty`.
4. **Render last** — applies either the Euler path (if `manualViewDirty`) or uses the quaternion already set by SLERP.

### 11.3 The SLERP Convergence Check

```typescript
if (1 - Math.abs(camera.quaternion.dot(motionTargetQuaternion)) > 0.000001) {
```

`quaternion.dot(target)` returns the 4D inner product — a cosine of the half-angle between them. When they're identical, the dot product is ±1 (the sign doesn't matter — `q` and `-q` represent the same rotation). The `Math.abs()` handles the double-cover.

`1 - |dot|` is essentially a distance metric. When it drops below 0.000001 (~0.16°), we consider the camera "arrived" and skip the SLERP. This prevents:
- Infinite asymptotic approach (SLERP never reaches exactly 0)
- Unnecessary render calls for sub-pixel movements
- Floating-point drift from millions of tiny SLERP operations

### 11.4 Keyboard Speed Values

```typescript
lon -= 0.35;  // degrees per frame
```

At 60fps: `0.35 × 60 = 21°/sec`. A full 360° rotation takes ~17 seconds — deliberate and controllable.

```typescript
fov = Math.max(FOV_MIN, fov - 0.5);  // zoom in 0.5° per frame
```

At 60fps: `0.5 × 60 = 30°/sec`. From max FOV (110°) to min (30°) takes ~2.7 seconds.

---

## 12. Resize Handling

```typescript
function resize() {
  const w = el.clientWidth;
  const h = el.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  needsRender = true;
}
const ro = new ResizeObserver(resize);
ro.observe(el);
```

### 12.1 Why ResizeObserver, Not `window.resize`?

`window.resize` only fires when the browser window changes size. It misses:
- CSS layout changes (sidebar collapse, accordion open)
- Container queries resizing the parent
- Soft keyboard appearing on mobile (changes viewport but not `window`)
- Astro View Transitions animating element size

`ResizeObserver` watches the element itself — any size change triggers the callback.

### 12.2 The Resize Sequence

1. `renderer.setSize(w, h)` — resizes the canvas element AND the internal framebuffer
2. `camera.aspect = w / h` — updates the projection matrix's aspect ratio
3. `camera.updateProjectionMatrix()` — recomputes the matrix with new aspect
4. `needsRender = true` — schedule a re-render with the new dimensions

Order matters: if we rendered before updating the projection matrix, one frame would show stretched content.

---

## 13. Visibility and Lifecycle

### 13.1 Tab Pause

```typescript
const onVisChange = () => {
  paused = document.hidden;
  if (!paused) needsRender = true;
};
document.addEventListener("visibilitychange", onVisChange);
```

When the tab becomes hidden, `paused = true` causes the animation loop to skip all processing. When revealed, we trigger one render to show the current state (in case the device moved while paused, the next SLERP cycle will smoothly correct it).

### 13.2 The Cleanup Handler

```typescript
const cleanup = () => {
  destroyed = true;
  ro.disconnect();
  window.removeEventListener("keydown", onKeyDown);
  window.removeEventListener("keyup", onKeyUp);
  document.removeEventListener("visibilitychange", onVisChange);
  motionButton?.removeEventListener("click", onMotionButtonClick);
  window.removeEventListener("deviceorientation", onDeviceOrientation, true);
  scene.traverse((obj) => {
    if (obj instanceof Mesh) {
      obj.geometry.dispose();
      if (obj.material.map) obj.material.map.dispose();
      obj.material.dispose();
    }
  });
  renderer.dispose();
};
document.addEventListener("astro:before-swap", cleanup, { once: true });
```

**`{ once: true }`** — auto-removes after firing. Prevents the cleanup from running twice if the event somehow fires again.

**Resource disposal order:**
1. `destroyed = true` — stops animation loop on next frame
2. `ro.disconnect()` — stop resize callbacks (they'd fail without a renderer)
3. Remove all event listeners — prevents callbacks from firing after disposal
4. `scene.traverse` → dispose geometry + textures + material — frees GPU memory (VRAM)
5. `renderer.dispose()` — releases the WebGL context itself

**Why dispose in this order?** If we disposed the renderer first, the traverse could trigger internal Three.js operations that reference the dead context. Geometry/texture disposal is safe without an active renderer — it's just freeing buffer handles.

---

## 14. CSS Patterns

### 14.1 Touch Action

```css
.pano-wrap {
  touch-action: none;
}
```

This tells the browser: "don't handle any touch gestures (scroll, pinch-zoom, swipe navigation) on this element — I will handle everything myself." Without this:
- Single-finger drag would trigger page scroll
- Two-finger pinch would trigger browser zoom
- Swipe from edge might trigger back navigation

### 14.2 Inset: 0

```css
.pano-wrap {
  position: absolute;
  inset: 0;
}
```

`inset: 0` is shorthand for `top: 0; right: 0; bottom: 0; left: 0`. Combined with `position: absolute`, it stretches the element to fill its positioned parent. The canvas inside then fills this with `width: 100%; height: 100%`.

### 14.3 Pointer Events on Overlay

```css
.pano-loader {
  pointer-events: none;
}
```

The loader overlay sits above the canvas visually (z-index: 2) but must not block pointer events from reaching the canvas beneath. Even while loading, the user might try to interact (or the loading completes and they should be able to immediately drag).

---

## 15. The Full Initialization Flow (Sequence)

```
1. Browser loads page → script executes
2. setupPanoramaViewer() called immediately
3. DOM elements queried by ID
4. Initialization guard checked
5. WebGLRenderer created (may throw → error path)
6. Scene + Camera + Material created
7. TextureLoader.load(src) called → async fetch begins
8. 30s timeout timer started
9. [Waiting for image...]
   ├── Progress events update UI
   ├── Timeout fires? → show warning (load continues)
   └── Error? → show message, exit
10. Image loaded successfully:
    a. Texture configured (colorspace, mipmaps, UV flip)
    b. Aspect ratio computed
    c. Geometry created (sphere or cylinder)
    d. Mesh added to scene
    e. Vertical clamp + FOV adjusted (cylinder only)
    f. Loader hidden
    g. resize() called
    h. animate() called → loop starts
    i. Hint fadeout scheduled (3.5s)
11. Event listeners active:
    ├── pointerdown/move/up/cancel on element
    ├── wheel on element (passive: false)
    ├── touchstart/move/end on element
    ├── keydown/keyup on window
    ├── ResizeObserver on element
    ├── visibilitychange on document
    ├── deviceorientation on window (if motion toggled on)
    └── astro:before-swap on document (cleanup)
12. Animation loop running:
    └── Each frame: momentum → slerp → keyboard → render (if dirty)
```

This sequence shows why the component is structured as a single large closure — all state is captured in the same lexical scope, all handlers share the same variables, and cleanup can access everything for disposal.
