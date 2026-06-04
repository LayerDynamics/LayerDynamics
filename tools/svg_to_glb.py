"""SVG -> extruded glTF (.glb) pipeline for LayerDynamics tech logos.

Turns a flat SVG into a centered, normalized, extruded solid and exports it as a
GLB ready for `useGLTF()` in apps/client. Runs headless against the Blender CLI
(same engine as the Blender MCP addon, no GUI / addon server required).

Usage:
    blender --background --factory-startup --python tools/svg_to_glb.py -- \
        <in.svg> <out.glb> <depth_frac> [preview.png]

    depth_frac : extrusion thickness as a fraction of the normalized size
                 (e.g. 0.25 == "chunky"). Output max planar extent is always 1u.

Output mesh: max(X,Y) extent == 1 unit, depth == depth_frac, centered at origin,
+Y up (stands upright facing the camera), one neutral `LogoNeutral` material.

Gotchas baked into this script (see memory: tech-logo-svg-to-gltf):
  * Launch with the `--factory-startup` FLAG. Calling read_factory_settings() or
    letting a material/icon preview render spawn triggers a Cocoa abort in macOS
    background mode. EEVEE/Workbench need a GPU and crash the same way -> the
    optional preview uses Cycles + CPU with an explicit area light.
  * Blender's SVG importer fills paths but IGNORES strokes and masks. Stroke-only
    or masked logos (e.g. Rust, or a stroked TS border) must be flattened first:
      inkscape in.svg --export-type=svg --export-plain-svg --export-filename=out.svg \
        --actions="select-all:all;clone-unlink-recursively;select-all:all;object-stroke-to-path"
  * Curve `extrude` is tied to the un-applied curve space, so extrude in NATIVE
    units then scale the MESH uniformly (X/Y/Z together) -> exact depth ratio.
"""
import bpy, sys, json, math

TARGET = 1.0          # normalized max planar extent (Blender units)
RES_U = 8             # curve resolution (lower => fewer polys on caps/edges)

argv = sys.argv[sys.argv.index("--") + 1:]
svg_path, out_glb, depth_frac = argv[0], argv[1], float(argv[2])
preview_png = argv[3] if len(argv) > 3 else ""
# Optional 5th arg: COLLAPSE decimate ratio (0..1; 1.0/absent = off). A very detailed
# outline (e.g. a drippy logo) produces 100k+ cap tris; collapse reduces tri count while
# preserving the organic silhouette. 6th arg: resolution_u override (curve sampling) —
# the real source of vertex count; lower it (e.g. 2-3) for ornate paths.
decimate_ratio = float(argv[4]) if len(argv) > 4 else 1.0
res_u = int(argv[5]) if len(argv) > 5 else RES_U
report = {"svg": svg_path, "out": out_glb, "steps": []}
def log(*a): report["steps"].append(" ".join(str(x) for x in a))

