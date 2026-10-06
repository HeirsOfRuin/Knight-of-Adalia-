// "At stake": a short line under each choice naming what it can change, worked
// out from the choice's own effects across all its outcomes, so it cannot drift
// from what the game does. Direction is shown only when every outcome agrees.
import { CORE_EFFECT_OPS, type Choice, type CoreContent as ContentBundle, type CoreBaseEffect, type EffectLike, type GameEffect } from './schema';
import type { CoreState as GameState } from './state';
import { deref, npcLabel } from './paths';
import { gameOf, STAKES_RANK as RANK } from './game';
import { opOf } from './effects';

const TEXT_KEYS = new Set(['text', 'text_after', 'title', 'label', 'warn', 'description', 'journal', 'die']);
const readCache = new WeakMap<ContentBundle, Set<string>>();

/** Flags read by some condition, check or switch (not just by prose): a choice that sets one is remembered. */
function mechanicalReads(content: ContentBundle): Set<string> {
  let reads = readCache.get(content);
  if (reads) return reads;
  reads = new Set();
  const walk = (node: unknown, inText: boolean): void => {
    if (typeof node === 'string') {
      if (!inText) for (const m of node.matchAll(/\bflag\.([a-z0-9_]+)/g)) reads!.add(m[1]!);
    } else if (Array.isArray(node)) node.forEach((n) => walk(n, inText));
    else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (k === 'set' || k === 'clear' || k === 'add') continue;
        walk(v, inText || TEXT_KEYS.has(k));
      }
    }
  };
  for (const s of Object.values(content.scenes)) walk(s, false);
  readCache.set(content, reads);
  return reads;
}

interface Item { key: string; label: string; rank: number; signs: Set<number> }

function collect(content: ContentBundle, state: GameState, effects: readonly EffectLike[], into: Map<string, Item>, outcome: number): void {
  const reg = content.registry;
  const game = gameOf(content);
  const put = (key: string, label: string, rank: number, sign = 0) => {
    const it = into.get(key) ?? { key, label, rank, signs: new Set<number>() };
    it.signs.add(sign);
    (it as Item & { seen?: Set<number> }).seen ??= new Set();
    (it as Item & { seen: Set<number> }).seen.add(outcome);
    into.set(key, it);
  };
  for (const raw of effects) {
    const op = opOf(raw);
    if (op === 'if' || op === 'chance') {
      const w = raw as { then: EffectLike[]; else?: EffectLike[] };
      collect(content, state, w.then, into, outcome);
      collect(content, state, w.else ?? [], into, outcome);
      continue;
    }
    if (!CORE_EFFECT_OPS.has(op)) { game.stakesOf?.(content, state, raw as GameEffect, put); continue; }
    const e = raw as CoreBaseEffect;
    if ('add' in e) {
      for (const [raw, d] of Object.entries(e.add)) {
        const path = deref(state, raw);
        const [ns, a, b] = path.split('.');
        const sign = Math.sign(d);
        switch (ns) {
          case 'res':
            if (a === 'renown') put('renown', 'Renown', RANK.renown, sign);
            else if (a === 'coin') put('coin', 'Coin', RANK.coin, sign);
            else if (a === 'men') put('men', 'Your men', RANK.men, sign);
            break;
          case 'rep': put(`rep.${a}`, reg.factions[a!]?.label ?? a!, RANK.rep, sign); break;
          case 'rel': {
            if (b === 'loyalty') put('loyalty', "Your men's loyalty", RANK.men, sign);
            else put(`rel.${a}`, npcLabel(content, a!), RANK.rel, sign);
            break;
          }
          case 'skill': case 'attr': put(path, a!.charAt(0).toUpperCase() + a!.slice(1), RANK.skill, sign); break;
          case 'counter': {
            const label = content.config.counter_labels[a!];
            if (label) put(`counter.${a}`, label, game.counterRank?.(a!) ?? RANK.battle, sign);
            break;
          }
          default:
            if (game.namespaces.includes(ns!)) game.stakesOfAdd?.(content, path, sign, put);
        }
      }
    } else if ('die' in e) put('life', 'Your life', RANK.life, -1);
    else if ('injury' in e) put('wound', 'A wound', RANK.life, -1);
    else if ('casualties' in e) put('men', 'Your men', RANK.men, -1);
    else if ('station' in e) put('station', 'Your station', RANK.station, 1);
    else if ('join' in e) put('men', 'Your men', RANK.men, 1);
    else if ('leave' in e) put('men', 'Your men', RANK.men, -1);
    else if ('item' in e) put(`item.${e.item.slice(1)}`, reg.items[e.item.slice(1)]?.label ?? e.item.slice(1), RANK.other, e.item.startsWith('+') ? 1 : -1);
    else if ('set' in e) {
      const f = e.set.replace(/^flag\./, '');
      if (mechanicalReads(content).has(f)) put('remembered', 'Remembered later', RANK.remembered, 0);
    }
  }
}

/** Up to four short items, e.g. ["Renown +", "Honor −", "Remembered later"]. Empty when nothing is at stake. */
export function stakesFor(content: ContentBundle, state: GameState, c: Choice): string[] {
  const outcomes: EffectLike[][] = c.check
    ? (['success', 'partial', 'failure'] as const).filter((k) => c[k]).map((k) => [...c.effects, ...(c[k]!.effects ?? [])])
    : [c.effects];
  const items = new Map<string, Item>();
  outcomes.forEach((o, i) => collect(content, state, o, items, i));
  return [...items.values()]
    .sort((x, y) => x.rank - y.rank)
    .slice(0, 4)
    .map((it) => {
      const signs = [...it.signs].filter((s) => s !== 0);
      if (it.key === 'life' || it.key === 'wound' || it.key === 'remembered' || signs.length === 0) return it.label;
      if (new Set(signs).size === 1) return `${it.label} ${signs[0]! > 0 ? '+' : '−'}`;
      return `${it.label} ±`;
    });
}
