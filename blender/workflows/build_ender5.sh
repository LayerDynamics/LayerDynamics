#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."          # repo root
# --factory-startup is REQUIRED on macOS: opening a saved .blend in --background
# otherwise fires a GPU-backed icon/material preview job that aborts (no Metal
# context in background). Keep it on every invocation that opens a file.
BL="blender --background --factory-startup"
PYBL="/Applications/Blender.app/Contents/Resources/5.1/python/bin/python3.13"

stage() { echo "── $* ──"; }

case "${1:-all}" in
  deps)    stage "install OCP";     "$PYBL" -m pip install --no-deps cadquery-ocp cadquery-ocp-proxy ;;
  import)  stage "STEP→meshes";     $BL --python blender/scripts/10_import_step.py ;;
  group)   stage "cull+group";      $BL blender/assets/ender5_raw.blend --python blender/scripts/20_cull_group.py ;;
  reassign) stage "reassign";       $BL blender/assets/ender5_raw.blend --python blender/scripts/21_reassign.py ;;
  rig)     stage "rig";             $BL blender/assets/ender5_raw.blend --python blender/scripts/30_rig.py ;;
  anim)    stage "animate";         $BL blender/assets/ender5_rig.blend --python blender/scripts/40_animate.py ;;
  decimate) stage "decimate";       $BL blender/assets/ender5_rig.blend --python blender/scripts/45_decimate.py ;;
  export)  stage "optimize+export"; $BL blender/assets/ender5_rig.blend --python blender/scripts/50_optimize_export.py ;;
  render)  stage "render ${2:?blend} ${3:?tag}"; $BL "$2" --python blender/scripts/render_check.py -- "$3" ;;
  all)     "$0" deps && "$0" import && "$0" group && "$0" reassign && "$0" rig && "$0" anim && "$0" decimate && "$0" export ;;
  *) echo "usage: $0 {deps|import|group|reassign|rig|anim|decimate|export|all|render <blend> <tag>}"; exit 1 ;;
esac
