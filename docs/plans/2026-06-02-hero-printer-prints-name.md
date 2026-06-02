# Hero = Printer Printing Your Name — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use lore:execute to implement this plan task-by-task.
> **Scope guard:** Do ONLY what is listed here. If you discover adjacent issues, note them as a TODO and continue. Do NOT fix them.

**Goal:** Replace the Hero level with the Ender 5 printer actively printing the owner's name — the `Title` mesh sits on the build plate, descends *with* the plate as the bed lowers on scroll, and is revealed bottom-up by a fixed clip plane at the plate's initial (top) height; remove the standalone "3D Printing" level (4 levels total).

**Architecture:** The Hero level becomes a printer scene reusing the Ender 5 rig + bed/head drivers (extracted from `PrintingLevel` into a reusable `Printer`). A new `PrintedTitle` loads `Title.glb` (converted from `Title.step` via the existing OCP→gltfjsx→Draco pipeline), positions it on the plate, links its Y to the bed descent, and clips it with a world-space `THREE.Plane` at the plate's start height so only the printed-so-far portion renders. The standalone `printing` level is deleted; `LEVELS`/`LevelId`/`LevelView`/`LevelIndicator` drop to 4.

**Tech Stack:** Blender 5.1 + `cadquery-ocp` (OCP) for STEP→mesh, `gltfjsx -T` (gltf-transform: Draco) for web-optimize, self-hosted Draco decoder (already wired in `src/draco.ts`), React 19 + R3F 9 + drei, `three` 0.184 material clipping planes.

**Practices (owner-selected):**
- **Verify each stage by render** — render/screenshot + assert after every stage (convert, clip-reveal, plate-link, level-removal) before proceeding. Headless caveat: SwiftShader + reduced-motion + idle-rAF throttling, so drive frames with wheel events and use instrumentation (project to NDC / read node Y) where pixels are unreliable; real-GPU `pnpm dev` is the visual gate.
- **Reuse Ender 5 pipeline scripts** — `blender/scripts/` (OCP import) + `gltfjsx -T` Draco, consistent with the rest of the project.
- **Commit per stage** — one focused commit per green task.

**Required skills:** none external.

---

## Verified context (established before planning)

| Fact | Value |
|------|-------|
| Title source | `apps/client/public/assets/objects/Title.step` (1.3 MB), `.stl` (binary, 19,834 tris), `.usdz` — convert the **STEP** (project convention) |
| Current levels | `LEVELS` in `stores/useLevels.ts`: `hero, processing, printing, otherWork, hireMe` (5). Hero = glass monolith + name (`HeroLayout`); `printing` = Ender 5 (`PrintingLevel`). |
| Printer logic | `components/scene/PrintingLevel/PrintingLevel.tsx`: loads `Ender5Pro.glb`, fit useMemo (scale to `PRINTER_FIT_WIDTH`, centre on gantry X + full-bbox Y/Z), drives `GantryY`/`CarriageX` rasters from scroll, drives **bed Y directly** `MathUtils.lerp(BED_TOP_Y=0.405, BED_BOTTOM_Y=0.105, p)` on the `Bed_Z` node (clip not played). |
| Camera | `printing` camera CONTAINS the printer (`fitWidth`+`fitHeight`), head-on, frame-centred, spool off-screen. `LevelCamera` reads `LEVELS[i].camera`. |
| Bed geometry (world, model metres) | nozzle/hotend bottom Y ≈ **0.433**; bed plate at bind Y 0.243–0.285 (`Bed_Z` node Y 0.257); frame floor Y 0; top 0.505. |
| Draco decoder | self-hosted at `public/draco/`, set via `src/draco.ts` (`useGLTF.setDecoderPath('/draco/')`) imported before App — verified zero gstatic. |
| Clipping | `THREE` material `clippingPlanes` are **world-space**; requires `gl.localClippingEnabled = true` on the renderer. |
| STLLoader | present in `three-stdlib` (fallback only — we convert the STEP, not load STL). |

---

## Phase A — Title asset: STEP → glTF (Draco)

### Task 1: Convert + orient + centre the Title (`blender/scripts/title_convert.py`)

**Files:** Create `blender/scripts/title_convert.py`; add a `title` case to `blender/workflows/build_ender5.sh`.

**Requirements / exit criteria:** `blender/assets/Title.raw.glb` written; the name is a single mesh, **standing upright facing −Z (camera)**, centred at the origin in X, its **bottom on the plane Y=0** (so it can sit on the plate), scaled to a known width; a Cycles/CPU render shows the readable name.

