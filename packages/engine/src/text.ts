// Passage templating: {var} substitution and [if cond]...[elif cond]...[else]...[/if].
// Variables a game renders itself ({wife.first_year}) go to its module (GameModule.textVar).
import { heroOf, pronoun, PRONOUN_VARS, isSelector, selected } from './character';
import type { CoreContent as ContentBundle } from './schema';
import type { CoreState as GameState } from './state';
import { gameOf } from './game';
import { evalCond, parseInline, validateCond, type Cond } from './conditions';
import { getValue, checkPath, deref } from './paths';
import { formatCoin, capitalise, numberWords, ordinalWords } from './format';
import { describeDate, ageOf, reignOf, reignTitle } from './calendar';

type Node =
  | { t: 'text'; s: string }
  | { t: 'var'; name: string }
  | { t: 'if'; branches: { cond: Cond | null; src: string; body: Node[] }[] };

export class TextError extends Error {}

const TOKEN = /\[if ([^\]]+)\]|\[elif ([^\]]+)\]|\[else\]|\[\/if\]|\{([A-Za-z_][A-Za-z0-9_.@]*)\}/g;
const cache = new Map<string, Node[]>();

export function parseText(src: string): Node[] {
  const hit = cache.get(src);
  if (hit) return hit;
  const root: Node[] = [];
  const stack: { node: Extract<Node, { t: 'if' }>; body: Node[] }[] = [];
  let out = root;
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    if (m.index! > last) out.push({ t: 'text', s: src.slice(last, m.index) });
    last = m.index! + m[0].length;
    if (m[1] !== undefined) {
      const node: Extract<Node, { t: 'if' }> = { t: 'if', branches: [{ cond: parseInline(m[1]), src: m[1], body: [] }] };
      out.push(node);
      stack.push({ node, body: out });
      out = node.branches[0]!.body;
    } else if (m[2] !== undefined || m[0] === '[else]') {
      const top = stack[stack.length - 1];
      if (!top) throw new TextError(`"${m[0]}" without [if]`);
      const br = { cond: m[2] !== undefined ? parseInline(m[2]) : null, src: m[2] ?? 'else', body: [] as Node[] };
      top.node.branches.push(br);
      out = br.body;
    } else if (m[0] === '[/if]') {
      const top = stack.pop();
      if (!top) throw new TextError('[/if] without [if]');
      out = top.body;
    } else {
      out.push({ t: 'var', name: m[3]! });
    }
  }
  if (stack.length) throw new TextError('unclosed [if]');
  if (last < src.length) out.push({ t: 'text', s: src.slice(last) });
  cache.set(src, root);
  return root;
}

const SPECIAL_VARS = ['name', 'date', 'coin', 'station', 'season', 'year', 'age', 'age_words', 'reign_year', 'regnal_year', 'king'];

/** A pronoun variable: {he} or {His} for the hero, {heir.he} or {heir.His} for a character a selector names. */
function splitPronoun(name: string): { sel?: string; raw: string; word: string } | undefined {
  const dot = name.lastIndexOf('.');
  const raw = dot >= 0 ? name.slice(dot + 1) : name;
  const word = raw.charAt(0).toLowerCase() + raw.slice(1);
  if (!PRONOUN_VARS.includes(word)) return undefined;
  return { sel: dot >= 0 ? name.slice(0, dot) : undefined, raw, word };
}

function pronounVar(name: string, state: GameState, content: ContentBundle): string | undefined {
  const sp = splitPronoun(name);
  if (!sp) return undefined;
  if (sp.sel !== undefined && !isSelector(content, sp.sel)) return undefined;
  const c = sp.sel === undefined ? heroOf(state) : selected(state, content, sp.sel);
  const p = pronoun(c?.sex ?? 'male', sp.word)!;
  return sp.raw === sp.word ? p : capitalise(p);
}

