# Style Guide

Applies to all scene, choice, outcome and journal text. `npm run lint:style` enforces the lists at the bottom.

## Voice
- Plain, grounded, period-appropriate. Use concrete detail: food, weather, the weight of mail, money, hunger, injury, smell.
- Sentences short to medium. One idea per sentence where possible.
- Second person, past or present tense consistently within a scene ("You hold the bridle.").
- No inspirational speeches. Nobody explains the theme. Nobody says what a moment means.
- Outcomes are rarely clean. Something is usually lost even in success. Avoid symmetrical, balanced endings to scenes.
- Choice text is an action the character takes, in the imperative, under about 15 words. Do not hint at which choice is best.
- Show prejudice through behaviour (who sits where, who is served first, who is not answered), not narration about prejudice.
- Magic is rare, ambiguous and costly. The text never confirms that it worked. A cure might be the fever breaking on its own.

## House voice (from the author's own chapters, 2026-10-02)
The author's sample chapters ("Baldy and Ol' Red", Chapters 1-2) set the target. The first-pass game prose was too clipped and too quiet, and it leaned on narrator tics. Write closer to this:
- **Let people talk.** Most scenes should have at least two lines of spoken dialogue. Friends banter and needle each other: "Lucky strike! Sun got in my eyes." Villains are crude and plain-spoken. Lords are clipped and appraising. Mothers and alewives have tongues people fear.
- **Put the reader in his body.** Use heat in the cheeks, a heart in the throat, white knuckles, knees that will not stop shaking. A wound is noticed late, by the blood. The smell after a fight. Being sick over the side of the wagon. Fear comes as physical things, not as named feelings.
- **The village is a chorus.** When something happens, let the bystanders say it in short overheard lines: "Isn't that Godric's boy?" Gossip is how a commoner's world keeps score.
- **Warmth and humour.** Let him laugh at himself ("What a fool. More likely someone fell off his horse."). Friends look after each other. Small kindnesses land: a girl rubbing his back, a priest hurrying for help.
- **Kit and colour.** Describe people by what they wear and carry and how they move: the squire's yellow wool and good boots, the veteran's dented helm and the scar from temple to cheekbone, a knight who rides "like a stag runs".
- **Hint at the hidden.** Lords and elders carry history. Give them a look, a pause, a "Recognition, perhaps... or regret." Do not explain it.
- **Keep the second person and present tense** of the game, and the Continue pages. The voice above works in "you" as well as "he".

### Narrator tics to cut
These read as machine prose when they repeat. Each is allowed rarely; the lint counts them as warnings.
- "...which is worse."
- "It is not X. It is Y."
- "He says nothing." or "Nobody says anything." used as the beat that ends a paragraph.
- "for a long time".
- "You will think about this for years." Do not foreshadow the player's feelings.
- "That is all." and "That is its own kind of X."
- Chains of "and, and, and" clauses.
- "Then he...". Prefer the action itself.

## Period texture
- Time: canonical hours (Prime, Terce, Sext, None, Vespers, Compline), feast days (Lammas, Michaelmas, Martinmas, Candlemas, Lady Day), seasons. Not clock minutes or hours as units of precision.
- Distance: miles, leagues, a day's ride, bowshot.
- Money: pounds, shillings, pence, marks (13s 4d). A labourer earns about 2d a day. A knight's warhorse costs pounds, not shillings.
- Address: "sir" for knights, "my lord" for barons and above, "master" for stewards and guild masters, "goodman/goodwife" for respectable commoners.

## Naming
See canon.md for naming conventions per realm.

## Lint lists
Each line is one pattern. Plain lines match as case-insensitive whole words or phrases. Lines wrapped in `/.../` are regular expressions (case-insensitive). Lines starting with `#` are comments.

### Banned (lint error)
```banned
okay
ok
awesome
guys
teenager
weekend
deal with it
at the end of the day
game changer
level up
no problem
make sense
makes sense
stressed
stressful
you've got this
heart swelled
a testament to
tapestry
unbreakable bond
little did he know
little did you know
destiny awaits
journey of a lifetime
the stuff of legend
against all odds
/\bmindset\b/
/\bproactive\b/
/\bfeedback\b/
/\bteam ?work\b/
/\bpercent\b/
/\bminutes?\b/
/\b(a few|several|\d+|for a) seconds?\b/
```

### Watch (lint warning; allowed, but check each use)
```watch
suddenly
realize
realise
in that moment
somehow
very
destiny
fate
hero
epic
truly
incredibly
/\bfelt a sense of\b/
/\ba wave of\b/
which is worse
which is how you know
not unkindly
its own kind of
/\bfor a long time\b/
/\bIt is not [^.]*\. It is\b/
/\byou will (think about|remember) (this|it|that)\b/
```
