// Interfaces for systems implemented in later phases. They are declared now so
// state, saves and content can be planned against them; nothing calls them yet.
// Implementation is deferred until the chapter that first needs each one, so
// tuning happens against real content (see DESIGN.md §11, item 3).

/** Retinue (Ch2): named followers and paid men. */
export interface Follower {
  id: string; // npc id for named followers
  role: 'man_at_arms' | 'archer' | 'serjeant' | 'groom' | 'clerk' | 'priest';
  skill: number;
  loyalty: number; // -10..10
  wage: number; // pence per season
  equipment: 'poor' | 'fair' | 'good';
}
export interface RetinueState { followers: Follower[]; unpaidSeasons: number }

/** Army and war (Ch2). Battles resolve in 3-6 decision rounds. */
export interface ForceState {
  numbers: number;
  quality: number; // 1..5
  morale: number; // 0..10
  supply: number; // seasons of food in hand
  commanderSkill: number;
}
export interface BattleState {
  terrain: 'open' | 'broken' | 'wooded' | 'river' | 'town' | 'walls';
  round: number;
  maxRounds: number;
  ours: ForceState;
  theirs: ForceState;
  log: string[];
}

/** Estate (Ch3). Seasonal cycle. */
export interface EstateState {
  name: string;
  population: number;
  food: number;
  income: number; // pence per year
  unrest: number; // 0..10
  buildings: string[];
  rulings: { case: string; ruling: string; at: number }[];
}

/** Politics (Ch4-5). */
export interface CourtFaction { id: string; leader: string; strength: number; stance: number }
export interface PoliticsState { factions: CourtFaction[]; claims: string[]; plots: string[] }
