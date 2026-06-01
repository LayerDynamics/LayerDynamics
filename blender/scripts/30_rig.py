"""Build the empties rig and parent the kinematic groups.

Creates one empty per group at a sensible pivot, parents each group's meshes to
its empty (keep transform), nests CarriageX under GantryY, and derives the three
travel axes (no hardcoded up-axis): vertical from the lead-screw, left-right from
the x-axis-strut, front-back = the remaining axis. Axes are stored as custom
props on the mover empties for the animation stage. Saves ender5_rig.blend.
Run via: build_ender5.sh rig
"""
import bpy, sys, os
from mathutils import Vector, Matrix

sys.path.append(os.path.join(os.getcwd(), "blender", "scripts"))
import lib_ender5 as L


def find_mesh(exact, exclude=()):
    """Prefer an exact base-name match; fall back to startswith. Skip excludes."""
    cands = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in cands:
        if o.name.split(".")[0].lower() == exact and not o.name.lower().startswith(exclude):
            return o
    for o in cands:
        n = o.name.lower()
        if n.startswith(exact) and not n.startswith(exclude):
            return o
    raise RuntimeError("rig: could not find part '%s'" % exact)


def longest_axis(ob):
    d = [ob.dimensions.x, ob.dimensions.y, ob.dimensions.z]
    i = d.index(max(d))
    v = Vector((0, 0, 0))
    v[i] = 1.0
    return v, i


def coll_center(name):
    obs = list(bpy.data.collections[name].objects)
    pts = [ob.matrix_world @ Vector(b) for ob in obs for b in ob.bound_box]
    return sum(pts, Vector()) / len(pts)


def make_empty(name, loc):
    e = bpy.data.objects.new(name, None)
    e.empty_display_size = 0.04
    e.location = loc
    bpy.context.scene.collection.objects.link(e)
    return e


def parent_keep(child, parent):
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def main():
    # Derive axes. Exclude lead-screw-nut when looking for the lead-screw rod.
    vert_ax, vi = longest_axis(find_mesh("lead-screw", exclude=("lead-screw-nut",)))
    lr_ax, li = longest_axis(find_mesh("x-axis-strut"))
    fb_i = ({0, 1, 2} - {vi, li}).pop()
    fb_ax = Vector((0, 0, 0))
    fb_ax[fb_i] = 1.0
    print("@@AXES vertical=%d LR=%d FB=%d" % (vi, li, fb_i))
    assert vi != li, "vertical and LR axes collapsed to the same axis"

    empties = {}
    for g in L.GROUPS:
        objs = list(bpy.data.collections[g].objects)
        if not objs and g == "Extruder_Spin":
            continue
        empties[g] = make_empty(g, coll_center(g) if objs else Vector())

    bpy.context.view_layer.update()  # so matrix_world is current before inverses

    for g, e in empties.items():
        for ob in list(bpy.data.collections[g].objects):
            parent_keep(ob, e)

    if "CarriageX" in empties and "GantryY" in empties:
        parent_keep(empties["CarriageX"], empties["GantryY"])

    empties["Bed_Z"]["axis"] = list(vert_ax)
    empties["GantryY"]["axis"] = list(fb_ax)
    empties["CarriageX"]["axis"] = list(lr_ax)

    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(L.BLEND_RIG))
    print("@@RIG empties=%s" % list(empties.keys()))


main()
