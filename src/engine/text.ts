// Passage templating: {var} substitution and [if cond]...[elif cond]...[else]...[/if].
import { payDue } from './estate';
import { WIFE_MOMENTS, type ContentBundle } from '../content/schema';
import type { GameState } from './state';
import { evalCond, parseInline, validateCond, type Cond } from './conditions';
import { getValue, checkPath, deref } from './paths';
import { formatCoin, capitalise, numberWords, ordinalWords } from './format';
import { describeDate, ageOf, reignOf } from './calendar';

type Node =
  | { t: 'text'; s: string }
  | { t: 'var'; name: string }
  | { t: 'if'; branches: { cond: Cond | null; src: string; body: Node[] }[] };

export class TextError extends Error {}

const TOKEN = /\[if ([^\]]+)\]|\[elif ([^\]]+)\]|\[else\]|\[\/if\]|\{([a-z_][a-z0-9_.@]*)\}/g;
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

const SPECIAL_VARS = ['name', 'date', 'coin', 'station', 'background', 'origin', 'season', 'year', 'age', 'age_words', 'reign_year', 'regnal_year', 'king', 'pay_due'];

function varValue(name: string, state: GameState, content: ContentBundle): string {
  const reg = content.registry;
  switch (name) {
    case 'name': return state.name;
    case 'date': return describeDate(state, content);
    case 'pay_due': return formatCoin(payDue(state));
    case 'coin': return (state.res.coin ?? 0) > 0 ? formatCoin(state.res.coin!) : 'not a penny';
    case 'station': return capitalise(state.station);
    case 'background': return content.backgrounds[state.background]?.label ?? state.background;
    case 'origin': return (content.backgrounds[state.background]?.label ?? state.background).toLowerCase();
    case 'season': return String(getValue(state, content, 'calendar.season'));
    case 'year': return String(getValue(state, content, 'calendar.year'));
    case 'age': return String(getValue(state, content, 'age'));
    // for prose that names the date or his age: always agrees with the date shown above the scene
    case 'age_words': return numberWords(ageOf(state));
    case 'reign_year': return ordinalWords(reignOf(state, content).year);
    // the year counted from Aldred II's crowning, whoever reigns now: for the old King's own years
    case 'regnal_year': return ordinalWords(Number(getValue(state, content, 'calendar.year')));
    case 'king': return reignOf(state, content).king;
  }
  // the current wife's own line for a moment of the marriage (registry romances[].voice)
  if (name.startsWith('wife.')) {
    const line = reg.romances[state.aliases.spouse ?? '']?.voice[name.slice(5)];
    return line ? renderText(line, state, content) : '';
  }
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
        if (n.name.startsWith('wife.')) {
          if (!(n.name.slice(5) in WIFE_MOMENTS)) errors.push(`unknown wife moment in {${n.name}}`);
          continue;
        }
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