function varValue(name: string, state: GameState, content: ContentBundle): string {
  const reg = content.registry;
  const pv = pronounVar(name, state, content);
  if (pv !== undefined) return pv;
  switch (name) {
    case 'name': return heroOf(state).name;
    case 'date': return describeDate(state, content);
    case 'coin': return (state.res.coin ?? 0) > 0 ? formatCoin(state.res.coin!) : 'not a penny';
    case 'station': return capitalise(heroOf(state).station);
    case 'season': return String(getValue(state, content, 'calendar.season'));
    case 'year': return String(getValue(state, content, 'calendar.year'));
    case 'age': return String(getValue(state, content, 'age'));
    // for prose that names the date or his age: always agrees with the date shown above the scene
    case 'age_words': return numberWords(ageOf(state));
    case 'reign_year': return ordinalWords(reignTitle(state, content).year);
    // the year counted from Aldred II's crowning, whoever reigns now: for the old King's own years
    case 'regnal_year': return ordinalWords(Number(getValue(state, content, 'calendar.year')));
    case 'king': return reignOf(state, content).king;
  }
  const own = gameOf(content).textVar?.(name, state, content);
  if (own !== undefined) return own;
  const [ns, id, field] = deref(state, name).split('.');
  if (ns === 'npc' && id) {
    const def = reg.npcs[id];
    if (!def) return name;
    if (field === 'title') return def.title ? `${def.title} ${def.name}` : def.name;
    if (field === 'first') return def.name.split(' ')[0]!;
    return def.name;
  }
  const v = getValue(state, content, name);
  return v === undefined ? `{${name}}` : String(v);
}

function renderNodes(nodes: Node[], state: GameState, content: ContentBundle): string {
  let s = '';
  for (const n of nodes) {
    if (n.t === 'text') s += n.s;
    else if (n.t === 'var') s += varValue(n.name, state, content);
    else {
      const br = n.branches.find((b) => b.cond === null || evalCond(b.cond, state, content));
      if (br) s += renderNodes(br.body, state, content);
    }
  }
  return s;
}

/** Renders a passage and tidies blank lines left by empty conditionals. */
export function renderText(src: string, state: GameState, content: ContentBundle): string {
  return renderNodes(parseText(src), state, content)
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .replace(/^ +/gm, '')
    .trim();
}

/** Static validation; returns errors and the condition/var paths referenced. */
export function validateText(src: string, content: ContentBundle): { errors: string[]; paths: string[] } {
  const errors: string[] = [];
  const paths: string[] = [];
  let nodes: Node[];
  try {
    nodes = parseText(src);
  } catch (e) {
    return { errors: [(e as Error).message], paths };
  }
  const visit = (ns: Node[]) => {
    for (const n of ns) {
      if (n.t === 'var') {
        if (SPECIAL_VARS.includes(n.name)) continue;
        const sp = splitPronoun(n.name);
        if (sp && (sp.sel === undefined || isSelector(content, sp.sel))) continue;
        if (sp && sp.sel !== undefined) { errors.push(`unknown character in {${n.name}}`); continue; }
        if (/[A-Z]/.test(n.name)) { errors.push(`only pronouns are capitalised: {${n.name}}`); continue; }
        const own = gameOf(content).checkTextVar?.(n.name, content);
        if (own) { errors.push(...own); continue; }
        const [space, id, field] = n.name.split('.');
        if (space === 'npc') {
          if (id?.startsWith('@')) {
            if (!content.config.aliases.includes(id.slice(1))) errors.push(`unknown alias in {${n.name}}`);
          } else if (!id || !content.registry.npcs[id]) errors.push(`unknown npc in {${n.name}}`);
          else if (field && field !== 'title' && field !== 'first') errors.push(`unknown npc field in {${n.name}}`);
          continue;
        }
        const pe = checkPath(content, n.name);
        if (pe) errors.push(pe);
        paths.push(n.name);
      } else if (n.t === 'if') {
        for (const b of n.branches) {
          if (b.cond) {
            errors.push(...validateCond(b.src, content));
            const walk = (c: Cond): void => { if (c.t === 'cmp' || c.t === 'truthy') paths.push(c.path); else if (c.t === 'not') walk(c.of); else c.of.forEach(walk); };
            walk(b.cond);
          }
          visit(b.body);
        }
      }
    }
  };
  visit(nodes);
  return { errors, paths };
}
