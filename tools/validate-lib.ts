// Content validator. Static checks over the bundle; per-background structural
// checks run once the relevant chapter has content (otherwise PENDING).
import type { Choice, ContentBundle, Effect, Next, Outcome, Scene, SimpleNext } from '../src/content/schema';
import { validateCond, condPaths, compileCond as rawCompile, type Cond } from '../src/engine/conditions';
import type { CondInput } from '../src/content/schema';

/** Compile, or treat as unconditional if malformed (the error is reported separately). */
function compileCond(c: CondInput): Cond {
  try { return rawCompile(c); } catch { return { t: 'all', of: [] }; }
}
import { validateText } from '../src/engine/text';
import { checkPath } from '../src/engine/paths';

export type Severity = 'error' | 'warning';
export interface Issue { severity: Severity; where: string; message: string }
export type CheckStatus = 'PASS' | 'FAIL' | 'PENDING';
export interface StructuralCheck { background: string; name: string; status: CheckStatus; detail: string }
export interface ValidationReport { issues: Issue[]; structural: StructuralCheck[]; reachableBy: Record<string, Set<string>> }

const ADDABLE = ['attr', 'skill', 'rep', 'res', 'rel', 'favor', 'suit', 'counter', 'health', 'estate'];
const ASSIGNABLE = ['chapter', 'track', 'counter', 'flag', 'suit', 'rel'];

function outcomesOf(c: Choice): { label: string; o: Outcome }[] {
  if (!c.check) return [{ label: 'direct', o: { text: c.text_after, effects: [], next: c.next } }];
  return (['success', 'partial', 'failure'] as const).filter((k) => c[k]).map((k) => ({ label: k, o: c[k]! }));
}

/** Every simple next a (possibly switched) next can resolve to. */
function simpleNexts(n: Next | undefined, bg?: string, all: string[] = []): SimpleNext[] {
  if (n === undefined) return [];
  if (typeof n === 'object' && 'switch' in n) {
    const out: SimpleNext[] = [];
    for (const b of n.switch) {
      const cond = compileCond(b.if);
      if (bg && !backgroundsAllowed(cond, [bg]).length) continue;
      out.push(b.go);
      if (bg && certainlyBackground(cond, bg)) return out; // later branches and default unreachable
    }
    return [...out, n.default];
  }
  void all;
  return [n];
}

function nextTargets(n: SimpleNext): string[] {
  if (typeof n === 'object') return [n.then];
  return n === '@return' ? [] : [n];
}

/** Effects with conditional branches flattened. With a background, branches that background can never take are pruned. */
export function flatEffects(effects: Effect[], bg?: string): Effect[] {
  const out: Effect[] = [];
  for (const e of effects) {
    if ('if' in e) {
      const cond = compileCond(e.if);
      const thenOk = !bg || backgroundsAllowed(cond, [bg]).length > 0;
      const pureBgEq = cond.t === 'cmp' && cond.path === 'background' && cond.op === '==';
      const elseOk = !bg || !(pureBgEq && cond.value === bg);
      if (thenOk) out.push(...flatEffects(e.then, bg));
      if (elseOk) out.push(...flatEffects(e.else ?? [], bg));
    } else out.push(e);
  }
  return out;
}

/** True when the condition holds for this background whatever else is true (pure background tests). */
function certainlyBackground(cond: Cond, bg: string): boolean {
  switch (cond.t) {
    case 'cmp': return cond.path === 'background' && cond.op === '==' && cond.value === bg;
    case 'any': return cond.of.some((c) => certainlyBackground(c, bg));
    case 'all': return cond.of.length > 0 && cond.of.every((c) => certainlyBackground(c, bg));
    default: return false;
  }
}

