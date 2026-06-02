#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."          # repo root
# --factory-startup is REQUIRED on macOS: opening a saved .blend in --background
# otherwise fires a GPU-backed icon/material preview job that aborts (no Metal
# context in background). Keep it on every invocation that opens a file.
BL="blender --background --factory-startup"
PYBL="/Applications/Blender.app/Contents/Resources/5.1/python/bin/python3.13"
# gltfjsx -T -S settings: simplify ratio (keep fraction) + error tolerance.
SIMPLIFY_RATIO="${SIMPLIFY_RATIO:-0.4}"
SIMPLIFY_ERROR="${SIMPLIFY_ERROR:-0.001}"
RAW_GLB="blender/assets/Ender5Pro.raw.glb"
PUB_GLB="apps/client/public/assets/objects/Ender5Pro.glb"
TSX="apps/client/src/components/scene/PrintingLevel/Ender5Pro.tsx"

stage() { echo "── $* ──"; }

case "${1:-all}" in
  deps)    stage "install OCP";     "$PYBL" -m pip install --no-deps cadquery-ocp cadquery-ocp-proxy ;;
  import)  stage "STEP→meshes";     $BL --python blender/scripts/10_import_step.py ;;
  title)   stage "Title STEP→raw glb"; $BL --python blender/scripts/title_convert.py ;;
  group)   stage "cull+group";      $BL blender/assets/ender5_raw.blend --python blender/scripts/20_cull_group.py ;;
  reassign) stage "reassign";       $BL blender/assets/ender5_raw.blend --python blender/scripts/21_reassign.py ;;
  rig)     stage "rig";             $BL blender/assets/ender5_raw.blend --python blender/scripts/30_rig.py ;;
  anim)    stage "animate";         $BL blender/assets/ender5_rig.blend --python blender/scripts/40_animate.py ;;
  export)  stage "raw export";      $BL blender/assets/ender5_rig.blend --python blender/scripts/50_export_raw.py ;;
  weboptimize)
    stage "gltfjsx -T -S (join+simplify+draco)"
    # gltfjsx writes <rawbasename>-transformed.glb next to the -o COMPONENT, not
    # next to the source. Move it to the public asset dir.
    npx --yes gltfjsx@latest "$RAW_GLB" -T -S --ratio "$SIMPLIFY_RATIO" --error "$SIMPLIFY_ERROR" \
      -t -k -o "$TSX"
    mv -f "$(dirname "$TSX")/Ender5Pro.raw-transformed.glb" "$PUB_GLB"
    ls -l "$PUB_GLB" | awk '{print "@@WEBOPT bytes", $5, $9}'
    ;;
  render)  stage "render ${2:?blend} ${3:?tag}"; $BL "$2" --python blender/scripts/render_check.py -- "$3" ;;
  all)     "$0" deps && "$0" import && "$0" group && "$0" reassign && "$0" rig && "$0" anim && "$0" export && "$0" weboptimize ;;
  *) echo "usage: $0 {deps|import|group|reassign|rig|anim|export|weboptimize|all|render <blend> <tag>}"; exit 1 ;;
esac
