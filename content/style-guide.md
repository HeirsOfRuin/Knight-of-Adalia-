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
```
