# Ender 5 Pro — Convert, Rig, Optimize & Animate Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use lore:execute to implement this plan task-by-task.
> **Scope guard:** Do ONLY what is listed here. If you discover adjacent issues, note them as a TODO and continue. Do NOT fix them.

**Goal:** Turn `blender/assets/ender-5-pro-assem.STEP` (77 MB, 151 named SolidWorks parts) into a web-optimized, baked-animation glTF that plays scroll-scrubbed "printing" motion in the SPEC-002 `PrintingLevel`.

**Architecture:** A **hybrid, staged Blender pipeline**. Deterministic stages run headless (`blender --background --python`) from committed scripts under `blender/scripts/` + `blender/workflows/`; the Blender MCP is used only to visually verify rig pivots. STEP is read **inside Blender's own Python 3.13** via the OpenCASCADE wheel `cadquery-ocp` (recovers the 151 part names + assembly hierarchy — the realization of the "Blender STEP add-on" choice), tessellated to named meshes, then: fasteners dropped → parts grouped into kinematic assemblies (`Frame_Static`, `Bed_Z`, `GantryY`, `CarriageX`, `Extruder_Spin`) → empties rig → print choreography keyframed → decimated + Draco-compressed glTF with **baked animation clips** → typed R3F component via `gltfjsx` → scrubbed by scroll with `useAnimations`.

**Tech Stack:** Blender 5.1.2 (bundled Python 3.13.9, pip 25.2), `cadquery-ocp` 7.9.3.1.1 (OpenCASCADE/OCP) in Blender's Python, Blender core glTF exporter (Draco), `npx gltfjsx`, React 19 + R3F 9 + drei (`useAnimations`), Vitest (new), `three` 0.184.

**Practices (Phase-2 answers):**
- **Verify each stage's output** — every stage ends with an assertion (object count / bbox / file size) **and** a rendered thumbnail before proceeding. No stage is "done" without evidence.
- **Vitest for the R3F driver** — unit-test the pure scrub→clip-time mapping before wiring it in.
- **Commit per stage** — git commit each green stage so the heavy pipeline is resumable and every artifact is checkpointed.
- **Complete outline** — every task lists exact files, exact commands, complete code, and explicit exit-criteria/requirements.

**Required skills:** none external (no plugin-dev/MCP/agent/SDK skills apply; the Blender MCP is used as a tool, not a dev target).

---

## Verified environment (established before planning — do not re-litigate)

| Fact | Value | Evidence |
|------|-------|----------|
| Blender | 5.1.2, Python **3.13.9**, pip 25.2 | `blender --version`; `/tmp/probe.py` |
| Blender Python path | `/Applications/Blender.app/Contents/Resources/5.1/python/bin/python3.13` | probe |
| Native STEP import | **none** (installed CAD add-ons are DXF/mesh helpers only) | probe `addon_utils.modules()` |
| FreeCAD | **not installed** | `which freecad*` |
| STEP engine | `cadquery-ocp 7.9.3.1.1` installs for blender-py3.13/macOS-arm64 (provides `OCP`) | `pip install --dry-run` |
| Fallback engine | `cascadio 0.0.17` (flattening) installs | `pip install --dry-run` |
| glTF + Draco export | present in Blender core | probe `@@GLTF True` |
| STEP units | millimetres, SolidWorks 2019 AP203 | STEP `FILE_NAME`/coords |
| Part names | **intact** on `PRODUCT` entities (151 unique) | `grep PRODUCT` |
| `npx` | `/Users/ryanoboyle/.asdf/installs/nodejs/24.8.0/bin/npx` | `which npx` |
| Target asset dir | `apps/client/public/assets/objects/` (existing GLB convention) | `ls` |

**Kinematics (Ender 5 Pro, derived from the 151 part names):**
- **`Bed_Z`** — build plate rises/lowers on the lead screw (vertical axis). Parts: `build-plate-assm*`, `magnetic-plate`, `heater-plate`, `sub-plate`, `z-axis-bearing-plate*`, `lead-screw-nut*`, `leveling-wheel`.
- **`GantryY`** — the X-axis beam assembly slides front↔back on the top rails. Parts: `x-axis-strut`, `x-axis-bogey-*`, `x-axis-belt`, `x-axis-drive-assem`, `x-axis-pulley*`, `x-axis-stepper*`.
- **`CarriageX`** — hot-end carriage slides left↔right along the beam (**child of `GantryY`** so X composes with Y). Parts: `hot-end-*`, `nozzle-04`, `heat-break`, `heat-sink`, `fan-shroud*`, `part-cooling-fan`, `part-fan-duct`.
- **`Extruder_Spin`** *(optional)* — `extruder-gear`, `extruder-pulley` rotate for filament feed.
- **`Frame_Static`** — everything else (frame, struts, brackets, control box, main board, spool, steppers/pulleys on frame, guide rods, extruder mounts, limit switches, wheels).
- **Dropped (fasteners):** `bhcs*`, `shcs*`, `fhsc*`, `bh-screw*`, `capscrew*`, `hex-nut*`, `lock-washer*`, `locknut*`, `flat-washer*`, `set-screw*`, `stop-screw*`, `t-nut*`, `t-slot-nut*`, `eccentric-nut`, `delrin-spacer`, `wheel-spacer`.
- **Axis detection (no hardcoded up-axis):** `vertical` = longest bbox axis of `lead-screw`; `LR` (carriage travel) = longest bbox axis of `x-axis-strut`; `FB` (gantry travel) = the remaining horizontal axis.

