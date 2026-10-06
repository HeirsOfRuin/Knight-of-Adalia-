// Condition grammar. Strings like "skill.diplomacy >= 4", "flag.met_aldric",
// "!flag.disgraced", "station >= squire", "background == reeve", combined with
// lists (all), { all }, { any }, { not }.
import type { CoreContent as ContentBundle, CondInput } from './schema';
import type { CoreState as GameState } from './state';
import { getValue, checkPath, ordinalFor, labelFor, deref, type Value } from './paths';
import { gameOf } from './game';
import { formatCoin, capitalise } from './format';

export type Op = '>=' | '<=' | '>' | '<' | '==' | '!=';
export type Cond =
  | { t: 'cmp'; path: string; op: Op; value: number | string | boolean; src: string }
  | { t: 'truthy'; path: string; neg: boolean; src: string }
  | { t: 'all'; of: Cond[] }
  | { t: 'any'; of: Cond[] }
  | { t: 'not'; of: Cond };

export class ConditionError extends Error {}

const EXPR = /^\s*([a-z_][a-z0-9_.@]*)\s*(>=|<=|==|!=|>|<)\s*(-?\d+|true|false|[a-z_][a-z0-9_]*)\s*$/;
const BARE = /^\s*(!?)\s*([a-z_][a-z0-9_.@]*)\s*$/;

const cache = new Map<string, Cond>();
const objCache = new WeakMap<object, Cond>();

export function parseExpr(src: string): Cond {
  const hit = cache.get(src);
  if (hit) return hit;
  let c: Cond;
  const m = EXPR.exec(src);
  if (m) {
    const raw = m[3]!;
    const value = /^-?\d+$/.test(raw) ? Number(raw) : raw === 'true' ? true : raw === 'false' ? false : raw;
    c = { t: 'cmp', path: m[1]!, op: m[2] as Op, value, src };
  } else {
    const b = BARE.exec(src);
    if (!b) throw new ConditionError(`cannot parse condition "${src}"`);
    c = { t: 'truthy', path: b[2]!, neg: b[1] === '!', src };
  }
  cache.set(src, c);
  return c;
}

/** Inline form for text passages: "a && b", "a || b" ("&&" binds tighter). No parentheses. */
export function parseInline(src: string): Cond {
  if (src.includes('||')) return { t: 'any', of: src.split('||').map(parseInline) };
  if (src.includes('&&')) return { t: 'all', of: src.split('&&').map((p) => parseExpr(p.trim())) };
  return parseExpr(src.trim());
}

const src_is_inline = (s: string) => s.includes('&&') || s.includes('||');

export function compileCond(input: CondInput): Cond {
  if (typeof input === 'string') return src_is_inline(input) ? parseInline(input) : parseExpr(input);
  const hit = objCache.get(input);
  if (hit) return hit;
  let c: Cond;
  if (Array.isArray(input)) c = { t: 'all', of: input.map(compileCond) };
  else if ('all' in input) c = { t: 'all', of: input.all.map(compileCond) };
  else if ('any' in input) c = { t: 'any', of: input.any.map(compileCond) };
  else c = { t: 'not', of: compileCond(input.not) };
  objCache.set(input, c);
  return c;
}

function compare(content: ContentBundle, path: string, actual: Value, op: Op, expected: number | string | boolean): boolean {
  let a: Value = actual;
  let e: number | string | boolean = expected;
  const ord = typeof expected === 'string' ? ordinalFor(content, path) : undefined;
  if (ord) {
    a = ord.indexOf(String(actual));
    e = ord.indexOf(expected as string);
  }
  switch (op) {
    case '==': return a === e;
    case '!=': return a !== e;
    case '>=': return (a as number) >= (e as number);
    case '<=': return (a as number) <= (e as number);
    case '>': return (a as number) > (e as number);
    case '<': return (a as number) < (e as number);
  }
}

