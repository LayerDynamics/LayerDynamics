"""Bake the print-motion clip onto the rig empties.

CarriageX sweeps left-right fast (raster), GantryY advances front-back slowly,
Bed_Z descends steadily over the clip -> reads as printing. Loop-friendly: X/Y
start ~= end. Each empty's travel axis was stored by 30_rig.py. Saves the file.
Run via: build_ender5.sh anim
"""
import bpy, sys, os, math
from mathutils import Vector

sys.path.append(os.path.join(os.getcwd(), "blender", "scripts"))
import lib_ender5 as L

PASSES = 6           # raster bands across the clip
X_TRAVEL = 0.11      # m — carriage left-right sweep amplitude (full span)
Y_TRAVEL = 0.11      # m — gantry front-back advance
Z_DROP = 0.06        # m — bed descent over the clip


def main():
    sc = bpy.context.scene
    sc.render.fps = L.FPS
    sc.frame_start = 1
    sc.frame_end = L.CLIP_FRAMES

    movers = {g: bpy.data.objects[g] for g in ("Bed_Z", "GantryY", "CarriageX")}
    home = {g: movers[g].location.copy() for g in movers}
    axis = {g: Vector(movers[g]["axis"]).normalized() for g in movers}

    for f in range(1, L.CLIP_FRAMES + 1):
        t = (f - 1) / (L.CLIP_FRAMES - 1)               # 0..1
        x = math.sin(t * PASSES * math.pi) * (X_TRAVEL / 2)   # fast LR sweep
        y = t * Y_TRAVEL - Y_TRAVEL / 2                        # slow FB advance
        z = -t * Z_DROP                                        # bed descends
        movers["CarriageX"].location = home["CarriageX"] + axis["CarriageX"] * x
        movers["GantryY"].location = home["GantryY"] + axis["GantryY"] * y
        movers["Bed_Z"].location = home["Bed_Z"] + axis["Bed_Z"] * z
        for g in movers:
            movers[g].keyframe_insert("location", frame=f)

    # keyframe_insert already creates BEZIER keys (the factory default), which
    # gives the carriage smooth ease at each sweep extreme. Blender 5.1 moved
    # fcurves under slotted actions, so we do not post-process them here.

    print("@@ANIM action frames=%d fps=%d X=%.3f Y=%.3f Z=%.3f"
          % (L.CLIP_FRAMES, L.FPS, X_TRAVEL, Y_TRAVEL, Z_DROP))
    bpy.ops.wm.save_mainfile()
    print("@@ANIM saved")


main()
