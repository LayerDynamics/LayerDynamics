# M1 — Data + brand colors

**Goal:** A typed, curated, multi-tag mapping from each of the five languages to its
logo GLB, brand color, and an ordered list of real project ids — plus the per-language
brand colors. No UI. This is the source of truth M2–M4 consume.

**Depends on:** nothing. **Blocks:** M2, M3, M4.

## Files

- **New** `apps/client/src/data/languages.ts`
- **New** `apps/client/src/data/languages.test.ts` (Vitest unit project — node env)
- **Edit** `apps/client/src/styles/brand.ts` — add a `langColor` map

## Tasks

1. **`data/languages.ts`** — define the model and the curated data:
   ```ts
   import type { Project } from './projects'
   import { projectById } from './projects'

   /** Stable url/key slug per language (used in the route /languages/:lang). */
   export type LanguageId = 'python' | 'rust' | 'typescript' | 'deno' | 'webassembly'

   export interface LanguageDef {
     id: LanguageId
     label: string          // display name, e.g. "TypeScript"
     blurb: string          // one-line framing for the page header
     glb: string            // '/assets/objects/<Name>Logo.glb'
     /** Curated, ORDERED project ids (flagship → strong → notable). Multi-tag:
      *  an id may appear under several languages. */
     projectIds: string[]
   }

   export const languages: LanguageDef[] = [ /* the 5, seeded from the index table */ ]

   export const languageById = (id: string): LanguageDef | undefined =>
     languages.find((l) => l.id === id)

   /** Resolve a language's curated ids to Project objects, dropping any unknown id. */
   export const projectsForLanguage = (id: string): Project[] => {
     const def = languageById(id)
     if (!def) return []
     return def.projectIds.map(projectById).filter((p): p is Project => Boolean(p))
   }

   /** Display order of the logos in the level (left → right). */
   export const languageOrder: LanguageId[] =
     ['python', 'rust', 'typescript', 'deno', 'webassembly']
   ```
   - Seed `projectIds` from the **index file's mapping table** (real ids verified to exist
     in `projects.ts`). Order each list flagship → strong → notable.
   - `glb` paths: `/assets/objects/{Python,Rust,TypeScript,Deno,WebAssembly}Logo.glb`
     (these exist — created in the prior session; verify with `ls`).
   - Write real `label`/`blurb` per language (no placeholders) — e.g. Rust:
     "Systems work — runtimes, native interop, and browser engines."

2. **`styles/brand.ts`** — add the per-language brand colors used by the material override
   and the page accent. Match the index table:
   ```ts
   export const langColor: Record<LanguageId, string> = {
     python: '#3776AB', rust: '#DEA584', typescript: '#3178C6',
     deno: '#E5E7EB', webassembly: '#654FF0',
   }
   ```
   Keep `LanguageId` import type-only to satisfy `erasableSyntaxOnly`. (If a circular
   import with `data/languages.ts` arises, define `LanguageId` in `languages.ts` and import
   it into `brand.ts` type-only, or inline the keys.)

3. **`data/languages.test.ts`** — referential-integrity unit test (runs in the `unit`
   Vitest project, node env — no browser):
   - every `LanguageDef.projectIds` entry resolves via `projectById` (no dangling ids);
   - every `languageId` has a `langColor` entry and a non-empty `glb`;
   - `languageOrder` is a permutation of `languages.map(l => l.id)` (same set, length 5);
   - `projectsForLanguage(id)` length === `projectIds.length` for each language
     (proves no id was silently dropped);
   - multi-tag sanity: at least one project id appears in ≥2 languages (e.g. `browserx`).

## Acceptance criteria

- `pnpm --filter client test:unit` passes including the new `languages.test.ts`.
- `pnpm --filter client lint` and `tsc -b` clean (no unused, no `any`, type-only imports
  where required by `erasableSyntaxOnly`).
- No UI/scene changes in this milestone.

## Verification

```bash
cd apps/client
pnpm test:unit            # new test green
pnpm lint
pnpm exec tsc -b --noEmit # or: pnpm build (tsc -b && vite build)
ls public/assets/objects/{Python,Rust,TypeScript,Deno,WebAssembly}Logo.glb  # all present
```

## Notes / no-stub guard

- `projectIds` must be **real ids from `projects.ts`** — the test fails on any typo.
- No component, story, or route here; keep the milestone small (pacing).