/** Background restriction implied by a condition: the set of backgrounds that can satisfy it (approximate). */
function backgroundsAllowed(cond: Cond | undefined, all: string[]): string[] {
  if (!cond) return all;
  switch (cond.t) {
    case 'cmp':
      if (cond.path === 'background') {
        if (cond.op === '==') return all.filter((b) => b === cond.value);
        if (cond.op === '!=') return all.filter((b) => b !== cond.value);
      }
      return all;
    case 'truthy': return all;
    case 'all': return cond.of.reduce((acc, c) => backgroundsAllowed(c, acc), all);
    case 'any': return [...new Set(cond.of.flatMap((c) => backgroundsAllowed(c, all)))];
    case 'not': return all; // conservative
  }
}

export function validate(content: ContentBundle): ValidationReport {
  const issues: Issue[] = [];
  const err = (where: string, message: string) => issues.push({ severity: 'error', where, message });
  const warn = (where: string, message: string) => issues.push({ severity: 'warning', where, message });
  const reg = content.registry;
  const scenes = content.scenes;
  const flagsRead = new Set<string>();
  const flagsSet = new Set<string>();
  const queued = new Set<string>();
  const poolsUsed = new Set<string>();

  for (const bg of Object.values(content.backgrounds)) {
    bg.flags.forEach((f) => flagsSet.add(f));
    bg.random_flags.flat().forEach((f) => flagsSet.add(f));
    Object.values(bg.roles ?? {}).forEach((r) => r.flags.forEach((f) => flagsSet.add(f)));
  }

  const checkCond = (where: string, c: Parameters<typeof validateCond>[0] | undefined) => {
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
  const checkNext = (where: string, raw: Next | undefined, scene: Scene) => {
    if (raw === undefined) return err(where, 'no next scene');
    if (typeof raw === 'object' && 'switch' in raw) raw.switch.forEach((b) => checkCond(where, b.if));
    for (const n of simpleNexts(raw)) checkSimpleNext(where, n, scene);
  };
  const checkSimpleNext = (where: string, n: SimpleNext, scene: Scene) => {
    if (typeof n === 'object') {
      poolsUsed.add(n.pool);
      if (!Object.values(scenes).some((s) => s.kind === 'pool' && s.pool === n.pool)) err(where, `pool "${n.pool}" has no scenes`);
      if (!scenes[n.then]) err(where, `then: unknown scene "${n.then}"`);
    } else if (n === '@return') {
      if (scene.kind === 'spine') err(where, '"@return" used in a spine scene');
    } else if (!scenes[n]) err(where, `next: unknown scene "${n}"`);
  };
  const checkEffects = (where: string, effects: Effect[], lethalOk: boolean): void => {
    for (const e of effects) {
      if ('if' in e) {
        checkCond(where, e.if);
        checkEffects(where, e.then, lethalOk);
        checkEffects(where, e.else ?? [], lethalOk);
        continue;
      }
      if ('set' in e || 'clear' in e) {
        const raw = 'set' in e ? e.set : e.clear;
        if (!raw.startsWith('flag.')) { err(where, `set/clear takes flag.<id>, got "${raw}"`); continue; }
        const f = raw.slice(5);
        if (!(f in reg.flags)) err(where, `undeclared flag "${f}"`);
        if ('set' in e) flagsSet.add(f); else flagsRead.add(f);
      } else if ('add' in e) {
        for (const p of Object.keys(e.add)) {
          const ns = p.split('.')[0]!;
          if (!ADDABLE.includes(ns)) err(where, `add: cannot add to "${p}"`);
          else if (ns !== 'health') { const pe = checkPath(content, p); if (pe) err(where, `add: ${pe}`); }
        }
      } else if ('train' in e) {
        for (const k of Object.keys(e.train)) { if (k === 'ceiling' || k === 'quiet') continue; const pe = checkPath(content, `skill.${k}`); if (pe) err(where, `train: ${pe}`); }
      } else if ('found_estate' in e) {
        for (const f of Object.keys(e.found_estate)) { const pe = checkPath(content, `estate.${f}`); if (pe) err(where, `found_estate: ${pe}`); }
      } else if ('lose_share' in e) {
        for (const p of Object.keys(e.lose_share)) { const pe = p.startsWith('estate.') ? checkPath(content, p) : `lose_share only takes estate.<field>, got "${p}"`; if (pe) err(where, `lose_share: ${pe}`); }
      } else if ('assign' in e) {
        for (const [p, v] of Object.entries(e.assign)) {
          if (!ASSIGNABLE.includes(p.split('.')[0]!)) err(where, `assign: cannot assign "${p}"`);
          if (p === 'chapter' && !content.config.chapters.includes(String(v))) err(where, `assign: unknown chapter "${v}"`);
          if (p === 'track' && !content.config.tracks.includes(String(v))) err(where, `assign: unknown track "${v}"`);
          if (p.startsWith('flag.')) { if (v) flagsSet.add(p.slice(5)); if (!(p.slice(5) in reg.flags)) err(where, `undeclared flag "${p.slice(5)}"`); }
        }
      } else if ('trait' in e) { if (!(e.trait.slice(1) in reg.traits)) err(where, `unknown trait "${e.trait.slice(1)}"`); }
      else if ('item' in e) { if (!(e.item.slice(1) in reg.items)) err(where, `unknown item "${e.item.slice(1)}"`); }
      else if ('injury' in e) { if (!(e.injury in reg.injuries)) err(where, `unknown injury "${e.injury}"`); }
      else if ('heal' in e) { if (!(e.heal in reg.injuries)) err(where, `unknown injury "${e.heal}"`); }
      else if ('station' in e) {
        if (!content.config.stations.includes(e.station)) err(where, `unknown station "${e.station}"`);
        if (e.track && !content.config.tracks.includes(e.track)) err(where, `unknown track "${e.track}"`);
      } else if ('meet' in e || 'kill' in e) {
        const id = 'meet' in e ? e.meet : e.kill;
        if (id.startsWith('@') ? !content.config.aliases.includes(id.slice(1)) : !(id in reg.npcs)) err(where, `unknown npc or alias "${id}"`);
      } else if ('casualties' in e) {
        for (const id of e.casualties.spare) if (!(id in reg.npcs)) err(where, `casualties: unknown npc "${id}" in spare`);
      } else if ('join' in e || 'leave' in e) {
        const id = 'join' in e ? e.join : e.leave;
        if (id.startsWith('@') ? !content.config.aliases.includes(id.slice(1)) : !(id in reg.npcs)) err(where, `unknown npc or alias "${id}"`);
      } else if ('alias' in e) {
        for (const [k, v] of Object.entries(e.alias)) {
          if (!content.config.aliases.includes(k)) err(where, `unknown alias "${k}"`);
          if (!(v in reg.npcs)) err(where, `alias ${k}: unknown npc "${v}"`);
        }
      } else if ('queue' in e) {
        queued.add(e.queue.event);
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
    for (const b of Object.keys(s.variants ?? {})) if (!content.backgrounds[b]) err(w, `variant for unknown background "${b}"`);
    checkEffects(w, s.on_enter, false);
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
        const dies = flatEffects(o.effects).some((e) => 'die' in e);
        if (!dies) checkNext(`${cw}[${label}]`, o.next ?? c.next, s);
      }
    }
    // Fail-forward rule: some choice must always be available.
    if (!s.choices.some((c) => c.requires === undefined && c.visible_if === undefined)) {
      err(w, 'no unconditional choice: the player could be left with nothing to pick');
    }
  }

  // Flags
  for (const f of flagsRead) if (!(f in reg.flags)) err('flags', `flag "${f}" is read but not declared`);
  for (const f of flagsRead) if (f in reg.flags && !flagsSet.has(f) && !['noble_marriage', 'strong_patron'].includes(f)) warn('flags', `flag "${f}" is read but never set`);
  const chapterHasContent = (ch: string) => !content.config.in_progress.includes(ch) && Object.values(scenes).some((sc) => sc.chapter === ch);
  for (const f of Object.keys(reg.flags)) {
    if (flagsRead.has(f) || !flagsSet.has(f)) continue;
    const later = reg.flags[f]!.later;
    if (later && !content.config.chapters.includes(later)) err('flags', `flag "${f}": unknown chapter "${later}" in later`);
    else if (later && !chapterHasContent(later)) continue; // carried forward to a chapter not yet written
    else warn('flags', `flag "${f}" is set but never read${later ? ` (marked for ${later}, which now exists)` : ''}`);
  }
  for (const f of Object.keys(reg.flags)) if (!flagsRead.has(f) && !flagsSet.has(f) && !['noble_marriage', 'strong_patron'].includes(f)) warn('flags', `flag "${f}" is declared but unused`);

  // Codex: People and World pages
  for (const [id, n] of Object.entries(reg.npcs)) n.codex.forEach((c, i) => { checkCond(`npcs/${id}.codex[${i}]`, c.if); checkText(`npcs/${id}.codex[${i}]`, c.text); });
  for (const [id, l] of Object.entries(reg.lore)) { checkCond(`lore/${id}`, l.if); checkText(`lore/${id}`, l.text); }

  // Backgrounds
  for (const bg of Object.values(content.backgrounds)) {
    const w = `backgrounds/${bg.id}`;
    if (!scenes[bg.start_scene]) err(w, `unknown start scene "${bg.start_scene}"`);
    for (const k of Object.keys(bg.attributes)) if (!content.config.attributes.includes(k)) err(w, `unknown attribute "${k}"`);
    for (const k of Object.keys(bg.skills)) if (!content.config.skills.includes(k)) err(w, `unknown skill "${k}"`);
    for (const f of [...bg.flags, ...bg.random_flags.flat()]) if (!(f in reg.flags)) err(w, `undeclared flag "${f}"`);
    for (const t of bg.traits) if (!(t in reg.traits)) err(w, `unknown trait "${t}"`);
    for (const i of bg.items) if (!(i in reg.items)) err(w, `unknown item "${i}"`);
    for (const n of Object.keys(bg.relationships)) if (!(n in reg.npcs)) err(w, `unknown npc "${n}"`);
    for (const f of Object.keys(bg.rep)) if (!(f in reg.factions)) err(w, `unknown faction "${f}"`);
    for (const [k, v] of Object.entries(bg.aliases)) {
      if (!content.config.aliases.includes(k)) err(w, `unknown alias "${k}"`);
      if (!(v in reg.npcs)) err(w, `alias ${k}: unknown npc "${v}"`);
    }
  }

  // Reachability (static, from every background start; background-gated edges pruned)
  const allBgs = Object.keys(content.backgrounds);
  const reachableBy: Record<string, Set<string>> = {};
  for (const bg of allBgs) {
    const seen = new Set<string>();
    const stack = [content.backgrounds[bg]!.start_scene];
    const visitNext = (raw: Next | undefined) => {
      for (const n of simpleNexts(raw, bg)) {
        if (typeof n === 'object') for (const s of Object.values(scenes)) if (s.kind === 'pool' && s.pool === n.pool) stack.push(s.id);
        stack.push(...nextTargets(n));
      }
    };
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id) || !scenes[id]) continue;
      const s = scenes[id]!;
      if (s.requires && !backgroundsAllowed(compileCond(s.requires), [bg]).length) continue;
      seen.add(id);
      for (const c of s.choices) {
        const gate = [c.requires, c.visible_if].filter((x) => x !== undefined);
        if (gate.some((g) => !backgroundsAllowed(compileCond(g!), [bg]).length)) continue;
        for (const { o } of outcomesOf(c)) {
          visitNext(o.next ?? c.next);
          for (const e of flatEffects([...c.effects, ...o.effects], bg)) if ('queue' in e) stack.push(e.queue.event);
        }
      }
      for (const e of flatEffects(s.on_enter, bg)) if ('queue' in e) stack.push(e.queue.event);
    }
    reachableBy[bg] = seen;
  }
  const reachableAny = new Set(Object.values(reachableBy).flatMap((s) => [...s]));
  for (const s of Object.values(scenes)) {
    if (!reachableAny.has(s.id)) warn(`${content.sources[s.id]}:${s.id}`, 'unreachable from any background start');
  }
  for (const p of new Set(Object.values(scenes).filter((s) => s.kind === 'pool').map((s) => s.pool!))) {
    if (!poolsUsed.has(p)) warn(`pool:${p}`, 'pool group is never drawn from');
  }
  for (const s of Object.values(scenes)) if (s.kind === 'queued' && !queued.has(s.id)) warn(`${content.sources[s.id]}:${s.id}`, 'queued event is never queued');

  return { issues, structural: structuralChecks(content, reachableBy), reachableBy };
}

