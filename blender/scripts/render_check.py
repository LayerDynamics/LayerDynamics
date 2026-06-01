"""Render a framed thumbnail of the current .blend for visual verification.

Usage: blender --background <file.blend> --python render_check.py -- <tag>
Writes blender/assets/_renders/<tag>.png (auto-frames all mesh objects).
"""
import bpy, sys, os, math
from mathutils import Vector

sys.path.append(os.path.join(os.getcwd(), "blender", "scripts"))
import lib_ender5 as L


def scene_bounds():
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    found = False
    for ob in bpy.data.objects:
        if ob.type != 'MESH':
            continue
        found = True
        for corner in ob.bound_box:
            w = ob.matrix_world @ Vector(corner)
            for i in range(3):
                mn[i] = min(mn[i], w[i])
                mx[i] = max(mx[i], w[i])
    return (mn, mx) if found else (Vector((-1, -1, -1)), Vector((1, 1, 1)))


def main():
    tag = sys.argv[-1]
    out_dir = os.path.abspath(L.RENDER_DIR)
    os.makedirs(out_dir, exist_ok=True)

    mn, mx = scene_bounds()
    center = (mn + mx) * 0.5
    size = (mx - mn).length

    cam_data = bpy.data.cameras.new("rc_cam")
    cam = bpy.data.objects.new("rc_cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    # 3/4 view from front-right-top, distance scaled to the model size.
    d = size * 1.1
    cam.location = center + Vector((d * 0.7, -d * 0.7, d * 0.55))
    direction = (center - cam.location).normalized()
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    cam_data.clip_end = max(1000.0, size * 10)

    sun = bpy.data.objects.new("rc_sun", bpy.data.lights.new("rc_sun", 'SUN'))
    sun.data.energy = 4.0
    bpy.context.scene.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(55), 0, math.radians(35))

    sc = bpy.context.scene
    sc.render.resolution_x = 960
    sc.render.resolution_y = 720
    # Cycles/CPU: EEVEE needs a live GPU context, which `blender --background`
    # has none of on macOS (it aborts in WM_init_gpu). Cycles CPU renders headless.
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 24
    sc.render.film_transparent = False
    if not sc.world:
        sc.world = bpy.data.worlds.new("rc_world")
    sc.world.use_nodes = True
    bg = sc.world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.05, 0.05, 0.07, 1.0)
        bg.inputs["Strength"].default_value = 0.6
    sc.render.filepath = os.path.join(out_dir, "%s.png" % tag)
    bpy.ops.render.render(write_still=True)
    print("@@RENDER %s objects=%d size=%.3f" % (sc.render.filepath, len([o for o in bpy.data.objects if o.type == 'MESH']), size))


main()
