"""Shared config for the Ender 5 Pro asset pipeline (SPEC-002 PrintingLevel)."""
import re

# Ordered classification: first matching group wins. Fasteners are dropped.
FASTENER = re.compile(
    r"^(bhcs|shcs|fhsc|bh-screw|capscrew|hex-nut|lock-washer|locknut|flat-washer|"
    r"set-screw|stop-screw|t-nut|t-slot-nut|eccentric-nut|delrin-spacer|wheel-spacer)",
    re.I,
)
CARRIAGE_X = re.compile(r"^(hot-end|nozzle|heat-break|heat-sink|fan-shroud|part-cooling-fan|part-fan-duct)", re.I)
GANTRY_Y = re.compile(r"^x-axis", re.I)
BED_Z = re.compile(r"^(build-plate|magnetic-plate|heater-plate|sub-plate|z-axis-bearing-plate|lead-screw-nut|leveling-wheel)", re.I)
EXTRUDER = re.compile(r"^(extruder-gear|extruder-pulley)", re.I)

GROUPS = ["Frame_Static", "Bed_Z", "GantryY", "CarriageX", "Extruder_Spin"]


def classify(name: str):
    """Return target group name, or None if the part should be dropped."""
    n = name.strip()
    if FASTENER.match(n):
        return None
    if CARRIAGE_X.match(n):
        return "CarriageX"
    if GANTRY_Y.match(n):
        return "GantryY"
    if BED_Z.match(n):
        return "Bed_Z"
    if EXTRUDER.match(n):
        return "Extruder_Spin"
    return "Frame_Static"


# Pipeline paths (relative to repo root; scripts resolve against os.getcwd()).
SRC_STEP = "blender/assets/ender-5-pro-assem.STEP"
BLEND_RAW = "blender/assets/ender5_raw.blend"   # after import
BLEND_RIG = "blender/assets/ender5_rig.blend"   # after rig+anim
# Blender exports a RAW full-res GLB (geometry + rig + animation, no Draco). The
# web optimization (mesh join, meshopt simplify, palette, Draco) is done by
# gltfjsx -T -S, which produces the public OUT_GLB below.
RAW_GLB = "blender/assets/Ender5Pro.raw.glb"
OUT_GLB = "apps/client/public/assets/objects/Ender5Pro.glb"
RENDER_DIR = "blender/assets/_renders"

# Animation: 25 fps, 10 s loopable print loop.
FPS = 25
CLIP_FRAMES = 250
MM_TO_M = 0.001
TRI_BUDGET_TOTAL = 180_000   # post-decimation triangle ceiling for the whole printer