**Step 1 — `title_convert.py`** (reuses the OCP reader pattern from `10_import_step.py`; single object, no rig):
```python
import bpy, sys, os
from mathutils import Vector
sys.path.append(os.path.join(os.getcwd(), "blender", "scripts"))
import lib_ender5 as L  # reuse MM_TO_M + RENDER_DIR
from OCP.STEPControl import STEPControl_Reader
from OCP.IFSelect import IFSelect_RetDone
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.TopExp import TopExp_Explorer
from OCP.TopAbs import TopAbs_FACE, TopAbs_Orientation
from OCP.BRep import BRep_Tool
from OCP.TopLoc import TopLoc_Location
from OCP.TopoDS import TopoDS

SRC = os.path.abspath("apps/client/public/assets/objects/Title.step")
OUT = os.path.abspath("blender/assets/Title.raw.glb")
TARGET_WIDTH_M = 0.18   # name spans ~0.18 m across the 0.22 m bed (tune in Task 4)

def read_shape(path):
    r = STEPControl_Reader()
    if r.ReadFile(path) != IFSelect_RetDone:
        raise RuntimeError("STEP read failed: " + path)
    r.TransferRoots()
    return r.OneShape()

def to_mesh(shape):
    BRepMesh_IncrementalMesh(shape, 0.2, False, 0.4, True)
    verts, faces = [], []
    exp = TopExp_Explorer(shape, TopAbs_FACE)
    while exp.More():
        face = TopoDS.Face_s(exp.Current()); loc = TopLoc_Location()
        tri = BRep_Tool.Triangulation_s(face, loc)
        if tri is not None:
            trsf = loc.Transformation(); base = len(verts)
            for k in range(1, tri.NbNodes() + 1):
                p = tri.Node(k).Transformed(trsf)
                verts.append((p.X()*L.MM_TO_M, p.Y()*L.MM_TO_M, p.Z()*L.MM_TO_M))
            rev = face.Orientation() == TopAbs_Orientation.TopAbs_REVERSED
            for k in range(1, tri.NbTriangles() + 1):
                a, b, c = tri.Triangle(k).Get()
                if rev: a, c = c, a
                faces.append((base+a-1, base+b-1, base+c-1))
        exp.Next()
    me = bpy.data.meshes.new("Title"); me.from_pydata(verts, [], faces); me.validate(); me.update()
    ob = bpy.data.objects.new("Title", me); bpy.context.scene.collection.objects.link(ob)
    return ob

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ob = to_mesh(read_shape(SRC))
    # Orient: text should READ in the X(width)–Y(height) plane and be extruded in Z
    # (faces the −Z camera). CAD text is usually authored flat (XY) extruded +Z, or
    # lying in XZ. Detect the smallest-extent axis = extrusion/thickness; make that Z,
    # the largest = X (width), the remaining = Y (height). Rotate accordingly.
    d = ob.dimensions; axes = sorted(range(3), key=lambda i: d[i])  # [thin, mid, wide]
    import mathutils
    # bring wide->X, mid->Y, thin->Z via a basis permutation
    want = {axes[2]: 0, axes[1]: 1, axes[0]: 2}
    M = mathutils.Matrix(((0,0,0),(0,0,0),(0,0,0)))
    for src, dst in want.items(): M[dst][src] = 1.0
    ob.data.transform(M.to_4x4()); ob.data.update()
    # scale to target width, then drop bottom to Y=0 and centre X, centre Z
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    mn = Vector((min(p[i] for p in bb) for i in range(3)))
    mx = Vector((max(p[i] for p in bb) for i in range(3)))
    s = TARGET_WIDTH_M / (mx.x - mn.x)
    ob.data.transform(mathutils.Matrix.Scale(s, 4)); ob.data.update()
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    mn = Vector((min(p[i] for p in bb) for i in range(3))); mx = Vector((max(p[i] for p in bb) for i in range(3)))
    shift = mathutils.Matrix.Translation((-(mn.x+mx.x)/2, -mn.y, -(mn.z+mx.z)/2))
    ob.data.transform(shift); ob.data.update()
    print("@@TITLE dims=", tuple(round(x,4) for x in ob.dimensions), "verts=", len(ob.data.vertices))
    assert len(ob.data.vertices) > 50
    bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=False,
        export_draco_mesh_compression_enable=False, export_yup=True, export_apply=True)
    print("@@TITLE saved", OUT, os.path.getsize(OUT))

main()
```
> Note: `export_yup=True` maps Blender Z-up→glTF Y-up. Author the standing text with **height along Blender Z** if the above orientation heuristic mis-detects (the render in Step 3 is the check; if the name is lying flat or sideways, fix the axis permutation, re-run — do not proceed on a wrong orientation).