> **Spec note (handled in Task 12):** SPEC-002 FR-8/FR-13/OQ-2 currently describe a *runtime node-driven* scrub. Owner chose **baked glTF clips**. The rig is still authored in Blender (to produce the motion); the runtime plays/scrubs a baked clip via `useAnimations`. SPEC-002 is updated to match in Task 12 — keep the two consistent.

---

## Phase A — Conversion engine & STEP import

### Task 1: Scaffold the pipeline workspace + shared name tables

**Files:**
- Create: `blender/scripts/lib_ender5.py`
- Create: `blender/workflows/build_ender5.sh`
- Create: `blender/.gitignore`
- Create: `blender/README-pipeline.md`

**Requirements / exit criteria:** the regex group tables exist in one place; intermediate `.blend` and the huge source CAD are git-ignored; `build_ender5.sh` is executable.

**Step 1 — `blender/scripts/lib_ender5.py`** (shared by every stage):
```python
"""Shared config for the Ender 5 Pro asset pipeline (SPEC-002 PrintingLevel)."""
import re

# Ordered classification: first matching group wins. Fasteners are dropped.
FASTENER = re.compile(
    r"^(bhcs|shcs|fhsc|bh-screw|capscrew|hex-nut|lock-washer|locknut|flat-washer|"
    r"set-screw|stop-screw|t-nut|t-slot-nut|eccentric-nut|delrin-spacer|wheel-spacer)",
    re.I,
)
CARRIAGE_X = re.compile(r"^(hot-end|nozzle|heat-break|heat-sink|fan-shroud|part-cooling-fan|part-fan-duct)", re.I)
GANTRY_Y   = re.compile(r"^x-axis", re.I)
BED_Z      = re.compile(r"^(build-plate|magnetic-plate|heater-plate|sub-plate|z-axis-bearing-plate|lead-screw-nut|leveling-wheel)", re.I)
EXTRUDER   = re.compile(r"^(extruder-gear|extruder-pulley)", re.I)

GROUPS = ["Frame_Static", "Bed_Z", "GantryY", "CarriageX", "Extruder_Spin"]

def classify(name: str) -> str | None:
    """Return target group, or None if the part should be dropped."""
    n = name.strip()
    if FASTENER.match(n):   return None
    if CARRIAGE_X.match(n):  return "CarriageX"
    if GANTRY_Y.match(n):    return "GantryY"
    if BED_Z.match(n):       return "Bed_Z"
    if EXTRUDER.match(n):    return "Extruder_Spin"
    return "Frame_Static"

# Pipeline paths (relative to repo root).
SRC_STEP   = "blender/assets/ender-5-pro-assem.STEP"
BLEND_RAW  = "blender/assets/ender5_raw.blend"      # after import
BLEND_RIG  = "blender/assets/ender5_rig.blend"      # after rig+anim
OUT_GLB    = "apps/client/public/assets/objects/Ender5Pro.glb"
RENDER_DIR = "blender/assets/_renders"

# Animation: 25 fps, 10 s loopable print loop.
FPS = 25
CLIP_FRAMES = 250
MM_TO_M = 0.001
TRI_BUDGET_TOTAL = 180_000   # post-decimation triangle ceiling for the whole printer
```

**Step 2 — `blender/.gitignore`** (keep heavy CAD + intermediates out of git; commit only scripts + final GLB):
```gitignore
assets/*.STEP
assets/*.IGS
assets/*.blend
assets/_renders/
asset_gen/__pycache__/
```

**Step 3 — `blender/workflows/build_ender5.sh`** (the headless end-to-end driver; stages are individually runnable):
```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."          # repo root
BL="blender --background --factory-startup"
PYBL="/Applications/Blender.app/Contents/Resources/5.1/python/bin/python3.13"

stage() { echo "── $* ──"; }

case "${1:-all}" in
  deps)    stage "install OCP";     "$PYBL" -m pip install --no-deps cadquery-ocp cadquery-ocp-proxy ;;
  import)  stage "STEP→meshes";     $BL --python blender/scripts/10_import_step.py ;;
  group)   stage "cull+group";      $BL blender/assets/ender5_raw.blend --python blender/scripts/20_cull_group.py ;;
  rig)     stage "rig";             $BL blender/assets/ender5_raw.blend --python blender/scripts/30_rig.py ;;
  anim)    stage "animate";         $BL blender/assets/ender5_rig.blend --python blender/scripts/40_animate.py ;;
  export)  stage "optimize+export"; $BL blender/assets/ender5_rig.blend --python blender/scripts/50_optimize_export.py ;;
  all)     "$0" deps && "$0" import && "$0" group && "$0" rig && "$0" anim && "$0" export ;;
  *) echo "usage: $0 {deps|import|group|rig|anim|export|all}"; exit 1 ;;
esac
```

**Step 4 — make executable + commit:**
`chmod +x blender/workflows/build_ender5.sh`
`git add blender/scripts/lib_ender5.py blender/workflows/build_ender5.sh blender/.gitignore blender/README-pipeline.md && git commit -m "chore(ender5): scaffold STEP→glTF pipeline workspace"`

