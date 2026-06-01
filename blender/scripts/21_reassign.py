"""Reassign spatially-ambiguous shared parts to the correct mover.

Some shared families (steppers, pulleys, belts, bearings, hose fittings) are
named generically and may land in the wrong group. Move any such part to the
mover whose combined bounding box contains the part's centroid, so a part
physically riding the carriage moves with the carriage.
Run via: build_ender5.sh reassign
"""
import bpy, sys, os
from mathutils import Vector

sys.path.append(os.path.join(os.getcwd(), "blender", "scripts"))
import lib_ender5 as L

# Only these generic shared families are reconsidered; named-anchored parts are
# never moved (e.g. x-axis-* stays GantryY, hot-end-* stays CarriageX).
AMBIG = ("stepper-motor", "toothed-pulley", "pulley-half", "x-axis-belt",
         "hose-fitting", "flanged-bearing", "drive-shaft", "shaft-coupling")


def world_center(ob):
    return sum((ob.matrix_world @ Vector(b) for b in ob.bound_box), Vector()) / 8.0


def group_bbox(name):
    obs = list(bpy.data.collections[name].objects)
    if not obs:
        return None
    pts = [ob.matrix_world @ Vector(b) for ob in obs for b in ob.bound_box]
    mn = Vector((min(p[i] for p in pts) for i in range(3)))
    mx = Vector((max(p[i] for p in pts) for i in range(3)))
    return mn, mx


def contains(box, p, pad=0.005):
    if not box:
        return False
    mn, mx = box
    return all(mn[i] - pad <= p[i] <= mx[i] + pad for i in range(3))


def main():
    # Priority order: most-specific (smallest) mover first so a part inside the
    # carriage box (which sits inside the gantry box) is claimed by the carriage.
    movers = ["CarriageX", "GantryY", "Bed_Z"]
    boxes = {m: group_bbox(m) for m in movers}
    moved = 0
    for ob in list(bpy.data.objects):
        if ob.type != 'MESH':
            continue
        if not ob.name.lower().startswith(AMBIG):
            continue
        cur = ob.users_collection[0].name if ob.users_collection else None
        p = world_center(ob)
        for m in movers:
            if m != cur and contains(boxes[m], p):
                for c in list(ob.users_collection):
                    c.objects.unlink(ob)
                bpy.data.collections[m].objects.link(ob)
                moved += 1
                print("@@REASSIGN %s : %s -> %s" % (ob.name, cur, m))
                break
    print("@@REASSIGN total=%d" % moved)
    bpy.ops.wm.save_mainfile()
    print("@@REASSIGN saved")


main()
