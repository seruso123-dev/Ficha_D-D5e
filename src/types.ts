export type Ability = 'FOR' | 'DES' | 'CON' | 'INT' | 'SAB' | 'CAR';

export interface Skill {
  name: string;
  ability: Ability;
  proficient: boolean;
  expertise?: boolean;
  miscBonus?: number;
}

export interface Attack {
  id: string;
  name: string;
  bonus: string;
  damage: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: string;
  description: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  description: string;
  prepared: boolean;
}

export interface SpellSlots {
  total: number;
  used: number;
}

export interface CharacterData {
  name: string;
  classLevel: string;
  race: string;
  background: string;
  alignment: string;
  xp: string;
  
  abilities: Record<Ability, number>;
  proficiencies: string[]; // Saving throws
  
  hpMax: number;
  hpCurrent: number;
  hpTemp: number;
  ac: number;
  initiative: number;
  speed: string;
  
  hitDiceTotal: string;
  hitDiceRemaining: string;
  inspiration: boolean;
  
  deathSaves: {
    successes: number;
    failures: number;
  };
  
  skills: Skill[];
  attacks: Attack[];
  
  inventory: InventoryItem[];
  spells: Spell[];
  spellSlots: Record<number, SpellSlots>;
  spellcastingAbility: Ability;
  
  equipment: string;
  features: string;
  languages: string;
  
  personality: {
    traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
  };
}

export const INITIAL_DATA: CharacterData = {
  name: '',
  classLevel: '',
  race: '',
  background: '',
  alignment: '',
  xp: '',
  abilities: {
    FOR: 10,
    DES: 10,
    CON: 10,
    INT: 10,
    SAB: 10,
    CAR: 10
  },
  proficiencies: [],
  hpMax: 10,
  hpCurrent: 10,
  hpTemp: 0,
  ac: 10,
  initiative: 0,
  speed: '9m',
  hitDiceTotal: '1d8',
  hitDiceRemaining: '1',
  inspiration: false,
  deathSaves: {
    successes: 0,
    failures: 0
  },
  skills: [
    { name: 'Acrobacia', ability: 'DES', proficient: false, miscBonus: 0 },
    { name: 'Arcanismo', ability: 'INT', proficient: false, miscBonus: 0 },
    { name: 'Atletismo', ability: 'FOR', proficient: false, miscBonus: 0 },
    { name: 'Atuação', ability: 'CAR', proficient: false, miscBonus: 0 },
    { name: 'Blefar', ability: 'CAR', proficient: false, miscBonus: 0 },
    { name: 'Furtividade', ability: 'DES', proficient: false, miscBonus: 0 },
    { name: 'História', ability: 'INT', proficient: false, miscBonus: 0 },
    { name: 'Intimidação', ability: 'CAR', proficient: false, miscBonus: 0 },
    { name: 'Intuição', ability: 'SAB', proficient: false, miscBonus: 0 },
    { name: 'Investigação', ability: 'INT', proficient: false, miscBonus: 0 },
    { name: 'Lidar com Animais', ability: 'SAB', proficient: false, miscBonus: 0 },
    { name: 'Medicina', ability: 'SAB', proficient: false, miscBonus: 0 },
    { name: 'Natureza', ability: 'INT', proficient: false, miscBonus: 0 },
    { name: 'Percepção', ability: 'SAB', proficient: false, miscBonus: 0 },
    { name: 'Persuasão', ability: 'CAR', proficient: false, miscBonus: 0 },
    { name: 'Prestidigitação', ability: 'DES', proficient: false, miscBonus: 0 },
    { name: 'Religião', ability: 'INT', proficient: false, miscBonus: 0 },
    { name: 'Sobrevivência', ability: 'SAB', proficient: false, miscBonus: 0 }
  ],
  attacks: [],
  inventory: [],
  spells: [],
  spellSlots: {
    1: { total: 0, used: 0 },
    2: { total: 0, used: 0 },
    3: { total: 0, used: 0 },
    4: { total: 0, used: 0 },
    5: { total: 0, used: 0 },
    6: { total: 0, used: 0 },
    7: { total: 0, used: 0 },
    8: { total: 0, used: 0 },
    9: { total: 0, used: 0 },
  },
  spellcastingAbility: 'INT',
  equipment: '',
  features: '',
  languages: '',
  personality: {
    traits: '',
    ideals: '',
    bonds: '',
    flaws: ''
  }
};