---

### Task 2: Install the OpenCASCADE engine into Blender's Python

**Files:** none (environment).

**Requirements / exit criteria:** `import OCP` succeeds inside Blender's Python; no vtk/matplotlib pulled (kept lean via `--no-deps`).

**Step 1 — install:**
`bash blender/workflows/build_ender5.sh deps`
(= `/Applications/Blender.app/.../python3.13 -m pip install --no-deps cadquery-ocp cadquery-ocp-proxy`)

**Step 2 — verify (Expected: prints an OCCT version, no ImportError):**
```bash
/Applications/Blender.app/Contents/Resources/5.1/python/bin/python3.13 -c \
"from OCP.STEPCAFControl import STEPCAFControl_Reader; from OCP.XCAFDoc import XCAFDoc_DocumentTool; print('OCP OK')"
```
→ Expected: `OCP OK`.
**If `import OCP` fails** (missing transitive lib), re-run without `--no-deps`:
`/Applications/Blender.app/.../python3.13 -m pip install cadquery-ocp cadquery-ocp-proxy` then re-verify. Do not proceed until `OCP OK`.

**Step 3 — commit** (records the dependency decision in the README):
Append the exact install command + `OCP OK` evidence to `blender/README-pipeline.md`; `git add blender/README-pipeline.md && git commit -m "docs(ender5): record OCP engine install"`.

---

### Task 3: STEP → named meshes inside Blender (`10_import_step.py`)

**Files:**
- Create: `blender/scripts/10_import_step.py`

**Requirements / exit criteria:** produces `ender5_raw.blend` containing **one Blender mesh object per leaf component, named after its PRODUCT name**, in world coordinates, units = metres; object count ≈ count of non-trivial solids (hundreds incl. fasteners — culled next stage); a render thumbnail shows a recognizable printer.

**Step 1 — write the importer** (reads the assembly with names + per-instance placement, tessellates each leaf, builds named Blender meshes):
```python
import bpy, sys, os, math
from collections import defaultdict
sys.path.append(os.path.join(os.getcwd(), "blender", "scripts"))
import lib_ender5 as L

from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.XCAFApp import XCAFApp_Application
from OCP.XCAFDoc import XCAFDoc_DocumentTool
from OCP.TDocStd import TDocStd_Document
from OCP.TCollection import TCollection_ExtendedString
from OCP.TDF import TDF_LabelSequence, TDF_Label
from OCP.TDataStd import TDataStd_Name
from OCP.IFSelect import IFSelect_RetDone
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.TopLoc import TopLoc_Location
from OCP.TopAbs import TopAbs_FACE
from OCP.TopExp import TopExp_Explorer
from OCP.BRep import BRep_Tool
from OCP.TopoDS import TopoDS

LINEAR_DEFLECTION = 0.4   # mm — coarse-ish; printer is viewed small on the web
ANGULAR_DEFLECTION = 0.5  # rad

def label_name(label: TDF_Label) -> str:
    s = TDataStd_Name()
    if label.FindAttribute(TDataStd_Name.GetID_s(), s):
        return s.Get().ToExtString()
    return "part"

def read_doc(path):
    app = XCAFApp_Application.GetApplication_s()
    doc = TDocStd_Document(TCollection_ExtendedString("doc"))
    app.NewDocument(TCollection_ExtendedString("MDTV-XCAF"), doc)
    reader = STEPCAFControl_Reader()
    reader.SetNameMode(True)
    if reader.ReadFile(path) != IFSelect_RetDone:
        raise RuntimeError("STEP read failed: " + path)
    reader.Transfer(doc)
    return XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())

def leaves(shape_tool):
    """Yield (name, located TopoDS_Shape) for every leaf instance, names disambiguated."""
    seen = defaultdict(int)
    roots = TDF_LabelSequence(); shape_tool.GetFreeShapes(roots)

    def walk(label, loc):
        if shape_tool.IsAssembly_s(label):
            comps = TDF_LabelSequence(); shape_tool.GetComponents_s(label, comps)
            for i in range(1, comps.Length() + 1):
                c = comps.Value(i)
                ref = TDF_Label()
                cloc = shape_tool.GetLocation_s(c)
                composed = loc.Multiplied(cloc)
                if shape_tool.GetReferredShape_s(c, ref):
                    walk(ref, composed)
                else:
                    walk(c, composed)
        else:
            name = label_name(label)
            seen[name] += 1
            disamb = name if seen[name] == 1 else f"{name}.{seen[name]:03d}"
            shp = shape_tool.GetShape_s(label).Located(loc)
            yield_list.append((disamb, shp))

    global yield_list; yield_list = []
    for i in range(1, roots.Length() + 1):
        walk(roots.Value(i), TopLoc_Location())
    return yield_list

def shape_to_mesh(name, shape):
    BRepMesh_IncrementalMesh(shape, LINEAR_DEFLECTION, False, ANGULAR_DEFLECTION, True)
    verts, faces = [], []
    exp = TopExp_Explorer(shape, TopAbs_FACE)
    while exp.More():
        face = TopoDS.Face_s(exp.Current())
        loc = TopLoc_Location()
        tri = BRep_Tool.Triangulation_s(face, loc)
        if tri is not None:
            trsf = loc.Transformation()
            base = len(verts)
            for k in range(1, tri.NbNodes() + 1):
                p = tri.Node(k).Transformed(trsf)
                verts.append((p.X() * L.MM_TO_M, p.Y() * L.MM_TO_M, p.Z() * L.MM_TO_M))
            reversed_face = face.Orientation() == 1  # TopAbs_REVERSED
            for k in range(1, tri.NbTriangles() + 1):
                a, b, c = tri.Triangle(k).Get()
                if reversed_face: a, c = c, a
                faces.append((base + a - 1, base + b - 1, base + c - 1))
        exp.Next()
    if not faces:
        return None
    me = bpy.data.meshes.new(name); me.from_pydata(verts, [], faces); me.validate(); me.update()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    return ob

def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.context.scene.unit_settings.system = 'METRIC'
    st = read_doc(os.path.abspath(L.SRC_STEP))
    n = 0
    for name, shp in leaves(st):
        if shape_to_mesh(name, shp): n += 1
    print(f"@@IMPORT objects={n}")
    assert n > 100, f"expected >100 leaf solids, got {n}"
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(L.BLEND_RAW))

main()
```

