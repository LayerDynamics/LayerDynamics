# @layerdynamics/dissolving-mesh

Disintegrate any three.js geometry into rigid, burning flakes that fly outward — the
"eroded / vertices shoot away" effect — while keeping the source material's PBR lighting.

## Why it works on a GLB (and STL/OBJ would be worse)

The file format is irrelevant to the effect: a GLB is just how the mesh is *delivered*.
The dissolve is a **runtime vertex-shader displacement** injected into a standard PBR
material. GLB's indexed, attribute-rich, GPU-ready geometry is the *best* starting point
— this package even rebuilds it into per-triangle "flakes" so each chip flies off intact
instead of the surface tearing.

## How it works

1. **`prepareErosionGeometry(geometry)`** — clones the geometry, makes it non-indexed
   (`toNonIndexed`) so every triangle owns its 3 verts, and writes three per-triangle
   attributes onto all corners of each triangle:
   - `aScatter` — the flake's outward-biased random launch direction (deterministic per seed)
   - `aCentroid` — the triangle centroid; the dissolve is gated on this so all 3 corners
     release together and the flake stays rigid
   - `aSeed` — a per-flake 0..1 timing jitter
2. **`ErosionMaterial`** — extends `MeshStandardMaterial` and injects the effect via
   `onBeforeCompile`: a simplex-noise erosion front sweeps across the mesh (`uProgress`),
   each flake spins about its launch axis, flies along `aScatter` with a gravity arc, and
   glows at the dissolving edge before being discarded once fully gone.
3. **`<DissolvingMesh>`** — wires both together; drive it with a controlled `progress`
   prop (scrub / scroll-bind) or let it auto-play (ping-pong by default).

## Usage

```tsx
import { DissolvingMesh } from '@layerdynamics/dissolving-mesh'
import { useMemo } from 'react'
import { TorusKnotGeometry } from 'three'

function Demo() {
  const geometry = useMemo(() => new TorusKnotGeometry(1, 0.32, 220, 32), [])
  return (
    <DissolvingMesh
      geometry={geometry}
      color="#9bb4ff"
      edgeColor="#ff5a1f"
      duration={4}
      scatter={2.2}
      pingPong
    />
  )
}
```

Controlled (e.g. bound to scroll):

```tsx
<DissolvingMesh geometry={geometry} progress={scroll} />
```

## Key props

| prop | default | meaning |
| --- | --- | --- |
| `geometry` | — | the geometry to dissolve (cloned, never mutated) |
| `progress` | — | controlled 0..1 dissolve; disables auto-play when set |
| `autoPlay` / `duration` / `loop` / `pingPong` / `paused` | `true` / `3` / `true` / `true` / `false` | auto-animation |
| `scatter` | `1.5` | distance a flake travels |
| `noiseScale` | `1.2` | grain of the erosion front |
| `edgeWidth` | `0.15` | width of the release band |
| `spin` | `2` | flake tumble |
| `gravity` | `0.6` | downward arc on flying flakes |
| `color` / `roughness` / `metalness` | — | standard PBR surface |
| `edgeColor` / `edgeStrength` | `#ff5a1f` / `2.5` | burning-edge glow |
| `seed` / `normalBias` | `1` / `0.6` | flake generation |

## Scripts

```bash
pnpm --filter @layerdynamics/dissolving-mesh dev           # visual demo (torus knot)
pnpm --filter @layerdynamics/dissolving-mesh test          # node + chromium tests
pnpm --filter @layerdynamics/dissolving-mesh test:unit     # node-only logic tests
pnpm --filter @layerdynamics/dissolving-mesh lint
pnpm --filter @layerdynamics/dissolving-mesh typecheck
```
