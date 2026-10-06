// Content validation every game on the engine shares: conditions, text, effects, links between
// scenes, flags, choices and endings. A game adds its own checks through ValidateOptions.
// The same rules as Knight of Adalia's validator (games/knight/tools/validate-lib.ts), without
// its backgrounds, wives and death rule; that validator keeps its own copy.
import { validateCond, condPaths } from '@engine/conditions';
import { validateText } from '@engine/text';
import { checkPath, unhero } from '@engine/paths';
import { opOf } from '@engine/effects';
import { gameOf } from '@engine/game';
import { CORE_EFFECT_OPS, type Choice, type CondInput, type CoreBaseEffect, type CoreContent, type EffectLike, type Next, type Outcome, type Scene, type SimpleNext } from '@engine/schema';

export type Severity = 'error' | 'warning';
export interface Issue { severity: Severity; where: string; message: string }

export interface ValidateOptions {
  /** scenes play can start at (each opening's first scene); reachability is counted from these */
  starts: string[];
  /** the keys scene.variants may use (backgrounds, frames) */
  variantKeys: string[];
  /** flags set outside effects (a start's own flags) */
  flagsSetElsewhere?: string[];
  /** a game's checks on one of its own effect ops */
  checkGameEffect?: (where: string, e: EffectLike, err: (where: string, m: string) => void) => void;
  /** a death does not end the game (the house goes on), so a dying outcome still needs a next scene */
  deathContinues?: boolean;
  /** scenes the game itself queues (news, the succession), reachable from anywhere */
  queuedByGame?: string[];
  /** a game's checks on each scene */
  checkScene?: (where: string, s: Scene, err: (where: string, m: string) => void, warn: (where: string, m: string) => void) => void;
}

const CORE_ADDABLE = ['attr', 'skill', 'rep', 'res', 'rel', 'favor', 'counter', 'health'];
const CORE_ASSIGNABLE = ['res', 'chapter', 'track', 'counter', 'flag', 'rel'];

export function outcomesOf(c: Choice): { label: string; o: Outcome }[] {
  if (c.check) return (['success', 'partial', 'failure'] as const).filter((k) => c[k]).map((k) => ({ label: k, o: c[k]! }));
  return [{ label: 'direct', o: { text: c.text_after, effects: c.effects, next: c.next } }];
}

export function simpleNexts(n: Next | undefined): SimpleNext[] {
  if (n === undefined) return [];
  if (typeof n === 'object' && 'switch' in n) return [...n.switch.map((b) => b.go), n.default];
  return [n];
}

/** Every effect, with the if and chance wrappers opened. */
export function flatEffects(effects: readonly EffectLike[]): EffectLike[] {
  const out: EffectLike[] = [];
  for (const e of effects) {
    const op = opOf(e);
    if (op === 'if' || op === 'chance') {
      const w = e as { then: EffectLike[]; else?: EffectLike[] };
      out.push(...flatEffects(w.then), ...flatEffects(w.else ?? []));
    } else out.push(e);
  }
  return out;
}