**Step 2 — run:** `bash blender/workflows/build_ender5.sh import`
→ Expected: `@@IMPORT objects=<N>` with N > 100, and `ender5_raw.blend` written. If OCP API names differ in 7.9.3.1.1 (method `_s` static suffixes), fix against the installed `OCP` module — read the actual symbols with `python3.13 -c "import OCP.XCAFDoc as m; print([x for x in dir(m.XCAFDoc_DocumentTool)])"` and adapt. Do not stub; make the real call resolve.

**Step 3 — verify (render thumbnail):** create `blender/scripts/render_check.py` (reused by later stages):
```python
import bpy, sys, os, math
sys.path.append(os.path.join(os.getcwd(), "blender", "scripts")); import lib_ender5 as L
def main():
    tag = sys.argv[-1]
    os.makedirs(os.path.abspath(L.RENDER_DIR), exist_ok=True)
    cam_data = bpy.data.cameras.new("c"); cam = bpy.data.objects.new("c", cam_data)
    bpy.context.scene.collection.objects.link(cam); bpy.context.scene.camera = cam
    bpy.ops.object.select_all(action='SELECT')
    # frame everything
    bpy.context.view_layer.objects.active = cam
    cam.location = (1.2, -1.2, 1.0); cam.rotation_euler = (math.radians(62), 0, math.radians(46))
    bpy.ops.object.camera_add  # ensure module
    sun = bpy.data.objects.new("s", bpy.data.lights.new("s", 'SUN')); bpy.context.scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(50), 0, math.radians(30))
    sc = bpy.context.scene; sc.render.resolution_x = 900; sc.render.resolution_y = 700
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.render.filepath = os.path.join(os.path.abspath(L.RENDER_DIR), f"{tag}.png")
    bpy.ops.view3d.camera_to_view_selected  # best-effort fit (no-op headless; manual cam ok)
    bpy.ops.render.render(write_still=True)
    print("@@RENDER", sc.render.filepath)
main()
```
Run: `blender --background blender/assets/ender5_raw.blend --python blender/scripts/render_check.py -- import`
Then **Read** `blender/assets/_renders/import.png` (vision) — Expected: a recognizable Ender 5 frame + bed + gantry. If it's garbled/empty, the importer triangulation is wrong — fix before continuing.

**Step 4 — commit:** `git add blender/scripts/10_import_step.py blender/scripts/render_check.py && git commit -m "feat(ender5): STEP→named meshes via OCP in Blender python"`

---

## Phase B — Cull, group & rig

### Task 4: Drop fasteners + sort into kinematic collections (`20_cull_group.py`)

**Files:** Create: `blender/scripts/20_cull_group.py`

**Requirements / exit criteria:** every fastener object deleted; every remaining object lives in exactly one of the 5 group collections; print the per-group counts; nothing left in the scene root un-grouped.

```python
import bpy, sys, os
sys.path.append(os.path.join(os.getcwd(), "blender", "scripts")); import lib_ender5 as L

def base_name(ob): return ob.name.split(".")[0]

def main():
    for g in L.GROUPS:
        if g not in bpy.data.collections:
            bpy.context.scene.collection.children.link(bpy.data.collections.new(g))
    dropped = 0; counts = {g: 0 for g in L.GROUPS}
    for ob in list(bpy.data.objects):
        if ob.type != 'MESH': continue
        grp = L.classify(base_name(ob))
        if grp is None:
            bpy.data.objects.remove(ob, do_unlink=True); dropped += 1; continue
        for coll in ob.users_collection: coll.objects.unlink(ob)
        bpy.data.collections[grp].objects.link(ob); counts[grp] += 1
    print("@@GROUP dropped=", dropped, "counts=", counts)
    assert dropped > 40, f"expected to drop the ~75 fasteners, only dropped {dropped}"
    assert counts["CarriageX"] > 0 and counts["GantryY"] > 0 and counts["Bed_Z"] > 0
    bpy.ops.wm.save_mainfile()
main()
```
**Run:** `bash blender/workflows/build_ender5.sh group`
→ Expected: `@@GROUP dropped=~75 counts={Frame_Static:.., Bed_Z:.., GantryY:.., CarriageX:.., Extruder_Spin:..}` with each mover > 0.