**Step 2 — workflow case** in `build_ender5.sh`:
```bash
  title)   stage "Title STEP→raw glb"; $BL --python blender/scripts/title_convert.py ;;
```

**Step 3 — run + verify:** `bash blender/workflows/build_ender5.sh title` → `@@TITLE dims=… saved`. Then render: import the raw glb and Cycles-render (reuse the `render_glb.py` pattern from the Ender 5 work, pointed at `Title.raw.glb`); **Read** the PNG — the name must be readable, upright, centred, sitting on Y=0. Fix orientation/scale if not.

**Step 4 — commit:** `git add blender/scripts/title_convert.py blender/workflows/build_ender5.sh && git commit -m "feat(title): STEP→raw glb (OCP), oriented upright on the plate"`

---

### Task 2: Web-optimize the Title (`gltfjsx -T` Draco)

**Files:** produce `apps/client/public/assets/objects/Title.glb`.

**Requirements / exit criteria:** `Title.glb` is Draco-compressed, ≤ ~300 KB, single mesh, loads + decodes via the self-hosted decoder.

**Step 1 — transform** (no component needed — we load via `useGLTF` + apply our own material in Task 4):
```bash
cd /Users/ryanoboyle/LayerDynamics
npx --yes gltfjsx@latest blender/assets/Title.raw.glb -T -o /tmp/Title.tsx
mv -f blender/assets/Title.raw-transformed.glb apps/client/public/assets/objects/Title.glb
ls -l apps/client/public/assets/objects/Title.glb
```
> If gltfjsx writes the transformed glb next to `-o` instead of the source (it did for the Ender 5), move from that path. Discard `/tmp/Title.tsx` — unused.

**Step 2 — verify Draco + decode:** parse the GLB JSON (struct/json, as in the Ender 5 verification) → assert `extensionsUsed` includes `KHR_draco_mesh_compression`; confirm 1 mesh. **Commit:** `git add -f apps/client/public/assets/objects/Title.glb && git commit -m "feat(title): web-optimized Draco Title.glb"`

---

## Phase B — Hero = printer printing the name

### Task 3: Extract the reusable `Printer` (rig + bed/head drivers)

**Files:**
- Create `apps/client/src/components/scene/Printer/Printer.tsx`
- Create `apps/client/src/components/scene/Printer/index.ts`
- Modify `apps/client/src/components/scene/PrintingLevel/PrintingLevel.tsx` (to consume `Printer`, until removed in Task 6)

**Requirements / exit criteria:** the Ender 5 rig + fit transform + `GantryY`/`CarriageX` raster + `Bed_Z` descent are in one reusable component that exposes the live bed state (the world Y of the plate surface + the descent fraction) via a callback ref, so children can link to the plate; no behaviour change vs. current PrintingLevel.

**`Printer.tsx`** (lifts the body of `PrintingLevel.tsx` and adds a `bedRef` + `children`):
```tsx
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { Box3, Group, MathUtils } from 'three'
import { Model } from '../PrintingLevel/Ender5Pro'
import { scrubToClipTime } from '../PrintingLevel/scrub'
import { scrollProgress } from '../../../stores/levelScroll'
import { PRINTER_FIT_WIDTH } from '../../../stores/useLevels'

const GLB_URL = '/assets/objects/Ender5Pro.glb'
const RASTER_LOOPS = 2
export const BED_TOP_Y = 0.405
export const BED_BOTTOM_Y = 0.105

/** Live bed readout for things printed on the plate (e.g. the name). */
export interface BedState { p: number; bedNodeY: number; scale: number; offsetY: number }

export default function Printer({ onBed, children }: { onBed?: (b: BedState) => void; children?: React.ReactNode }) {
  const group = useRef<Group>(null)
  const { animations } = useGLTF(GLB_URL)
  const { actions, mixer, names } = useAnimations(animations, group)
  const { scale, offset } = useMemo(() => {/* …identical fit useMemo from PrintingLevel… */}, [/* scene */])

  useEffect(() => {
    for (const n of ['GantryY', 'CarriageX']) { const a = actions[n]; if (a) { a.play(); a.paused = true } }
    mixer.update(0)
    return () => { for (const n of names) actions[n]?.stop() }
  }, [actions, names, mixer])

  useFrame(() => {
    const p = scrollProgress.current ?? 0
    const gantry = actions['GantryY']; const carriage = actions['CarriageX']
    if (gantry) gantry.time = scrubToClipTime(p, gantry.getClip().duration)
    if (carriage) { const d = carriage.getClip().duration; carriage.time = (p * d * RASTER_LOOPS) % d }
    mixer.update(0)
    const bedNode = group.current?.getObjectByName('Bed_Z')
    const bedNodeY = MathUtils.lerp(BED_TOP_Y, BED_BOTTOM_Y, p)
    if (bedNode) bedNode.position.y = bedNodeY
    onBed?.({ p, bedNodeY, scale, offset: offset, offsetY: offset[1] })
  })

  return (
    <group ref={group} dispose={null}>
      <group scale={scale} position={offset}>
        <Model />
        {children /* printed objects live in the SAME scaled/centred space as the bed */}
      </group>
    </group>
  )
}
```
> Keep the exact fit `useMemo` (alu/strut measurement) — copy it verbatim from `PrintingLevel.tsx`. `PrintingLevel.tsx` is updated to `return <Printer/>` (it is deleted in Task 6, but stays green until then).

