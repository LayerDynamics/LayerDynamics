"""Assign brand materials and export a RAW full-res glTF (geometry + rig + anim).

No Draco, no decimation: Blender's job is authoring. Web optimization (mesh join,
meshopt simplify, palette materials, Draco) is done downstream by gltfjsx -T -S
(see build_ender5.sh weboptimize), which is purpose-built for it and does it
better. Output is the gitignored intermediate lib_ender5.RAW_GLB.
Run via: build_ender5.sh export
"""
import bpy, sys, os

sys.path.append(os.path.join(os.getcwd(), "blender", "scripts"))
import lib_ender5 as L


def mat(name, color, metal, rough):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1.0)
    bsdf.inputs["Metallic"].default_value = metal
    bsdf.inputs["Roughness"].default_value = rough
    return m


def main():
    alu = mat("alu", (0.62, 0.63, 0.66), 0.9, 0.35)        # frame extrusions / brackets
    plas = mat("plas", (0.07, 0.07, 0.09), 0.0, 0.55)      # dark plastic / covers
    glass = mat("glass", (0.10, 0.12, 0.16), 0.2, 0.20)    # build plate
    accent = mat("accent", (0.45, 0.36, 0.85), 0.8, 0.30)  # brand violet metal

    def pick(n):
        n = n.lower()
        if any(k in n for k in ("frame", "strut", "bracket", "endcap", "corner", "guide-rod")):
            return alu
        if any(k in n for k in ("plate", "magnetic", "glass", "build")):
            return glass
        if any(k in n for k in ("nozzle", "hot-end", "heat", "gear", "pulley", "bearing", "shaft", "lead-screw", "wheel")):
            return accent
        return plas

    for ob in bpy.data.objects:
        if ob.type == 'MESH':
            ob.data.materials.clear()
            ob.data.materials.append(pick(ob.name))

    # One translation clip per mover (Bed_Z / GantryY / CarriageX), all the same
    # 10 s range; PrintingLevel scrubs them together.
    bpy.context.scene.name = "Print"

    out = os.path.abspath(L.RAW_GLB)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format='GLB',
        use_selection=True,
        export_draco_mesh_compression_enable=False,   # gltfjsx -T does Draco
        export_animations=True,
        export_animation_mode='SCENE',
        export_apply=False,
        export_yup=True,
        export_extras=True,
    )
    size = os.path.getsize(out)
    print("@@EXPORTRAW %s bytes=%d (%.2f MB)" % (out, size, size / 1e6))


main()
