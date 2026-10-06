import { MapView } from './MapView';
// People and World pages: what he knows, growing as he learns it.
import type { ContentBundle } from '../../content/schema';
import type { GameState } from '../../game/state';
import { test } from '@engine/conditions';
import { renderText } from '@engine/text';
import { npcLabel, isFriend } from '@engine/paths';
import { capitalise } from '@engine/format';

const feeling = (n: number) =>
  n <= -6 ? 'hates you' : n <= -3 ? 'dislikes you' : n < 0 ? 'cool toward you' : n === 0 ? 'indifferent' : n <= 2 ? 'warm' : n <= 5 ? 'fond of you' : 'devoted to you';
const regard = (n: number) => (n <= -3 ? 'holds you in contempt' : n < 0 ? 'thinks little of you' : n === 0 ? '' : n <= 3 ? 'respects you' : 'thinks highly of you');

export function PeoplePanel({ content, state }: { content: ContentBundle; state: GameState }) {
  const reg = content.registry;
  const known = Object.entries(state.npcs).filter(([id, n]) => n.met && reg.npcs[id]);
  const group = (pred: (id: string) => boolean) => known.filter(([id]) => pred(id));
  const family = group((id) => reg.npcs[id]!.tags.includes('family'));
  const friends = group((id) => isFriend(state, content, id));
  const followers = group((id) => !!state.npcs[id]!.follower && !isFriend(state, content, id));
  const listed = [...family, ...friends, ...followers].map(([id]) => id);
  const rest = known.filter(([id]) => !listed.includes(id));

  const card = ([id, n]: [string, GameState['npcs'][string]]) => {
    const def = reg.npcs[id]!;
    const lines = def.codex.filter((c) => (c.if === undefined ? true : test(c.if, state, content))).map((c) => renderText(c.text, state, content));
    const suit = Object.entries(state.suits).find(([sid]) => reg.romances[sid]?.npc === id)?.[1];
    const r = regard(n.respect);
    return (
      <li key={id} class={`person ${n.alive ? '' : 'dead'}`}>
        <p class="person-name">
          <strong>{npcLabel(content, id)}</strong>
          {isFriend(state, content, id) && <span class="tag good">friend</span>}
          {n.follower && n.alive && <span class="tag">in your following</span>}
          {!n.alive && <span class="tag">dead</span>}
          {state.aliases.master === id && <span class="tag">your master</span>}
        </p>
        {n.alive && <p class="muted">{capitalise(feeling(n.affection))}{r ? `; ${r}` : ''}.{suit && suit.status !== 'lost' && suit.status !== 'hidden' ? ` You are ${suit.status === 'married' ? 'married' : suit.status === 'courted' ? 'courting her' : 'acquainted'}${suit.pledge !== 'none' ? `, ${suit.pledge} exchanged` : ''}.` : ''}</p>}
        {lines.length ? lines.map((l, i) => <p key={i}>{l}</p>) : def.notes ? <p>{def.notes}</p> : null}
      </li>
    );
  };

  return (
    <div class="codex">
      <h2>People</h2>
      {known.length === 0 && <p class="muted">You know no one of note yet. People appear here once you have met them, and their entries grow as you learn more.</p>}
      {family.length > 0 && <><h3>Family</h3><ul class="plain">{family.map(card)}</ul></>}
      {friends.length > 0 && <><h3>Friends</h3><ul class="plain">{friends.map(card)}</ul></>}
      {followers.length > 0 && <><h3>Your following</h3><ul class="plain">{followers.map(card)}</ul></>}
      {rest.length > 0 && <><h3>Others you know</h3><ul class="plain">{rest.map(card)}</ul></>}
      <p class="fineprint">Friends are people whose affection and respect for you have both grown. They can stand with you when things go wrong.</p>
    </div>
  );
}

const CATEGORY_LABEL: Record<string, string> = {
  places: 'Places', powers: 'The realms', people: 'Great folk', customs: 'Customs and law', money: 'Money and trade', war: 'War', faith: 'The Church',
};

export function WorldPanel({ content, state }: { content: ContentBundle; state: GameState }) {
  const entries = Object.entries(content.registry.lore).filter(([, l]) => l.if === undefined || test(l.if, state, content));
  const cats = [...new Set(entries.map(([, l]) => l.category))];
  return (
    <div class="codex">
      <h2>The World</h2>
      <MapView content={content} state={state} />
      <p class="muted">What you know of the world. New entries appear as you learn them.</p>
      {cats.map((cat) => (
        <section key={cat}>
          <h3>{CATEGORY_LABEL[cat] ?? cat}</h3>
          {entries.filter(([, l]) => l.category === cat).map(([id, l]) => (
            <details key={id} class="lore">
              <summary>{l.title}</summary>
              {renderText(l.text, state, content).split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
            </details>
          ))}
        </section>
      ))}
    </div>
  );
}