export function validateContent(content: CoreContent, opts: ValidateOptions): Issue[] {
  const issues: Issue[] = [];
  const err = (where: string, message: string) => issues.push({ severity: 'error', where, message });
  const warn = (where: string, message: string) => issues.push({ severity: 'warning', where, message });
  const reg = content.registry;
  const scenes = content.scenes;
  const game = gameOf(content);
  const flagsRead = new Set<string>();
  const flagsSet = new Set<string>(opts.flagsSetElsewhere ?? []);

  const checkCond = (where: string, c: CondInput | undefined) => {
    if (c === undefined) return;
    for (const e of validateCond(c, content)) err(where, e);
    try {
      for (const p of condPaths(c)) if (p.startsWith('flag.')) flagsRead.add(p.slice(5));
    } catch { /* reported above */ }
  };
  const checkText = (where: string, src: string | undefined) => {
    if (!src) return;
    const r = validateText(src, content);
    r.errors.forEach((e) => err(where, `text: ${e}`));
    r.paths.filter((p) => p.startsWith('flag.')).forEach((p) => flagsRead.add(p.slice(5)));
  };
  const npcRef = (id: string) => (id.startsWith('@') ? content.config.aliases.includes(id.slice(1)) : id in reg.npcs);

  const checkSimpleNext = (where: string, n: SimpleNext, scene: Scene) => {
    if (typeof n === 'object') {
      if (!Object.values(scenes).some((s) => s.kind === 'pool' && s.pool === n.pool)) err(where, `pool "${n.pool}" has no scenes`);
      if (!scenes[n.then]) err(where, `then: unknown scene "${n.then}"`);
    } else if (n === '@return') {
      if (scene.kind === 'spine') err(where, '"@return" used in a spine scene');
    } else if (!scenes[n]) err(where, `next: unknown scene "${n}"`);
  };
  const checkNext = (where: string, raw: Next | undefined, scene: Scene) => {
    if (raw === undefined) { err(where, 'no next scene'); return; }
    if (typeof raw === 'object' && 'switch' in raw) raw.switch.forEach((b) => checkCond(where, b.if));
    for (const n of simpleNexts(raw)) checkSimpleNext(where, n, scene);
  };

  const checkEffects = (where: string, effects: readonly EffectLike[], lethalOk: boolean): void => {
    for (const raw of effects) {
      const op = opOf(raw);
      if (op === 'if' || op === 'chance') {
        const w = raw as { if?: CondInput; then: EffectLike[]; else?: EffectLike[] };
        if (op === 'if') checkCond(where, w.if);
        checkEffects(where, w.then, lethalOk);
        checkEffects(where, w.else ?? [], lethalOk);
        continue;
      }
      if (!CORE_EFFECT_OPS.has(op)) { opts.checkGameEffect?.(where, raw, err); continue; }
      const e = raw as CoreBaseEffect;
      if ('set' in e || 'clear' in e) {
        const ref = 'set' in e ? e.set : e.clear;
        if (!ref.startsWith('flag.')) { err(where, `set/clear takes flag.<id>, got "${ref}"`); continue; }
        const f = ref.slice(5);
        if (!(f in reg.flags)) err(where, `undeclared flag "${f}"`);
        if ('set' in e) flagsSet.add(f); else flagsRead.add(f);
      } else if ('add' in e) {
        for (const p of Object.keys(e.add)) {
          const ns = unhero(p).split('.')[0]!;
          const ok = CORE_ADDABLE.includes(ns) || (game.namespaces.includes(ns) && !!game.addNumber);
          if (!ok) err(where, `add: cannot add to "${p}"`);
          else if (ns !== 'health') { const pe = checkPath(content, p); if (pe) err(where, `add: ${pe}`); }
        }
      } else if ('assign' in e) {
        for (const [p, v] of Object.entries(e.assign)) {
          const ns = unhero(p).split('.')[0]!;
          if (!CORE_ASSIGNABLE.includes(ns) && !(game.namespaces.includes(ns) && game.assignValue)) err(where, `assign: cannot assign "${p}"`);
          if (p === 'chapter' && !content.config.chapters.includes(String(v))) err(where, `assign: unknown chapter "${v}"`);
          if (unhero(p) === 'track' && !content.config.tracks.includes(String(v))) err(where, `assign: unknown track "${v}"`);
          if (p.startsWith('flag.')) { if (v) flagsSet.add(p.slice(5)); if (!(p.slice(5) in reg.flags)) err(where, `undeclared flag "${p.slice(5)}"`); }
        }
      } else if ('trait' in e) { if (!(e.trait.slice(1) in reg.traits)) err(where, `unknown trait "${e.trait.slice(1)}"`); }
      else if ('item' in e) { if (!(e.item.slice(1) in reg.items)) err(where, `unknown item "${e.item.slice(1)}"`); }
      else if ('injury' in e) { if (!(e.injury in reg.injuries)) err(where, `unknown injury "${e.injury}"`); }
      else if ('heal' in e) { if (!(e.heal in reg.injuries)) err(where, `unknown injury "${e.heal}"`); }
      else if ('station' in e) {
        if (!content.config.stations.includes(e.station)) err(where, `unknown station "${e.station}"`);
        if (e.track && !content.config.tracks.includes(e.track)) err(where, `unknown track "${e.track}"`);
      } else if ('meet' in e || 'kill' in e || 'join' in e || 'leave' in e) {
        const id = 'meet' in e ? e.meet : 'kill' in e ? e.kill : 'join' in e ? e.join : e.leave;
        if (!npcRef(id)) err(where, `unknown npc or alias "${id}"`);
      } else if ('casualties' in e) {
        for (const id of e.casualties.spare) if (!(id in reg.npcs)) err(where, `casualties: unknown npc "${id}" in spare`);
      } else if ('alias' in e) {
        for (const [k, v] of Object.entries(e.alias)) {
          if (!content.config.aliases.includes(k)) err(where, `unknown alias "${k}"`);
          if (!(v in reg.npcs)) err(where, `alias ${k}: unknown npc "${v}"`);
        }
      } else if ('queue' in e) {
        const q = scenes[e.queue.event];
        if (e.queue.earliest_chapter && !content.config.chapters.includes(e.queue.earliest_chapter)) err(where, `queue: unknown chapter "${e.queue.earliest_chapter}"`);
        if (!q) err(where, `queue: unknown event "${e.queue.event}"`);
        else if (q.kind !== 'queued') err(where, `queue: "${e.queue.event}" is not kind: queued`);
      } else if ('die' in e) {
        if (!lethalOk) err(where, '"die" outside a lethal choice: death needs a clear risk signal');
        checkText(where, e.die);
      } else if ('journal' in e) checkText(where, e.journal);
    }
  };

  for (const s of Object.values(scenes)) {
    const w = `${content.sources[s.id]}:${s.id}`;
    if (!content.config.chapters.includes(s.chapter)) err(w, `unknown chapter "${s.chapter}"`);
    checkCond(w, s.requires);
    checkText(w, s.text);
    checkText(w, s.title);
    Object.values(s.variants ?? {}).forEach((t) => checkText(w, t));
    for (const k of Object.keys(s.variants ?? {})) if (!opts.variantKeys.includes(k)) err(w, `variant for unknown key "${k}"`);
    checkEffects(w, s.on_enter, false);
    opts.checkScene?.(w, s, err, warn);
    if (s.kind === 'pool' && !s.pool) err(w, 'pool scene without a pool group');
    if (s.kind === 'ending') {
      if (!s.ending || !(s.ending in reg.endings)) err(w, `ending scene with unknown ending "${s.ending}"`);
      if (s.choices.length) err(w, 'ending scene has choices');
      continue;
    }
    if (!s.choices.length) { err(w, 'scene has no choices'); continue; }
    const ids = new Set<string>();
    for (const c of s.choices) {
      const cw = `${w}/${c.id}`;
      if (ids.has(c.id)) err(cw, 'duplicate choice id');
      ids.add(c.id);
      checkText(cw, c.text);
      checkText(cw, c.label);
      checkText(cw, c.warn);
      checkCond(cw, c.requires);
      checkCond(cw, c.visible_if);
      if (c.lethal && !c.warn) err(cw, 'lethal choice without a warn text');
      if (c.lethal && !c.check) err(cw, 'lethal choice without a check');
      checkEffects(cw, c.effects, false);
      if (c.check) {
        if (!content.config.attributes.includes(c.check.attr)) err(cw, `check: unknown attribute "${c.check.attr}"`);
        if (c.check.skill && !content.config.skills.includes(c.check.skill)) err(cw, `check: unknown skill "${c.check.skill}"`);
        c.check.mods.forEach((m) => checkCond(cw, m.if));
        if (!c.success) err(cw, 'check without a success outcome');
        if (!c.failure) err(cw, 'check without a failure outcome');
        if (c.text_after || c.next) warn(cw, 'text_after/next ignored when a check is present; put them in outcomes');
      }
      for (const { label, o } of outcomesOf(c)) {
        checkText(`${cw}[${label}]`, o.text);
        checkEffects(`${cw}[${label}]`, o.effects, c.lethal);
        const dies = flatEffects(o.effects).some((e) => opOf(e) === 'die');
        if (!dies || opts.deathContinues) checkNext(`${cw}[${label}]`, o.next ?? c.next, s);
      }
    }
    // Fail-forward rule: some choice must always be available.
    if (!s.choices.some((c) => c.requires === undefined && c.visible_if === undefined)) {
      err(w, 'no unconditional choice: the player could be left with nothing to pick');
    }
  }

  for (const st of opts.starts) if (!scenes[st]) err('starts', `unknown start scene "${st}"`);

  // Flags
  for (const f of flagsRead) if (!(f in reg.flags)) err('flags', `flag "${f}" is read but not declared`);
  for (const f of flagsRead) if (f in reg.flags && !flagsSet.has(f)) warn('flags', `flag "${f}" is read but never set`);
  for (const f of Object.keys(reg.flags)) if (!flagsRead.has(f) && flagsSet.has(f) && !reg.flags[f]!.later) warn('flags', `flag "${f}" is set but never read`);
  for (const f of Object.keys(reg.flags)) if (!flagsRead.has(f) && !flagsSet.has(f)) warn('flags', `flag "${f}" is declared but unused`);

  // People and World pages
  for (const [id, n] of Object.entries(reg.npcs)) n.codex.forEach((c, i) => { checkCond(`npcs/${id}.codex[${i}]`, c.if); checkText(`npcs/${id}.codex[${i}]`, c.text); });
  for (const [id, l] of Object.entries(reg.lore)) { checkCond(`lore/${id}`, l.if); checkText(`lore/${id}`, l.text); }

  // Reachability from the starts (spine links, switches, pools and queued events)
  const reached = new Set<string>();
  const stack = [...opts.starts, ...(opts.queuedByGame ?? [])].filter((st) => scenes[st]);
  while (stack.length) {
    const id = stack.pop()!;
    if (reached.has(id)) continue;
    reached.add(id);
    const s = scenes[id]!;
    const targets: SimpleNext[] = [];
    for (const c of s.choices) for (const { o } of outcomesOf(c)) targets.push(...simpleNexts(o.next ?? c.next));
    for (const e of flatEffects([...s.on_enter, ...s.choices.flatMap((c) => [...c.effects, ...outcomesOf(c).flatMap(({ o }) => o.effects)])])) {
      if (opOf(e) === 'queue') stack.push((e as { queue: { event: string } }).queue.event);
    }
    for (const t of targets) {
      if (typeof t === 'object') { stack.push(t.then); for (const p of Object.values(scenes)) if (p.kind === 'pool' && p.pool === t.pool) stack.push(p.id); }
      else if (t !== '@return' && scenes[t]) stack.push(t);
    }
  }
  for (const s of Object.values(scenes)) if (!reached.has(s.id) && s.chapter !== 'test') warn(`${content.sources[s.id]}:${s.id}`, 'not reachable from any start');
  for (const id of Object.keys(reg.endings)) {
    if (!Object.values(scenes).some((s) => s.kind === 'ending' && s.ending === id && reached.has(s.id))) warn('endings', `ending "${id}" has no reachable scene yet`);
  }
  return issues;
}
