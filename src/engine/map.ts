// The world map: where scenes happen, where the hero has been, and what he knows of.
// Terrain is drawn by tools/make-map.ts; places are registry/places.yaml; scene places
// are content/map/scene-places.yaml (place ids, or @home/@service/@manor/@town).
import type { ContentBundle, PlaceDef } from '../content/schema';
import type { GameState } from './state';
import { test } from './conditions';

const HOME: Record<string, string> = { reeve: 'ashby', burgess: 'wendham', archer: 'hollin', servant: 'ravell_hall' };

/** A scene's place reference resolved for this run. */
export function resolvePlace(ref: string | undefined, state: GameState): string | undefined {
  if (!ref) return undefined;
  switch (ref) {
    case '@home': return HOME[state.background] ?? 'wendham';
    case '@service': return state.track === 'levy' ? 'brome' : 'ravell_hall';
    case '@manor': return state.flags.c2_granted_kerval ? 'kerval' : state.flags.c2_granted_marsalin ? 'marsalin' : state.flags.c2_granted_ormel ? 'ormel' : undefined;
    case '@town': return state.flags.c2_granted_kerval ? 'lannec' : 'sauvemer';
  }
  return ref;
}

export function placeOfScene(content: ContentBundle, state: GameState, scene: string): string | undefined {
  return resolvePlace(content.map?.scenes[scene], state);
}

export interface Visit { place: string; at: number; scene: string; title?: string }

/** Every stay at a place, oldest first: one entry per run of journal entries at the same place. */
export function visits(content: ContentBundle, state: GameState): Visit[] {
  const out: Visit[] = [];
  const add = (scene: string, at: number, title?: string) => {
    const place = placeOfScene(content, state, scene);
    if (!place) return;
    const last = out.at(-1);
    if (last && last.place === place) return;
    out.push({ place, at, scene, title });
  };
  for (const e of state.journal) add(e.scene, e.at, e.sceneTitle);
  if (!state.ended) add(state.scene, state.time, content.scenes[state.scene]?.title);
  return out;
}

/** Where he is now: the current scene's place, or the last place he was. */
export function hereNow(content: ContentBundle, state: GameState): string | undefined {
  return placeOfScene(content, state, state.scene) ?? visits(content, state).at(-1)?.place;
}

/** Places he knows of: those whose condition holds, and anywhere he has been. */
export function knownPlaces(content: ContentBundle, state: GameState): Record<string, PlaceDef> {
  const been = new Set(visits(content, state).map((v) => v.place));
  const out: Record<string, PlaceDef> = {};
  for (const [id, p] of Object.entries(content.registry.places)) {
    if (been.has(id) || p.if === undefined || test(p.if, state, content)) out[id] = p;
  }
  return out;
}