**Verify:** re-render (`render_check.py -- group`) and Read the PNG — printer must still look complete (only screws gone). **Commit:** `git commit -am "feat(ender5): drop fasteners, group parts by kinematics"`.

---

### Task 5: Reassign spatially-ambiguous shared parts (`21_reassign.py`)

**Files:** Create: `blender/scripts/21_reassign.py`

**Requirements / exit criteria:** shared instances whose name didn't pin them to the right mover (e.g. the X-stepper body, head-side pulleys/belt segments, hot-end hose fitting) are reassigned to the group whose **combined bounding box contains the part's centroid**, so a part physically on the carriage rides the carriage. Print any reassignments.

```python
import bpy, sys, os
from mathutils import Vector
sys.path.append(os.path.join(os.getcwd(), "blender", "scripts")); import lib_ender5 as L

def world_center(ob):
    c = sum((ob.matrix_world @ Vector(b) for b in ob.bound_box), Vector()) / 8.0
    return c

def group_bbox(name):
    obs = list(bpy.data.collections[name].objects)
    if not obs: return None
    pts = [ob.matrix_world @ Vector(b) for ob in obs for b in ob.bound_box]
    mn = Vector((min(p[i] for p in pts) for i in range(3)))
    mx = Vector((max(p[i] for p in pts) for i in range(3)))
    return mn, mx

def contains(box, p, pad=0.005):
    if not box: return False
    mn, mx = box
    return all(mn[i]-pad <= p[i] <= mx[i]+pad for i in range(3))

# Only reconsider these ambiguous shared families; never move named-anchored parts.
AMBIG = ("stepper-motor", "toothed-pulley", "pulley-half", "x-axis-belt", "hose-fitting", "flanged-bearing")

def main():
    movers = ["CarriageX", "GantryY", "Bed_Z"]  # priority order (smallest/most-specific first)
    boxes = {m: group_bbox(m) for m in movers}
    moved = 0
    for ob in list(bpy.data.objects):
        if ob.type != 'MESH': continue
        if not ob.name.lower().startswith(AMBIG): continue
        cur = ob.users_collection[0].name if ob.users_collection else None
        p = world_center(ob)
        for m in movers:
            if m != cur and contains(boxes[m], p):
                for c in ob.users_collection: c.objects.unlink(ob)
                bpy.data.collections[m].objects.link(ob); moved += 1
                print("@@REASSIGN", ob.name, cur, "→", m); break
    print("@@REASSIGN total=", moved)
    bpy.ops.wm.save_mainfile()
main()
```
**Run:** `blender --background blender/assets/ender5_raw.blend --python blender/scripts/21_reassign.py`
→ Expected: a handful of `@@REASSIGN` lines (or zero if names already sufficed — acceptable). **Verify** via render. **Commit:** `git commit -am "feat(ender5): spatially reassign shared parts to correct mover"`.

---

### Task 6: Build the empties rig (`30_rig.py`)

**Files:** Create: `blender/scripts/30_rig.py`

**Requirements / exit criteria:** five empties (`Frame_Static`, `Bed_Z`, `GantryY`, `CarriageX`, `Extruder_Spin`) created at correct pivots; each group's meshes parented to its empty (keep-transform); **`CarriageX` empty parented under `GantryY`**; travel axes derived (not hardcoded) and stored as custom props on the empties for the animation stage; saves `ender5_rig.blend`.

```python
import bpy, sys, os
from mathutils import Vector
sys.path.append(os.path.join(os.getcwd(), "blender", "scripts")); import lib_ender5 as L

def part(name_sub):
    for ob in bpy.data.objects:
        if ob.type == 'MESH' and name_sub in ob.name.lower(): return ob
    return None

def longest_axis(ob):
    d = [ob.dimensions.x, ob.dimensions.y, ob.dimensions.z]
    i = d.index(max(d)); v = Vector((0,0,0)); v[i] = 1.0; return v, i

def coll_center(name):
    obs = list(bpy.data.collections[name].objects)
    pts = [ob.matrix_world @ Vector(b) for ob in obs for b in ob.bound_box]
    return sum(pts, Vector()) / len(pts)

def make_empty(name, loc):
    e = bpy.data.objects.new(name, None); e.empty_display_size = 0.05
    e.location = loc; bpy.context.scene.collection.objects.link(e); return e

def parent_keep(child, parent):
    child.parent = parent; child.matrix_parent_inverse = parent.matrix_world.inverted()

def main():
    vert_ax, vi = longest_axis(part("lead-screw"))
    lr_ax,  li  = longest_axis(part("x-axis-strut"))
    fb_i = ({0,1,2} - {vi, li}).pop()
    fb_ax = Vector((0,0,0)); fb_ax[fb_i] = 1.0
    print("@@AXES vertical=", vi, "LR=", li, "FB=", fb_i)

    empties = {}
    for g in L.GROUPS:
        if not bpy.data.collections[g].objects and g == "Extruder_Spin":
            continue
        e = make_empty(g, coll_center(g) if bpy.data.collections[g].objects else Vector())
        empties[g] = e
        for ob in bpy.data.collections[g].objects: parent_keep(ob, e)

    # CarriageX rides GantryY.
    if "CarriageX" in empties and "GantryY" in empties:
        parent_keep(empties["CarriageX"], empties["GantryY"])

    # Persist travel axes for the animator.
    empties["Bed_Z"]["axis"] = list(vert_ax)
    empties["GantryY"]["axis"] = list(fb_ax)
    empties["CarriageX"]["axis"] = list(lr_ax)

    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(L.BLEND_RIG))
    print("@@RIG empties=", list(empties.keys()))
main()
```
**Run:** `bash blender/workflows/build_ender5.sh rig` → Expected: `@@AXES ...`, `@@RIG empties=[...]`, `ender5_rig.blend` saved.