**Verify:** build + render the existing `printing` level — unchanged (head rasters, bed descends from top). **Commit:** `feat(printer): extract reusable Printer rig+drivers`.

---

### Task 4: `PrintedTitle` — name on the plate, plate-linked, clip-revealed

**Files:** Create `apps/client/src/components/scene/Printer/PrintedTitle.tsx`

**Requirements / exit criteria:** the Title sits centred on the plate, its **Y tracks the bed** (descends with the plate), and a **world-space clip plane at the plate's initial (top) surface Y** hides everything above it — so at `p=0` the name is invisible and it reveals **bottom-up** as the bed lowers. Brand/filament material.

```tsx
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { Group, Mesh, MeshStandardMaterial, Plane, Vector3, Color } from 'three'
import type { BedState } from './Printer'
import { brand } from '../../../styles/brand'

const TITLE_URL = '/assets/objects/Title.glb'
// Bed_Z node Y → plate top SURFACE offset (the plate sits slightly above the node;
// measured: node 0.257 → surface ≈ 0.285, so +0.028). The title bottom rests here.
const PLATE_SURFACE_OFFSET = 0.028

export default function PrintedTitle({ bed }: { bed: React.RefObject<BedState | null> }) {
  const ref = useRef<Group>(null)
  const { scene } = useGLTF(TITLE_URL)

  // One shared clip plane (world space). Constant = plate INITIAL surface world Y;
  // normal −Y keeps fragments BELOW the line (printed-so-far). Material clips to it.
  const { clip, geomScene } = useMemo(() => {
    const clip = new Plane(new Vector3(0, -1, 0), 0)
    const mat = new MeshStandardMaterial({
      color: new Color(brand.violet), emissive: new Color(brand.violet),
      emissiveIntensity: 0.35, roughness: 0.45, metalness: 0.1,
      clippingPlanes: [clip], clipShadows: true,
    })
    const s = scene.clone(true)
    s.traverse((o) => { if ((o as Mesh).isMesh) (o as Mesh).material = mat })
    return { clip, geomScene: s }
  }, [scene])

  useFrame(() => {
    const b = bed.current
    const g = ref.current
    if (!b || !g) return
    // Title sits on the plate: local Y = bed node Y + plate surface offset (same
    // scaled/centred space as the printer — PrintedTitle is a child of Printer).
    g.position.y = b.bedNodeY + PLATE_SURFACE_OFFSET
    // Clip plane at the plate's INITIAL surface, in WORLD Y:
    //   worldY(localY) = localY * scale + offsetY   (the inner group transform)
    const initialSurfaceLocalY = /* BED_TOP_Y */ 0.405 + PLATE_SURFACE_OFFSET
    clip.constant = initialSurfaceLocalY * b.scale + b.offsetY
  })

  return <group ref={ref}><primitive object={geomScene} /></group>
}
```
> The title is a child of `Printer`'s inner (scaled/centred) group, so `g.position.y` is in the same model space as `bedNodeY`. The clip plane is world-space, so its constant is converted with the inner-group `scale`+`offsetY`. `BED_TOP_Y` import from `./Printer`.

**Step — enable clipping** in `routes/Landing.tsx` Canvas: add `onCreated={({ gl }) => { gl.localClippingEnabled = true }}` (or `gl={{ localClippingEnabled: true }}`). Required or `clippingPlanes` is ignored.

**Verify:** temporary-mount in the printing level; render at `p=0` (name hidden), `p≈0.4` (lower half of name shown), `p≈0.85` (most shown). Confirm bottom-up reveal + the name descends with the plate. Tune `PLATE_SURFACE_OFFSET`, `TARGET_WIDTH_M` (Task 1) so the name rests on the plate and reads. **Commit:** `feat(title): plate-linked clip-reveal of the printed name`.

