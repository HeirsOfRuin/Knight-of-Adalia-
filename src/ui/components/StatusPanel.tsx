import type { ContentBundle } from '../../content/schema';
import type { GameState } from '../../engine/state';
import { effectiveAttr, effectiveSkill, npcLabel } from '../../engine/paths';
import { computePrejudice } from '../../engine/station';
import { ageOf, describeDate } from '../../engine/calendar';
import { formatCoin, capitalise, signed } from '../../engine/format';
import { ESTATE_LABELS, temperWord } from '../../engine/estate';

const feeling = (n: number) =>
  n <= -6 ? 'hates you' : n <= -3 ? 'dislikes you' : n < 0 ? 'cool' : n === 0 ? 'indifferent' : n <= 2 ? 'warm' : n <= 5 ? 'fond' : 'devoted';
const regard = (n: number) => (n <= -3 ? 'contempt' : n < 0 ? 'low regard' : n === 0 ? '' : n <= 3 ? 'some respect' : 'high respect');
const standing = (n: number) => (n <= -6 ? 'hated' : n <= -3 ? 'distrusted' : n < 0 ? 'poor' : n === 0 ? 'unknown' : n <= 3 ? 'fair' : n <= 6 ? 'good' : 'renowned');
const prejudiceWord = (n: number) => (n >= 5 ? 'heavy' : n >= 3 ? 'marked' : n >= 2 ? 'noticeable' : 'slight');

function Section({ title, children }: { title: string; children: preact.ComponentChildren }) {
  return (
    <details class="status-section" open>
      <summary>{title}</summary>
      {children}
    </details>
  );
}

export function StatusPanel({ content, state }: { content: ContentBundle; state: GameState }) {
  const reg = content.registry;
  const bg = content.backgrounds[state.background];
  const role = state.role ? bg?.roles?.[state.role]?.label : undefined;
  const npcs = Object.entries(state.npcs).filter(([, n]) => n.met);
  const factions = Object.entries(reg.factions).filter(([, f]) => f.kind === 'faction');
  const personal = Object.entries(reg.factions).filter(([, f]) => f.kind === 'personal');

  return (
    <div class="status">
      <h2>{state.name}</h2>
      <p class="muted">{bg?.label}{role ? `, ${role.toLowerCase()}` : ''}. Age {ageOf(state)}. {describeDate(state, content)}.</p>
      <dl class="kv">
        <dt>Station</dt><dd>{capitalise(state.station)}{state.track ? ` (${capitalise(state.track)})` : ''}</dd>
        {state.aliases.master && <><dt>Master</dt><dd>{npcLabel(content, state.aliases.master)}</dd></>}
        <dt>Health</dt><dd>{state.health}/10</dd>
        <dt>Coin</dt><dd>{formatCoin(state.res.coin ?? 0)}</dd>
        <dt>Renown</dt><dd>{state.res.renown ?? 0}</dd>
        <dt>His birth, to the gentry</dt><dd>{prejudiceWord(computePrejudice(state, content, 'nobles'))}</dd>
      </dl>

      {state.estate && (
        <Section title={`Your manor${state.flags.c2_granted_marsalin ? ': Marsalin' : state.flags.c2_granted_kerval ? ': Kerval' : state.flags.c2_granted_ormel ? ': Ormel' : ''}`}>
          <dl class="kv">
            <dt>{ESTATE_LABELS.people}</dt><dd>{state.estate.people ?? 0}</dd>
            <dt>{ESTATE_LABELS.food}</dt><dd>{state.estate.food ?? 0}</dd>
            <dt>{ESTATE_LABELS.temper}</dt><dd>{temperWord(state.estate.temper ?? 0)}</dd>
            {(['defence', 'church', 'salt', 'orchard'] as const).filter((f) => (state.estate![f] ?? 0) > 0).map((f) => [<dt key={`${f}t`}>{ESTATE_LABELS[f]}</dt>, <dd key={`${f}d`}>{state.estate![f]}/10</dd>])}
          </dl>
        </Section>
      )}

      <Section title="Body and mind">
        <dl class="kv">
          {content.config.attributes.map((a) => {
            const eff = effectiveAttr(state, content, a);
            const base = state.attributes[a] ?? 0;
            return [<dt key={`${a}t`}>{capitalise(a)}</dt>, <dd key={`${a}d`}>{eff}{eff !== base && <span class="mod"> ({signed(eff - base)})</span>}</dd>];
          })}
        </dl>
      </Section>

      <Section title="Skills">
        <dl class="kv">
          {content.config.skills.map((s) => {
            const eff = effectiveSkill(state, content, s);
            const base = state.skills[s] ?? 0;
            return [<dt key={`${s}t`} class={eff ? '' : 'muted'}>{capitalise(s)}</dt>, <dd key={`${s}d`} class={eff ? '' : 'muted'}>{eff}{eff !== base && <span class="mod"> ({signed(eff - base)})</span>}</dd>];
          })}
        </dl>
      </Section>

      {(state.injuries.length > 0 || state.traits.length > 0 || state.items.length > 0) && (
        <Section title="Marks and belongings">
          <ul class="plain">
            {state.injuries.map((i) => <li key={i.id} class="injury"><strong>{reg.injuries[i.id]?.label}</strong>: {reg.injuries[i.id]?.description}</li>)}
            {state.traits.map((t) => <li key={t}><strong>{reg.traits[t]?.label}</strong>: {reg.traits[t]?.description}</li>)}
            {state.items.map((i) => <li key={i}><strong>{reg.items[i]?.label}</strong>: {reg.items[i]?.description}</li>)}
          </ul>
        </Section>
      )}

      <Section title="Standing">
        <dl class="kv">
          {factions.map(([id, f]) => [<dt key={`${id}t`}>{f.label}</dt>, <dd key={`${id}d`}>{standing(state.rep[id] ?? 0)}</dd>])}
        </dl>
        <dl class="kv">
          {personal.map(([id, f]) => [<dt key={`${id}t`}>{f.label}</dt>, <dd key={`${id}d`}>{state.rep[id] ?? 0}</dd>])}
        </dl>
      </Section>

    </div>
  );
}