**Verify (MCP — the hybrid visual check):** with Blender open on `ender5_rig.blend` and the MCP add-on connected, use `mcp__blender__get_objects_summary` to confirm the empties + parenting, then nudge each mover empty along its stored axis and `mcp__blender__get_screenshot_of_window_as_image` to confirm **only that assembly moves** (bed up/down, gantry front/back, carriage left/right, carriage inherits gantry). Reset transforms after. If a wrong assembly moves, fix grouping (Task 4/5) — do not proceed with a broken rig. **Commit:** `git commit -am "feat(ender5): empties rig with derived travel axes"`.

---

## Phase C — Animate, optimize, export

### Task 7: Keyframe the print choreography (`40_animate.py`)

**Files:** Create: `blender/scripts/40_animate.py`

**Requirements / exit criteria:** a single baked action named `Print` over `CLIP_FRAMES` that reads as printing — `CarriageX` sweeps LR fast, `GantryY` steps FB per raster band, `Bed_Z` descends steadily; scene frame range set; FPS = `L.FPS`; loop-friendly (start pose ≈ end pose for X/Y). Stored on the empties so the glTF exporter emits one clip.

```python
import bpy, sys, os, math
from mathutils import Vector
sys.path.append(os.path.join(os.getcwd(), "blender", "scripts")); import lib_ender5 as L

def key_axis(empty, frame, dist):
    ax = Vector(empty["axis"]).normalized()
    empty.location = empty["_home"] + ax * dist
    empty.keyframe_insert("location", frame=frame)

def main():
    sc = bpy.context.scene
    sc.render.fps = L.FPS; sc.frame_start = 1; sc.frame_end = L.CLIP_FRAMES
    for g in ("Bed_Z", "GantryY", "CarriageX"):
        bpy.data.objects[g]["_home"] = list(bpy.data.objects[g].location)
        bpy.data.objects[g]["_home"] = Vector(bpy.data.objects[g]["_home"])

    bed, gy, cx = (bpy.data.objects[g] for g in ("Bed_Z","GantryY","CarriageX"))
    PASSES = 6                          # raster bands over the clip
    X_TRAVEL, Y_TRAVEL, Z_DROP = 0.11, 0.11, 0.06   # metres (Ender 5 ~220mm bed; head sweeps a sub-region)
    for f in range(1, L.CLIP_FRAMES + 1):
        t = (f - 1) / (L.CLIP_FRAMES - 1)           # 0..1
        x = (math.sin(t * PASSES * math.pi)) * (X_TRAVEL / 2)        # fast LR sweep
        y = (t * Y_TRAVEL) - Y_TRAVEL / 2                            # slow FB advance
        z = -t * Z_DROP                                              # bed descends
        key_axis(cx, f, x); key_axis(gy, f, y); key_axis(bed, f, z)
    # ease the X sweep
    for fc in (cx.animation_data.action.fcurves if cx.animation_data else []):
        for kp in fc.keyframe_points: kp.interpolation = 'BEZIER'
    print("@@ANIM action frames=", L.CLIP_FRAMES, "fps=", L.FPS)
    bpy.ops.wm.save_mainfile()
main()
```
**Run:** `bash blender/workflows/build_ender5.sh anim` → Expected: `@@ANIM action frames=250 fps=25`.
**Verify:** render a 3-frame strip — `for fr in 1 125 250; do blender -b blender/assets/ender5_rig.blend --python-expr "import bpy;bpy.context.scene.frame_set($fr);bpy.context.scene.render.filepath='blender/assets/_renders/anim_$fr.png';bpy.ops.render.render(write_still=True)"; done` then Read the three PNGs — head/bed must be in visibly different positions. **Commit:** `git commit -am "feat(ender5): bake print choreography clip"`.

---

### Task 8: Decimate to the web triangle budget (`45_decimate.py`)

**Files:** Create: `blender/scripts/45_decimate.py`

**Requirements / exit criteria:** total triangle count ≤ `L.TRI_BUDGET_TOTAL`; decimation is proportional (heaviest meshes hit hardest) and skips already-tiny meshes; print before/after tri counts. Decimation must not break the rig (modifiers applied, parenting preserved).

