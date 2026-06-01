"""Drop fasteners + sort the remaining meshes into kinematic collections.

Opens ender5_raw.blend, deletes every fastener (lib_ender5.classify -> None),
links every other mesh into exactly one of the 5 group collections, saves back.
Run via: build_ender5.sh group
"""
import bpy, sys, os

sys.path.append(os.path.join(os.getcwd(), "blender", "scripts"))
import lib_ender5 as L


def base_name(ob):
    # Strip both our ".003" instance suffix and any Blender ".001" dedupe suffix.
    return ob.name.split(".")[0]


def main():
    scene_coll = bpy.context.scene.collection
    for g in L.GROUPS:
        if g not in bpy.data.collections:
            scene_coll.children.link(bpy.data.collections.new(g))

    dropped = 0
    counts = {g: 0 for g in L.GROUPS}
    for ob in list(bpy.data.objects):
        if ob.type != 'MESH':
            continue
        grp = L.classify(base_name(ob))
        if grp is None:
            bpy.data.objects.remove(ob, do_unlink=True)
            dropped += 1
            continue
        for coll in list(ob.users_collection):
            coll.objects.unlink(ob)
        bpy.data.collections[grp].objects.link(ob)
        counts[grp] += 1

    print("@@GROUP dropped=%d counts=%s" % (dropped, counts))
    assert dropped > 40, "expected to drop the ~75 fasteners, only dropped %d" % dropped
    assert counts["CarriageX"] > 0 and counts["GantryY"] > 0 and counts["Bed_Z"] > 0, \
        "a mover group is empty: %s" % counts
    bpy.ops.wm.save_mainfile()
    print("@@GROUP saved")


main()