---

### Task 5: HeroLevel becomes the printer (pure printer)

**Files:** Modify `apps/client/src/components/scene/levels/HeroLevel.tsx`; modify `apps/client/src/routes/Landing.tsx` (clipping flag, Task 4); modify `apps/client/src/stores/useLevels.ts` (hero camera + scrollMode).

**Requirements / exit criteria:** `HeroLevel` renders `<Printer onBed=…><PrintedTitle/></Printer>` and nothing else (the monolith/`HeroLayout` overlay is gone — "pure printer"). Hero is **`scrollMode: 'scrub'`** with the printer **contain** camera (copy `fitWidth`/`fitHeight` from the `printing` camera). At rest the printer stands head-on with the bed at top and the name hidden.

```tsx
import { useRef } from 'react'
import Printer, { type BedState } from '../Printer/Printer'
import PrintedTitle from '../Printer/PrintedTitle'

export default function HeroLevel() {
  const bed = useRef<BedState | null>(null)
  return (
    <Printer onBed={(b) => (bed.current = b)}>
      <PrintedTitle bed={bed} />
    </Printer>
  )
}
```
`useLevels.ts` hero entry → `{ id: 'hero', scrollMode: 'scrub', camera: { position: [0,0,9], target: [0,0,0], fov: 40, fitWidth: PRINTER_FIT_WIDTH, fitHeight: PRINTER_FIT_HEIGHT }, accent: '#c08a4a' }`.

**Verify:** render hero at p=0/mid/high — printer head-on, head rasters, bed descends from top, name prints bottom-up. **Commit:** `feat(hero): replace hero with the printer printing the name`.

---

### Task 6: Remove the standalone "3D Printing" level (→ 4 levels)

**Files:** Modify `stores/useLevels.ts` (LevelId, LEVELS), `components/scene/levels/LevelView.tsx`, `components/LevelIndicator.tsx`; delete `components/scene/PrintingLevel/PrintingLevel.tsx` (logic now in `Printer`); keep `Ender5Pro.tsx` + `scrub.ts` (used by `Printer`).

**Requirements / exit criteria:** `LevelId = 'hero' | 'processing' | 'otherWork' | 'hireMe'`; `LEVELS` has 4 entries (drop the `printing` entry); `LevelView` drops the `printing` case; `LevelIndicator` label map drops `printing`; `LEVEL_COUNT` = 4. `git rm` the now-unused `PrintingLevel.tsx`; update its `index.ts` (`PrintingLevel/index.ts`) to stop exporting it (keep `Ender5Pro`/`scrub` exports that `Printer` imports). No dangling imports.

**Verify:** `grep -rn "printing\|PrintingLevel" src` → only the intended (Printer imports from PrintingLevel dir for Ender5Pro/scrub; the LevelView `printing` case is gone). build + lint. **Commit:** `refactor(levels): drop standalone printing level (hero is the printer now)`.

---

### Task 7: End-to-end verify + docs + green gate

**Files:** Modify `docs/specs/SPEC-002-immersive-levels.md` (levels now 4, hero = printer-prints-name, FR for the clip-reveal); update memory `level-system-architecture.md` + `ender5-asset-pipeline.md` (Title asset).

**Requirements / exit criteria:** headless CDP walk — Hero (name printing, bed top, head raster) → transition → 3D Processing → Other Work → Hire Me; reduced-motion still navigable; `pnpm --filter client build`, `lint`, `test` all green; SPEC-002 + memory updated to the 4-level structure.

**Gate:**
```bash
cd apps/client && pnpm test && pnpm lint && pnpm build
```
**Verify (real GPU note):** the clip-reveal + raster are best confirmed on `pnpm --filter client dev` (headless throttles idle animation); the bed/name descent is scroll-driven so it IS verifiable headless by driving wheel events + reading the title group Y / clip constant via instrumentation.

**Commit:** `docs(spec-002): 4 levels, hero prints the name; sync memory`.

---

## Task dependency / order
```
A: 1 → 2                 (Title asset)
B: 3 → 4 → 5 → 6 → 7     (Printer extract → PrintedTitle → Hero → remove printing → verify)
A and B-Task-4 converge: PrintedTitle (4) needs Title.glb (2) and Printer (3).
```

## Out of scope (note as TODO if hit, do NOT do here)
- Re-baking the Ender 5 in Blender (the runtime bed-Y drive stands).
- meshopt vs Draco re-evaluation (separate decision).
- The transition visual (OQ-1) and other levels' polish.
- USDZ / AR quick-look use of the Title.