```python
import bpy, sys, os
sys.path.append(os.path.join(os.getcwd(), "blender", "scripts")); import lib_ender5 as L

def tris(ob): return sum(len(p.vertices) - 2 for p in ob.data.polygons)

def main():
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    before = sum(tris(o) for o in meshes)
    if before > L.TRI_BUDGET_TOTAL:
        ratio_global = L.TRI_BUDGET_TOTAL / before
        for ob in meshes:
            t = tris(ob)
            if t < 200: continue
            m = ob.modifiers.new("dec", 'DECIMATE'); m.decimate_type = 'COLLAPSE'
            m.ratio = max(0.05, min(1.0, ratio_global))
            bpy.context.view_layer.objects.active = ob
            bpy.ops.object.modifier_apply(modifier=m.name)
    after = sum(tris(o) for o in [o for o in bpy.data.objects if o.type=='MESH'])
    print("@@DECIMATE before=", before, "after=", after, "budget=", L.TRI_BUDGET_TOTAL)
    assert after <= L.TRI_BUDGET_TOTAL * 1.15
    bpy.ops.wm.save_mainfile()
main()
```
**Run:** `blender -b blender/assets/ender5_rig.blend --python blender/scripts/45_decimate.py`
→ Expected: `@@DECIMATE before=<big> after=<≤budget>`. **Verify** render — silhouette must still read as an Ender 5 (no melted parts); if a key part (nozzle, bed) collapsed, raise its skip threshold. **Commit:** `git commit -am "perf(ender5): decimate to web triangle budget"`.

---

### Task 9: Assign brand materials + export Draco glTF (`50_optimize_export.py`)

**Files:** Create: `blender/scripts/50_optimize_export.py`

**Requirements / exit criteria:** ≤ ~4 shared PBR materials (frame-aluminium, dark-plastic, bed-glass, accent-metal) so the GLB stays tiny and on-brand; export `Ender5Pro.glb` with **Draco compression + the `Print` animation + named nodes preserved**, +Y-up (glTF default), to `apps/client/public/assets/objects/`; assert file ≤ 3 MB (SPEC-002 NFR).

```python
import bpy, sys, os
sys.path.append(os.path.join(os.getcwd(), "blender", "scripts")); import lib_ender5 as L

def mat(name, color, metal, rough):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = rough
    return m

def main():
    alu  = mat("alu",  (0.62,0.63,0.66), 0.9, 0.35)
    plas = mat("plas", (0.08,0.08,0.10), 0.0, 0.55)
    glass= mat("glass",(0.10,0.12,0.16), 0.2, 0.2)
    accent=mat("accent",(0.45,0.36,0.85),0.8, 0.3)   # brand violet metal
    def pick(n):
        n=n.lower()
        if any(k in n for k in ("frame","strut","bracket","endcap","corner")): return alu
        if any(k in n for k in ("plate","magnetic","glass","build")): return glass
        if any(k in n for k in ("nozzle","hot-end","heat","gear","pulley","bearing","screw","shaft")): return accent
        return plas
    for ob in bpy.data.objects:
        if ob.type=='MESH':
            ob.data.materials.clear(); ob.data.materials.append(pick(ob.name))
    out = os.path.abspath(L.OUT_GLB); os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=out, export_format='GLB', use_selection=True,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
        export_animations=True, export_animation_mode='ACTIONS',
        export_apply=True, export_yup=True, export_extras=True,
    )
    size = os.path.getsize(out)
    print("@@EXPORT", out, "bytes=", size)
    assert size <= 3_000_000, f"GLB {size} bytes exceeds 3MB budget"
main()
```
**Run:** `bash blender/workflows/build_ender5.sh export` → Expected: `@@EXPORT .../Ender5Pro.glb bytes=<≤3,000,000>`.
**Verify:** `ls -la apps/client/public/assets/objects/Ender5Pro.glb`. **Commit:** `git add -f apps/client/public/assets/objects/Ender5Pro.glb && git add blender/scripts/50_optimize_export.py blender/scripts/45_decimate.py blender/scripts/40_animate.py && git commit -m "feat(ender5): brand materials + Draco glTF export with print clip"`.

---

## Phase D — R3F integration

### Task 10: Generate the typed component + driver mapping (Vitest first)

**Files:**
- Create: `apps/client/src/components/scene/PrintingLevel/Ender5Pro.tsx` (generated)
- Create: `apps/client/src/components/scene/PrintingLevel/scrub.ts`
- Create: `apps/client/src/components/scene/PrintingLevel/scrub.test.ts`
- Modify: `apps/client/package.json` (add `vitest`, `test` script — only if not present)

**Requirements / exit criteria:** typed `Ender5Pro` component generated from the GLB with names + animations preserved; a **pure, unit-tested** scrub→clip-time mapping exists and passes before any wiring.

**Step 1 — generate component (no re-optimize; we already compressed):**
`cd apps/client && npx gltfjsx@latest public/assets/objects/Ender5Pro.glb --types --keepnames --output src/components/scene/PrintingLevel/Ender5Pro.tsx`
→ Expected: a `.tsx` exposing `nodes`, `materials`, `animations`. Confirm `animations` includes `Print` and the Draco decoder loads (gltfjsx emits `useGLTF` which drei wires to the Draco decoder).

**Step 2 — write the failing test** `scrub.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { scrubToClipTime } from './scrub'

describe('scrubToClipTime', () => {
  it('maps progress 0..1 to 0..duration, clamped', () => {
    expect(scrubToClipTime(0, 10)).toBe(0)
    expect(scrubToClipTime(1, 10)).toBe(10)
    expect(scrubToClipTime(0.5, 10)).toBe(5)
    expect(scrubToClipTime(-0.2, 10)).toBe(0)
    expect(scrubToClipTime(1.7, 10)).toBe(10)
  })
})
```
**Step 3 — run, expect FAIL:** `pnpm --filter client exec vitest run src/components/scene/PrintingLevel/scrub.test.ts` → FAIL (module missing).

