// House of Adalia's side panels, after Knight of Adalia's (games/knight/src/ui/components): the Keeper's status, the
// house and its chronicle, the people of the realm, what the house knows of the world, and the journal.
import type { ComponentChildren } from 'preact';
import { heroOf, ageOfCharacter } from '@engine/character';
import { effectiveAttr, effectiveSkill } from '@engine/paths';
import { test } from '@engine/conditions';
import { renderText } from '@engine/text';
import { formatCoin, capitalise, signed } from '@engine/format';
import type { Character } from '@engine/state';
import type { ContentBundle } from '../content/schema';
import { describeDate, type HouseState } from '../game/index';
import { heirOf, select } from '../game/family';
import { FOUNDER_ID, HOUSE_ID } from '../game/state';
import { GRACE, sovereignStyle } from '../game/module';

function Section({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <details class="status-section" open>
      <summary>{title}</summary>
      {children}
    </details>
  );
}

const Paras = ({ text }: { text: string }) => <>{text.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</>;

// ---- words for numbers (Knight of Adalia's scales) -------------------------------------------------------------------
const standing = (n: number) => (n <= -6 ? 'hated' : n <= -3 ? 'distrusted' : n < 0 ? 'poor' : n === 0 ? 'unknown' : n <= 3 ? 'fair' : n <= 6 ? 'good' : 'renowned');
const feeling = (n: number) =>
  n <= -6 ? 'hates you' : n <= -3 ? 'dislikes you' : n < 0 ? 'cool toward you' : n === 0 ? 'indifferent' : n <= 2 ? 'warm' : n <= 5 ? 'fond of you' : 'devoted to you';
const regard = (n: number) => (n <= -3 ? 'holds you in contempt' : n < 0 ? 'thinks little of you' : n === 0 ? '' : n <= 3 ? 'respects you' : 'thinks highly of you');
const bondWord = (n: number) => (n >= 4 ? 'devoted' : n >= 2 ? 'close' : n >= 0 ? 'dutiful' : n >= -2 ? 'distant' : 'estranged');

/** The story tracks (config counter_labels), in words: the same words their results use. */
function tracks(s: HouseState, c: ContentBundle): [string, string][] {
  const v = (k: string) => s.counters[k];
  const out: [string, string][] = [];
  const first = (sel: string) => renderText(`{${sel}.first}`, s, c);
  if (v('household') !== undefined) { const n = v('household')!; out.push(['The household', n >= 4 ? 'devoted' : n >= 2 ? 'loyal' : n >= 0 ? 'steady' : n >= -2 ? 'grumbling' : 'disaffected']); }
  if (v('shadow') !== undefined) { const n = v('shadow')!; out.push([`${first('founder')}'s shadow`, n >= 4 ? 'long: everyone measures the house against him' : n >= 2 ? 'lengthening' : n >= 0 ? 'ordinary' : 'short: the house is making its own name']); }
  if (v('penhoet') !== undefined) { const n = v('penhoet')!; out.push(['Penhoët', n >= 4 ? 'friendly' : n >= 2 ? 'satisfied, for now' : n >= 0 ? 'watchful' : n >= -2 ? 'aggrieved' : 'hostile']); }
  if (v('favour') !== undefined) { const n = v('favour')!; out.push([s.realm.sovereign === 'self' ? 'Standing in the realm' : "The sovereign's favour", n >= 4 ? 'high' : n >= 2 ? 'good' : n >= 0 ? 'ordinary' : 'poor']); }
  if (v('second') !== undefined && select(s, c, 'sibling')) { const n = v('second')!; out.push([first('sibling'), n >= 3 ? 'close' : n >= 1 ? 'friendly' : n >= -1 ? 'distant' : 'estranged']); }
  return out;
}

// ---- Status -------------------------------------------------------------------------------------------------------
export function StatusPanel({ content, state }: { content: ContentBundle; state: HouseState }) {
  const reg = content.registry;
  const hero = heroOf(state);
  const age = ageOfCharacter(state, hero);
  const regent = state.family.regent ? state.characters[state.family.regent] : undefined;
  const factions = Object.entries(reg.factions).filter(([, f]) => f.kind === 'faction');
  const t = tracks(state, content);
  const res = state.res;
  return (
    <div class="status">
      <h2>{hero.name}</h2>
      <p class="muted">Age {age}. {describeDate(state, content)}.</p>
      <dl class="kv">
        <dt>Station</dt><dd>{capitalise(hero.station.replace('_', ' '))}</dd>
        <dt>The West</dt><dd>{reg.frames[state.realm.west]?.label}, under {sovereignStyle(state, content)}</dd>
        {regent && <><dt>Regent</dt><dd>{regent.name}, until you are {reg.life.majority}</dd></>}
        <dt>Health</dt><dd>{hero.health}/10</dd>
      </dl>

      <Section title="Treasury and men">
        <dl class="kv">
          <dt>Coin</dt><dd>{formatCoin(res.coin ?? 0)}</dd>
          <dt>Renown</dt><dd>{res.renown ?? 0}</dd>
          <dt>Men under your banner</dt><dd>{res.men ?? 0}</dd>
          {(res.garrison ?? 0) > 0 && <><dt>Holding your walls</dt><dd>{res.garrison}</dd></>}
          {(res.levy ?? 0) > 0 && <><dt>The levy</dt><dd>{res.levy}</dd></>}
        </dl>
      </Section>

      {t.length > 0 && (
        <Section title="How things stand">
          <dl class="kv">{t.map(([k, w]) => [<dt key={`${k}t`}>{k}</dt>, <dd key={`${k}d`}>{w}</dd>])}</dl>
        </Section>
      )}

      <Section title="Standing">
        <dl class="kv">{factions.map(([id, f]) => [<dt key={`${id}t`}>{f.label}</dt>, <dd key={`${id}d`}>{standing(state.rep[id] ?? 0)}</dd>])}</dl>
      </Section>

      <Section title="Body and mind">
        <dl class="kv">
          {content.config.attributes.map((a) => {
            const eff = effectiveAttr(state, content, a);
            const base = hero.attributes[a] ?? 0;
            return [<dt key={`${a}t`}>{capitalise(a)}</dt>, <dd key={`${a}d`}>{eff}{eff !== base && <span class="mod"> ({signed(eff - base)})</span>}</dd>];
          })}
        </dl>
      </Section>

      <Section title="Skills">
        <dl class="kv">
          {content.config.skills.map((k) => {
            const eff = effectiveSkill(state, content, k);
            return [<dt key={`${k}t`} class={eff ? '' : 'muted'}>{capitalise(k)}</dt>, <dd key={`${k}d`} class={eff ? '' : 'muted'}>{eff}</dd>];
          })}
        </dl>
      </Section>

      {(hero.injuries.length > 0 || hero.traits.length > 0 || hero.items.length > 0) && (
        <Section title="Marks and belongings">
          <ul class="plain">
            {hero.injuries.map((i) => <li key={i.id} class="injury"><strong>{reg.injuries[i.id]?.label}</strong>: {reg.injuries[i.id]?.description}</li>)}
            {hero.traits.map((x) => <li key={x}><strong>{reg.traits[x]?.label}</strong>: {reg.traits[x]?.description}</li>)}
            {hero.items.map((x) => <li key={x}><strong>{reg.items[x]?.label}</strong>: {reg.items[x]?.description}</li>)}
          </ul>
        </Section>
      )}
    </div>
  );
}

// ---- The house ----------------------------------------------------------------------------------------------------
const LAW_WORD: Record<string, string> = {
  male_preference: 'Sons before daughters, then daughters and their children',
  male_line: 'Only men, and only through men',
  partible: 'The eldest son heads the house; the younger sons share the lands',
  eldest: 'The eldest child, son or daughter',
};

function relationOf(s: HouseState, id: string): string {
  const c = s.characters[id]!;
  const name = (x?: string) => (x ? s.characters[x]?.name.split(' ')[0] : undefined);
  const parents = [name(c.father), name(c.mother)].filter(Boolean);
  if (id === FOUNDER_ID) return 'the founder of the house';
  if (c.house !== HOUSE_ID && c.spouse) return `${c.sex === 'female' ? 'wife' : 'husband'} of ${name(c.spouse)}`;
  if (parents.length) return `${c.sex === 'female' ? 'daughter' : 'son'} of ${parents.join(' and ')}`;
  return c.house === HOUSE_ID ? 'of the house' : '';
}

export function HousePanel({ content, state }: { content: ContentBundle; state: HouseState }) {
  const heir = heirOf(state, state.family.law, state.hero);
  const members = Object.entries(state.characters).filter(([, c]) => c.house === HOUSE_ID || (c.spouse && state.characters[c.spouse]?.house === HOUSE_ID));
  const living = members.filter(([, c]) => c.alive).sort(([, a], [, b]) => a.born - b.born);
  const dead = members.filter(([, c]) => !c.alive);
  const person = ([id, c]: [string, Character]) => {
    const tags = [
      id === state.hero ? 'head of the house' : '',
      id === heir ? 'heir' : '',
      id === state.family.regent ? 'regent' : '',
      c.retired ? 'stepped down' : '',
    ].filter(Boolean);
    const words = [relationOf(state, id), c.temperament, c.bond !== undefined && id !== state.hero && c.house === HOUSE_ID ? bondWord(c.bond) : ''].filter(Boolean);
    return (
      <li key={id} class={`person ${c.alive ? '' : 'dead'}`}>
        <p class="person-name"><strong>{c.name}</strong>{c.alive && <span class="muted"> {ageOfCharacter(state, c)}</span>}{tags.map((x) => <span key={x} class="tag">{x}</span>)}</p>
        <p class="muted">{capitalise(words.join(', '))}.</p>
      </li>
    );
  };
  return (
    <div class="codex">
      <h2>The House</h2>
      <dl class="kv">
        <dt>Law of succession</dt><dd>{LAW_WORD[state.family.law] ?? state.family.law}</dd>
        <dt>Generation</dt><dd>{state.family.generation}</dd>
      </dl>
      <h3>The living</h3>
      <ul class="plain">{living.map(person)}</ul>
      {dead.length > 0 && <><h3>The dead</h3><ul class="plain">{dead.map(person)}</ul></>}
      {state.chronicle.length > 0 && (
        <>
          <h3>The chronicle</h3>
          {state.chronicle.map((e, i) => <p key={i}><strong>{e.name}</strong>, head of the house from {e.from + GRACE} to {e.to + GRACE}. {e.lines.join(' ')}</p>)}
        </>
      )}
    </div>
  );
}

// ---- People -------------------------------------------------------------------------------------------------------
export function PeoplePanel({ content, state }: { content: ContentBundle; state: HouseState }) {
  const reg = content.registry;
  // House of Adalia's great folk are known from the start; an entry with no condition shows at once (npcs.yaml)
  const known = Object.entries(reg.npcs)
    .map(([id, def]) => [id, def, def.codex.filter((x) => x.if === undefined || test(x.if, state, content)).map((x) => renderText(x.text, state, content))] as const)
    .filter(([, , lines]) => lines.length > 0);
  return (
    <div class="codex">
      <h2>People</h2>
      <ul class="plain">
        {known.map(([id, def, lines]) => {
          const n = state.npcs[id];
          const r = n ? regard(n.respect) : '';
          return (
            <li key={id} class={`person ${n && !n.alive ? 'dead' : ''}`}>
              <p class="person-name"><strong>{def.title ? `${def.title} ` : ''}{def.name}</strong>{n && !n.alive && <span class="tag">dead</span>}</p>
              {n && n.alive && (n.affection !== 0 || n.respect !== 0) && <p class="muted">{capitalise(feeling(n.affection))}{r ? `; ${r}` : ''}.</p>}
              {lines.map((l, i) => <p key={i}>{l}</p>)}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- The world ----------------------------------------------------------------------------------------------------
const CATEGORY_LABEL: Record<string, string> = {
  powers: 'The realms', people: 'Great houses', places: 'Places', customs: 'Customs and law', money: 'Money and trade', war: 'War', faith: 'The Church',
};

export function WorldPanel({ content, state }: { content: ContentBundle; state: HouseState }) {
  const entries = Object.entries(content.registry.lore).filter(([, l]) => l.if === undefined || test(l.if, state, content));
  const cats = Object.keys(CATEGORY_LABEL).filter((k) => entries.some(([, l]) => l.category === k));
  return (
    <div class="codex">
      <h2>The World</h2>
      <p class="muted">What the house knows of the world. New entries appear as it learns them.</p>
      {cats.map((cat) => (
        <section key={cat}>
          <h3>{CATEGORY_LABEL[cat]}</h3>
          {entries.filter(([, l]) => l.category === cat).map(([id, l]) => (
            <details key={id} class="lore">
              <summary>{l.title}</summary>
              <Paras text={renderText(l.text, state, content)} />
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}

// ---- Journal ------------------------------------------------------------------------------------------------------
export function Journal({ content, state }: { content: ContentBundle; state: HouseState }) {
  const entries = [...state.journal].reverse();
  const when = (t: number) => describeDate({ ...state, time: t }, content);
  return (
    <div class="journal">
      <h2>Journal</h2>
      {entries.length === 0 && <p class="muted">Nothing recorded yet. Each choice, and what came of it, is written here.</p>}
      <ol class="journal-list">
        {entries.map((e, i) => (
          <li key={i}>
            <p class="date">{when(e.at)}{e.sceneTitle ? ` · ${e.sceneTitle}` : ''}</p>
            <p><strong>{e.choice}</strong></p>
            {e.outcome && <p>{e.outcome}</p>}
            {e.changes.length > 0 && <ul class="changes">{e.changes.map((c, j) => <li key={j}>{c}</li>)}</ul>}
          </li>
        ))}
      </ol>
    </div>
  );
}
