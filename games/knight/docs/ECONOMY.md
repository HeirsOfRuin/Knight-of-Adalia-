# The Economy of Adalia

> Paths here are relative to `games/knight/`.

Every sum in the game, in prose or in effects, is checked against this page. Money is counted in pence: 12d = 1s, 20s = £1 (240d). A mark is 13s 4d (160d), two-thirds of a pound. Prices follow canon.md's table, which follows mid-fourteenth-century England.

## 1. What people earn in a year

| Who | A year | Notes |
|---|---|---|
| Labourer, ploughman | £1 10s – £2 | 2d a day for the days there is work. "Eight pounds is four years of a ploughman." |
| Reeve's household (Ashby) | about £3 | His holding, his fees, and what passes through his hands. |
| Archer's household (Hollin) | about £2 | A smallholding and the lord's fees in war years. |
| Tirewoman (Ravell Hall) | about £1, and her keep | A servant's wage is small; the keep is the value. |
| Wool merchant (Wendham) | £20 – £40 | In a good year. A bad one can ruin him. |
| A knight's manor, to its lord | £20 – £40 | Rents, mill, court fines, the demesne. |
| A baron | £200 and up | |
| An earl | £1,000 and up | |

**"More money than your family sees in a year"** must be measured against the household the player came from. Write it by background: two pounds is a year to a reeve, a fortnight to a wool merchant.

## 2. What things cost

| Thing | Price |
|---|---|
| A hen, a pair of shoes, a good knife | 1d, 6d, 1s |
| A plough-ox | 12s |
| A riding horse | £1 – £3 |
| A destrier | £10 – £50 |
| A knight's harness | £10 – £20 new; £3 – £6 second-hand or from the dead |
| A stone tower, a stone church | £50 – £100 |
| A manor, bought | ten to fifteen years of its rent: £150 – £400 |
| An heiress's marriage, from the Crown | £60 – £300 |

## 3. Wages in war, and pay in peace

- **In war** the King pays by indenture: an archer 6d a day, a man-at-arms 12d, a knight 2s. The lord makes up the shortfall and buys the equipment.
- **In peace** a lord's own men (company and garrison) draw a fee and their keep. The game charges **6s a man a year** at Michaelmas; their keep comes from the manor's own grain. A garrison of sixty costs about what a manor yields, which is why lords pay off their companies after a war.

## 4. Ransoms

- A plain knight: 20 – 100 marks. A banneret or lord: hundreds. A great lord or a king's kin: thousands.
- **The Crown takes prisoners of rank.** It buys them from their captors for a reward and collects the ransom itself. The captor of a great prisoner gets **£40 – £60**, a fortune to a squire and a footnote to the King. Lesser prisoners stay with their captor, less his lord's third.

## 5. The game's formulas

| Formula | Value | Where |
|---|---|---|
| Manor rent, per person, at Michaelmas | 20d (so 250 people ≈ £21) | src/game/estate.ts |
| Salt works, per point | 200d | estate.ts |
| Orchards and fields, per point | 150d | estate.ts |
| Other holdings | as the registry's income, paid at Michaelmas | content effects (`hold`) |
| Pay for company and garrison | 72d (6s) a man a year | estate.ts `PAY_PER_MAN` |

## 6. Price bands for the player's purse

| Chapter | What he has | What things cost him |
|---|---|---|
| Prologue, Ch1 | pennies and shillings | knives, boots, dice, a horse |
| Ch2 | a few pounds, a lucky ransom | a dead man's harness, a few bowmen, a horse |
| Ch3 | a manor's rents (£15 – £25 a year) | seed, mills, salt pans, a watch, a tower, a wedding |
| Ch4 | rents from several holdings | a company, harness and a destrier, churches and bridges, gifts to great men |
| Ch5 | a great lord's income | armies, treaties, kingdoms |