export function evalCond(cond: Cond, state: GameState, content: ContentBundle): boolean {
  switch (cond.t) {
    case 'cmp': return compare(content, cond.path, getValue(state, content, cond.path), cond.op, cond.value);
    case 'truthy': {
      const v = !!getValue(state, content, cond.path);
      return cond.neg ? !v : v;
    }
    case 'all': return cond.of.every((c) => evalCond(c, state, content));
    case 'any': return cond.of.some((c) => evalCond(c, state, content));
    case 'not': return !evalCond(cond.of, state, content);
  }
}

export function test(input: CondInput | undefined, state: GameState, content: ContentBundle): boolean {
  return input === undefined ? true : evalCond(compileCond(input), state, content);
}

/** Static validation. Returns error strings. */
export function validateCond(input: CondInput, content: ContentBundle): string[] {
  let cond: Cond;
  try {
    cond = compileCond(input);
  } catch (e) {
    return [(e as Error).message];
  }
  const errs: string[] = [];
  const visit = (c: Cond) => {
    if (c.t === 'all' || c.t === 'any') c.of.forEach(visit);
    else if (c.t === 'not') visit(c.of);
    else {
      const pe = checkPath(content, c.path);
      if (pe) errs.push(pe);
      if (c.t === 'cmp' && typeof c.value === 'string') {
        const ord = ordinalFor(content, c.path);
        const known =
          ord ?? (c.path === 'track' ? [...content.config.tracks, 'none']
          : c.path.startsWith('alias.') ? ['none', ...Object.keys(content.registry.npcs)]
          : gameOf(content).namedValues?.(content, c.path, c.value));
        if (!known) errs.push(`"${c.src}": path does not take a named value`);
        else if (!known.includes(c.value)) errs.push(`"${c.src}": unknown value "${c.value}"`);
      }
    }
  };
  visit(cond);
  return errs;
}

/** Every leaf path referenced (for flag usage tracking). */
export function condPaths(input: CondInput): string[] {
  const out: string[] = [];
  const visit = (c: Cond) => {
    if (c.t === 'all' || c.t === 'any') c.of.forEach(visit);
    else if (c.t === 'not') visit(c.of);
    else out.push(c.path);
  };
  visit(compileCond(input));
  return out;
}

function leafLabel(c: Extract<Cond, { t: 'cmp' | 'truthy' }>, content: ContentBundle, state: GameState): string {
  const reg = content.registry;
  const cpath = deref(state, c.path);
  if (c.t === 'truthy') {
    const [ns, id] = cpath.split('.');
    let base: string;
    if (ns === 'flag') base = reg.flags[id!]?.description ?? id!;
    else if (ns === 'npc') base = `${reg.npcs[id!]?.name ?? id} ${cpath.endsWith('alive') ? 'alive' : 'known to you'}`;
    else base = labelFor(content, cpath);
    return c.neg ? `not: ${base}` : base;
  }
  const { op, value } = c;
  const path = cpath;
  const own = gameOf(content).comparisonLabel?.(content, path, op, value);
  if (own !== undefined) return own;
  if (path === 'station') return `Station ${op === '>=' ? '' : op + ' '}${capitalise(String(value))}`.replace('  ', ' ');
  if (path === 'res.coin' && typeof value === 'number') return `Coin ${formatCoin(value)}`;
  const name = labelFor(content, path);
  if (typeof value === 'number') {
    if (op === '>=') return `${name} ${value}`;
    if (op === '<=') return `${name} ${value} or less`;
    return `${name} ${op} ${value}`;
  }
  return `${name} ${op} ${capitalise(String(value))}`;
}

/** Requirement label describing what is unmet ("Diplomacy 4, Coin 2s"). */
export function unmetLabel(input: CondInput, state: GameState, content: ContentBundle): string {
  const describe = (c: Cond, onlyUnmet: boolean): string[] => {
    if (onlyUnmet && evalCond(c, state, content)) return [];
    switch (c.t) {
      case 'all': return c.of.flatMap((x) => describe(x, onlyUnmet));
      case 'any': return [c.of.map((x) => describe(x, false).join(' and ')).join(' or ')];
      case 'not': return [`not (${describe(c.of, false).join(', ')})`];
      default: return [leafLabel(c, content, state)];
    }
  };
  return describe(compileCond(input), true).join(', ');
}