**Step 4 — implement** `scrub.ts`:
```ts
/** Map a 0..1 in-level scroll progress to a clip playhead time (seconds), clamped. */
export function scrubToClipTime(progress: number, duration: number): number {
  const p = progress < 0 ? 0 : progress > 1 ? 1 : progress
  return p * duration
}
```
**Step 5 — run, expect PASS.** **Commit:** `git commit -am "feat(ender5): gltfjsx component + tested scrub mapping"`.

---

### Task 11: PrintingLevel — scrub the baked clip by scroll

**Files:**
- Create: `apps/client/src/components/scene/PrintingLevel/PrintingLevel.tsx`
- Create: `apps/client/src/components/scene/PrintingLevel/index.ts`

**Requirements / exit criteria:** mounting the level loads the GLB (Suspense), plays the `Print` action **paused** and sets `action.time` each frame from the level's scroll progress via `scrubToClipTime`; reduced-motion pins to a representative mid-frame; GPU/clip disposed on unmount (teardown-safe per SPEC-002 FR-2/FR-7).

```tsx
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useAnimations } from '@react-three/drei'
import { Group } from 'three'
import { Ender5Pro } from './Ender5Pro'
import { scrubToClipTime } from './scrub'
import { useScene } from '../../../stores/useScene'

interface Props { scrollProgress: React.RefObject<number> }

export default function PrintingLevel({ scrollProgress }: Props) {
  const group = useRef<Group>(null)
  const inner = useRef<any>(null)
  const reducedMotion = useScene((s) => s.reducedMotion)
  // gltfjsx exposes animations via the generated component ref; useAnimations binds them.
  const { actions, mixer, names } = useAnimations(inner.current?.animations ?? [], group)

  useEffect(() => {
    const a = actions[names[0]]
    if (!a) return
    a.play(); a.paused = true
    if (reducedMotion) a.time = a.getClip().duration * 0.5
    return () => { a.stop() }
  }, [actions, names, reducedMotion])

  useFrame(() => {
    if (reducedMotion) return
    const a = actions[names[0]]
    if (!a) return
    a.time = scrubToClipTime(scrollProgress.current ?? 0, a.getClip().duration)
    mixer.update(0)
  })

  return (
    <group ref={group} dispose={null}>
      <Ender5Pro ref={inner} />
    </group>
  )
}
```
`index.ts`: `export { default as PrintingLevel } from './PrintingLevel'`

> If the gltfjsx output doesn't forward `animations` through a ref, adapt: import the GLB's `animations` directly via `useGLTF(url)` in this file and pass to `useAnimations` — keep the scrub logic identical. Do not leave it unwired.

**Verify:** temporarily mount `PrintingLevel` in `Landing` (or a scratch route) with a slider-driven `scrollProgress`; `pnpm --filter client dev`; drive the slider and confirm the printer scrubs (head sweeps, bed drops) and that it disposes on unmount (no WebGL warnings). Use the existing headless-Chrome CDP screenshot rig (memory `client-redesign-verification-rig.md`) to capture 0%, 50%, 100% scrub frames and Read them. **Commit:** `git commit -am "feat(printing-level): scroll-scrubbed Ender 5 print animation"`.

---

### Task 12: Sync SPEC-002 to the baked-clip decision + lint/build/test gate

**Files:**
- Modify: `docs/specs/SPEC-002-immersive-levels.md` (FR-8, FR-13, OQ-2, Appendix A, Decision Log)

**Requirements / exit criteria:** the spec no longer claims runtime node-driven scrub where the implementation bakes clips; Appendix A records the real, executed pipeline (engine = OCP-in-Blender, baked `Print` clip, Draco, materials, budgets); whole client builds + lints + tests green.

**Step 1 — update SPEC-002:** change FR-13 to "scrubbed baked `Print` clip via `useAnimations`"; resolve OQ-2's printing-level row to "scrub-then-advance (clip time = scroll progress)"; fill Appendix A with the executed steps + measured GLB size/tri count; add a Decision-Log row dated 2026-06-01: "Baked glTF clip over runtime node rig (owner choice); rig still authored in Blender to produce the clip."

**Step 2 — gate (Expected: all green):**
```bash
cd apps/client
pnpm exec vitest run
pnpm lint
pnpm build
```
→ Expected: tests pass, eslint clean, `tsc -b && vite build` succeeds. Fix anything red before done.

**Step 3 — commit:** `git commit -am "docs(spec-002): sync to baked-clip Ender 5 pipeline; green build/lint/test"`.

---

## Task dependency / order

```
A: 1 → 2 → 3
B: 3 → 4 → 5 → 6        (6 needs the rig groups)
C: 6 → 7 → 8 → 9        (export needs rig+anim+decimate)
D: 9 → 10 → 11 → 12     (R3F needs the GLB)
```

## Out of scope (note as TODO if encountered — do NOT do here)
- Building the level **state machine / transitions** (separate SPEC-002 work; PrintingLevel only needs a `scrollProgress` ref + mount/unmount).
- The other levels (Hero / Processing / OtherWork / HireMe).
- A growing "printed object" on the bed (nice-to-have; only if budget + time remain after Task 11).
- IGS file (`ender-5-pro-assem.IGS`) — unused; STEP is the source.
