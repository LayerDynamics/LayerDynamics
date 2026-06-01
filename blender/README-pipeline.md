# Ender 5 Pro → web glTF pipeline

Converts `assets/ender-5-pro-assem.STEP` (SolidWorks 2019 AP203, 77 MB, 151 named parts)
into a rigged, web-optimized, **baked-animation** glTF for the SPEC-002 `PrintingLevel`
of `apps/client`.

Plan of record: `../docs/plans/2026-06-01-ender5-rig-animate.md`.

## Why this shape

Blender 5.1 has **no native STEP importer** and FreeCAD is not installed. The STEP is
read **inside Blender's own Python 3.13** via the OpenCASCADE wheel `cadquery-ocp`,
which recovers the 151 SolidWorks `PRODUCT` names + assembly placements — the names are
what make auto-rigging 151 parts tractable.

## Run

```bash
workflows/build_ender5.sh deps      # install OCP into Blender's python (one time)
workflows/build_ender5.sh import    # STEP -> named meshes -> ender5_raw.blend
workflows/build_ender5.sh group     # drop fasteners, sort into kinematic collections
workflows/build_ender5.sh reassign  # fix spatially-ambiguous shared parts
workflows/build_ender5.sh rig       # empties rig -> ender5_rig.blend
workflows/build_ender5.sh anim      # bake the Print clip
workflows/build_ender5.sh decimate  # decimate to the web triangle budget
workflows/build_ender5.sh export    # brand materials + Draco glTF -> apps/client/public/...
# or: workflows/build_ender5.sh all
```

Each stage prints an `@@TAG` line with assertable counts/sizes and (where relevant) a
render under `assets/_renders/` for visual verification.

## Engine install (recorded)

`cadquery-ocp` (OpenCASCADE 7.9.3.1.1) installed into Blender's Python 3.13:

```bash
/Applications/Blender.app/Contents/Resources/5.1/python/bin/python3.13 \
  -m pip install cadquery-ocp cadquery-ocp-proxy
```

`--no-deps` is NOT viable: the `OCP.cpython-313-darwin.so` binary is dynamically
linked against `libvtkWrappingPythonCore3.13.dylib`, so VTK (and its deps:
matplotlib/pillow/contourpy/…) must be present. The full install resolves it.

Verified: `import OCP` + all importer classes
(`STEPCAFControl_Reader`, `XCAFDoc_DocumentTool`, `BRepMesh_IncrementalMesh`, …)
load, and `XCAFDoc_DocumentTool.ShapeTool_s` / `XCAFApp_Application.GetApplication_s` /
`TDataStd_Name.GetID_s` exist.

## Kinematic groups

- `Bed_Z` — build plate rises/lowers on the lead screw (vertical axis).
- `GantryY` — the X-axis beam slides front↔back on the top rails.
- `CarriageX` — hot-end carriage slides left↔right (child of `GantryY`).
- `Extruder_Spin` — extruder gear/pulley rotate (optional).
- `Frame_Static` — everything else.
- Dropped: every screw/nut/washer/t-slot/spacer fastener (~75 parts).
