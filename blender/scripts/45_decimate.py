"""Decimate the printer to the web triangle budget (lib_ender5.TRI_BUDGET_TOTAL).

Applies a COLLAPSE decimate to each non-trivial mesh at the global ratio needed
to hit the budget, skipping already-tiny meshes. Modifiers are applied so the
rig/animation (object-level parenting + keyframes) is untouched. Saves the file.
Run via: build_ender5.sh decimate
"""
import bpy, sys, os

sys.path.append(os.path.join(os.getcwd(), "blender", "scripts"))
import lib_ender5 as L


def tris(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def main():
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')

    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    before = sum(tris(o) for o in meshes)
    ratio_global = min(1.0, L.TRI_BUDGET_TOTAL / before) if before else 1.0
    print("@@DECIMATE before=%d budget=%d ratio=%.4f" % (before, L.TRI_BUDGET_TOTAL, ratio_global))

    if ratio_global < 1.0:
        for ob in meshes:
            if tris(ob) < 200:          # leave simple parts (boxes/plates) intact
                continue
            bpy.ops.object.select_all(action='DESELECT')
            bpy.context.view_layer.objects.active = ob
            ob.select_set(True)
            m = ob.modifiers.new("dec", 'DECIMATE')
            m.decimate_type = 'COLLAPSE'
            m.ratio = max(0.05, ratio_global)
            bpy.ops.object.modifier_apply(modifier=m.name)

    after = sum(tris(o) for o in [o for o in bpy.data.objects if o.type == 'MESH'])
    print("@@DECIMATE after=%d (%.1f%% of budget)" % (after, 100.0 * after / L.TRI_BUDGET_TOTAL))
    assert after <= L.TRI_BUDGET_TOTAL * 1.15, "decimation missed budget: %d" % after
    bpy.ops.wm.save_mainfile()
    print("@@DECIMATE saved")


main()
