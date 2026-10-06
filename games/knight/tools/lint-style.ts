// CLI: npm run lint:style. Flags banned and watched phrases in content text.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentBundle } from '../src/content/schema';
import { loadContent, CONTENT_DIR, ContentError } from './content-loader';
import { flatEffects } from './validate-lib';

export interface StyleRule { pattern: RegExp; source: string; severity: 'error' | 'warning' }
export interface StyleHit { severity: 'error' | 'warning'; where: string; rule: string; excerpt: string }

export function parseStyleGuide(md: string): StyleRule[] {
  const rules: StyleRule[] = [];
  for (const [kind, severity] of [['banned', 'error'], ['watch', 'warning']] as const) {
    const block = new RegExp('```' + kind + '\\n([\\s\\S]*?)```').exec(md);
    if (!block) throw new Error(`style-guide.md: missing \`\`\`${kind} block`);
    for (const raw of block[1]!.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const re = line.startsWith('/') && line.endsWith('/') && line.length > 2
        ? new RegExp(line.slice(1, -1), 'gi')
        : new RegExp(`(?<![\\w'])${line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['\u2019]")}(?![\\w'])`, 'gi');
      rules.push({ pattern: re, source: line, severity });
    }
  }
  return rules;
}

/** All player-facing strings in the bundle, with a location. */
export function textsOf(content: ContentBundle): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const [id, r] of Object.entries(content.registry.romances)) for (const [m, t] of Object.entries(r.voice)) out.push({ where: `romances/${id}/voice.${m}`, text: t });
  for (const s of Object.values(content.scenes)) {
    const w = `${content.sources[s.id]}:${s.id}`;
    out.push({ where: w, text: s.text });
    if (s.title) out.push({ where: `${w}(title)`, text: s.title });
    for (const [b, t] of Object.entries(s.variants ?? {})) out.push({ where: `${w}(variant ${b})`, text: t });
    for (const c of s.choices) {
      const cw = `${w}/${c.id}`;
      out.push({ where: cw, text: c.text });
      if (c.warn) out.push({ where: `${cw}(warn)`, text: c.warn });
      if (c.text_after) out.push({ where: `${cw}(after)`, text: c.text_after });
      if (!c.check) for (const e of flatEffects(c.effects)) {
        if ('journal' in e) out.push({ where: `${cw}(journal)`, text: e.journal });
      }
      for (const k of ['success', 'partial', 'failure'] as const) {
        const o = c[k];
        if (o?.text) out.push({ where: `${cw}[${k}]`, text: o.text });
        for (const e of flatEffects([...(o?.effects ?? []), ...(k === 'success' ? c.effects : [])])) {
          if ('journal' in e) out.push({ where: `${cw}(journal)`, text: e.journal });
          if ('die' in e) out.push({ where: `${cw}(death)`, text: e.die });
        }
      }
    }
  }
  for (const b of Object.values(content.backgrounds)) {
    for (const k of ['summary', 'asset', 'liability'] as const) out.push({ where: `backgrounds/${b.id}.${k}`, text: b[k] });
  }
  return out;
}

export function lint(content: ContentBundle, rules: StyleRule[]): StyleHit[] {
  const hits: StyleHit[] = [];
  for (const { where, text } of textsOf(content)) {
    // strip template syntax so condition paths do not trigger rules
    const plain = text.replace(/\[(?:if|elif) [^\]]*\]|\[else\]|\[\/if\]|\{[a-z_.]+\}/g, ' ');
    for (const r of rules) {
      r.pattern.lastIndex = 0;
      for (const m of plain.matchAll(r.pattern)) {
        const i = m.index ?? 0;
        hits.push({ severity: r.severity, where, rule: r.source, excerpt: plain.slice(Math.max(0, i - 30), i + m[0].length + 30).replace(/\s+/g, ' ').trim() });
      }
    }
  }
  return hits;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const content = loadContent();
    const rules = parseStyleGuide(readFileSync(join(CONTENT_DIR, 'style-guide.md'), 'utf8'));
    const hits = lint(content, rules);
    for (const h of hits) console.log(`${h.severity === 'error' ? 'ERROR  ' : 'warning'} ${h.where}: "${h.rule}" in "...${h.excerpt}..."`);
    const errors = hits.filter((h) => h.severity === 'error').length;
    console.log(`style: ${rules.length} rules, ${errors} errors, ${hits.length - errors} warnings`);
    process.exit(errors ? 1 : 0);
  } catch (e) {
    if (e instanceof ContentError) { console.error(e.message); process.exit(1); }
    throw e;
  }
}