/** Distinct (scene, choice, outcome) edges that grant a station, per background. */
function stationRoutes(content: ContentBundle, reachable: Set<string>, bg: string, station: string, track?: string): string[] {
  const routes: string[] = [];
  for (const id of reachable) {
    const s = content.scenes[id]!;
    for (const c of s.choices) {
      for (const { label, o } of outcomesOf(c)) {
        if (flatEffects([...c.effects, ...o.effects], bg).some((e) => 'station' in e && e.station === station && (!track || e.track === track))) {
          routes.push(`${id}/${c.id}${label === 'direct' ? '' : `[${label}]`}`);
        }
      }
    }
  }
  return routes;
}

function structuralChecks(content: ContentBundle, reachableBy: Record<string, Set<string>>): StructuralCheck[] {
  const out: StructuralCheck[] = [];
  const hasChapter = (ch: string) => Object.values(content.scenes).some((s) => s.chapter === ch);
  for (const [bg, reach] of Object.entries(reachableBy)) {
    const add = (name: string, chapter: string, ok: boolean, detail: string) =>
      out.push({ background: bg, name, status: hasChapter(chapter) ? (ok ? 'PASS' : 'FAIL') : 'PENDING', detail: hasChapter(chapter) ? detail : `no ${chapter} content yet` });

    const squire = stationRoutes(content, reach, bg, 'squire');
    add('>= 2 routes to squire', 'ch1', squire.length >= 2, squire.join(', ') || 'none');
    const knight = stationRoutes(content, reach, bg, 'knight');
    add('>= 2 routes to knight', 'ch1', knight.length >= 2, knight.join(', ') || 'none');
    const lower = [...stationRoutes(content, reach, bg, 'retainer', 'household'), ...stationRoutes(content, reach, bg, 'retainer', 'levy')];
    const lowerUp = stationRoutes(content, reach, bg, 'squire', 'squire_track');
    add('>= 2 routes from the lower track to squire', 'ch1', lowerUp.length >= 2, lowerUp.join(', ') || 'none');
    add('lower track if the Patronage Gate fails', 'prologue', lower.length >= 1, lower.join(', ') || 'none');
    const gate = stationRoutes(content, reach, bg, 'retainer', 'squire_track');
    const gateChoices = new Set(gate.map((r) => r.replace(/\[.*\]$/, '')));
    add('>= 3 Patronage Gate routes', 'prologue', gateChoices.size >= 3, [...gateChoices].join(', ') || 'none');
    const maa = stationRoutes(content, reach, bg, 'retainer', 'man_at_arms');
    add('Ch2 entry as man-at-arms with patron', 'ch1', maa.length >= 1, maa.join(', ') || 'none');

    for (const [id, def] of Object.entries(content.registry.endings)) {
      const scenesFor = [...reach].filter((s) => content.scenes[s]!.ending === id);
      const viaDeath = id === 'death' && [...reach].some((s) => content.scenes[s]!.choices.some((c) => outcomesOf(c).some(({ o }) => flatEffects(o.effects).some((e) => 'die' in e))));
      add(`ending reachable: ${id}`, def.chapter, scenesFor.length > 0 || viaDeath, scenesFor.join(', ') || (viaDeath ? 'via lethal choice' : 'not linked'));
    }
  }
  return out;
}