try:
    # --- clean slate (factory startup ships a cube/cam/light) ---
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for m in list(bpy.data.materials):
        bpy.data.materials.remove(m)

    # --- import (fills only; flatten strokes upstream with Inkscape) ---
    before = set(bpy.data.objects)
    bpy.ops.import_curve.svg(filepath=svg_path)
    imported = [o for o in bpy.data.objects if o not in before]
    curves = [o for o in imported if o.type == 'CURVE']
    log("imported_curves", len(curves))
    if not curves:
        raise RuntimeError("SVG produced no fill curves (stroke-only SVG? flatten it first)")

    # --- join into one curve object ---
    bpy.ops.object.select_all(action='DESELECT')
    for o in curves:
        o.select_set(True)
    bpy.context.view_layer.objects.active = curves[0]
    bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    obj.name = "Logo"

    # --- measure native planar size (SVG import is ~px/1000 scale) ---
    dx, dy, _ = obj.dimensions
    maxdim = max(dx, dy)
    log("import_dims", round(dx, 6), round(dy, 6))
    if maxdim <= 0:
        raise RuntimeError("degenerate import (zero size)")

    # --- extrude into a solid, in NATIVE units (proportional to size) ---
    cu = obj.data
    cu.dimensions = '2D'
    cu.fill_mode = 'BOTH'
    cu.resolution_u = res_u
    cu.bevel_depth = 0.0
    cu.extrude = (depth_frac * maxdim) / 2.0   # total thickness = depth_frac*maxdim

    # --- curve -> mesh ---
    bpy.ops.object.convert(target='MESH')
    obj = bpy.context.view_layer.objects.active

    # --- optional COLLAPSE decimate to a poly budget (preserves silhouette) ---
    if decimate_ratio < 1.0:
        before_polys = len(obj.data.polygons)
        dec = obj.modifiers.new("collapse", 'DECIMATE')
        dec.decimate_type = 'COLLAPSE'
        dec.ratio = decimate_ratio
        bpy.ops.object.modifier_apply(modifier=dec.name)
        log("decimate_ratio", decimate_ratio, "polys", before_polys, "->", len(obj.data.polygons))

    # --- recalc normals outward (curve fill can produce inward caps) ---
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')

    # --- normalize the whole mesh uniformly so max(X,Y) == TARGET ---
    factor = TARGET / maxdim
    obj.scale = (factor, factor, factor)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    log("normalized_dims", tuple(round(v, 4) for v in obj.dimensions))

    # --- recenter origin to geometry, sit at world origin ---
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY', center='BOUNDS')
    obj.location = (0.0, 0.0, 0.0)
    log("mesh_verts", len(obj.data.vertices), "polys", len(obj.data.polygons))

    # --- single neutral material ---
    obj.data.materials.clear()
    mat = bpy.data.materials.new("LogoNeutral")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.5
        bsdf.inputs["Metallic"].default_value = 0.0
    obj.data.materials.append(mat)

    # --- optional GPU-free preview (top-down, Cycles CPU) ---
    if preview_png:
        cam_data = bpy.data.cameras.new("Cam")
        cam_data.type = 'ORTHO'
        cam_data.ortho_scale = TARGET * 1.25
        cam = bpy.data.objects.new("Cam", cam_data)
        cam.location = (0.0, 0.0, 3.0)            # +Z looking down -Z at the XY face
        cam.rotation_euler = (0.0, 0.0, 0.0)
        bpy.context.scene.collection.objects.link(cam)
        bpy.context.scene.camera = cam
        # explicit area light: world-only GI renders surfaces black in headless Cycles
        area_data = bpy.data.lights.new("Key", 'AREA')
        area_data.energy = 60.0
        area_data.size = 4.0
        area = bpy.data.objects.new("Key", area_data)
        area.location = (0.8, -0.6, 2.5)
        area.rotation_euler = (math.radians(18), math.radians(16), 0.0)
        bpy.context.scene.collection.objects.link(area)
        sc = bpy.context.scene
        if sc.world is None:
            sc.world = bpy.data.worlds.new("W")
        sc.world.use_nodes = True
        bg = sc.world.node_tree.nodes.get("Background")
        if bg:
            bg.inputs["Color"].default_value = (0.02, 0.02, 0.03, 1.0)  # dark, for contrast
            bg.inputs["Strength"].default_value = 1.0
        sc.render.engine = 'CYCLES'
        sc.cycles.device = 'CPU'
        sc.cycles.samples = 16
        sc.render.resolution_x = 480
        sc.render.resolution_y = 480
        sc.render.film_transparent = False
        sc.render.filepath = preview_png
        bpy.ops.render.render(write_still=True)
        log("preview", preview_png)

    # --- orient for glTF (+Y up): face -> three.js XY plane ---
    obj.rotation_euler = (math.radians(90), 0.0, 0.0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)

    # --- export GLB (selection only) ---
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.export_scene.gltf(
        filepath=out_glb,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_apply=True,
    )
    report["ok"] = True
except Exception as e:
    import traceback
    report["ok"] = False
    report["error"] = repr(e)
    report["trace"] = traceback.format_exc()

open("/tmp/svg_glb_report.json", "w").write(json.dumps(report, indent=2))
print("svg_to_glb:", "OK" if report.get("ok") else "FAILED", "->", out_glb)
