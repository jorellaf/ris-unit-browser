export type UnitData = {
  release: string;
  unit_type: string;
  dictionary: string;
  category: CategoryEnum;
  unit_class: ClassEnum;
  soldier_data: {
    number_of_soldiers: number;
    extras: number;
    mass: number;
  };
  mount_effect: { mount: MountEffectMountsEnum; effect: number }[];
  attributes: (AttributesEnum | string)[];
  formation: {
    close_horizontal_spacing: number;
    close_vertical_spacing: number;
    loose_horizontal_spacing: number;
    loose_vertical_spacing: number;
    number_of_ranks: number;
    formations: FormationTypeEnum[];
  };
  health: { hp: number; hp_extra: number };
  primary_weapon: UnitWeapon;
  primary_weapon_attributes: WeaponAttributesEnum[];
  secondary_weapon: UnitWeapon;
  secondary_weapon_attributes: WeaponAttributesEnum[];
  primary_armour: UnitArmour;
  secondary_armour: UnitArmour;
  heat_modifier: string;
  ground_modifiers: {
    scrub_modifier: number;
    sand_modifier: number;
    forest_modifier: number;
    snow_modifier: number;
  };
  mental_modifiers: {
    morale: number;
    discipline: DisciplineEnum;
    training: TrainingEnum;
  };
  charge_distance: number;
  fire_delay: number;
  cost: {
    turns: number;
    recruit: number;
    upkeep: number;
    weapon_upgrade: number;
    armour_upgrade: number;
    custom_battle_cost: number;
  };
  recruitment_priority_offset?: string;
  ownership: string[];
  display_name: string;
  short_description?: string;
  long_description?: string;
  unit_card_data: {
    entries: {
      faction: string;
      local_file_path: string;
    }[];
  };
  unit_info_card_data: {
    entries: {
      faction: string;
      local_file_path: string;
    }[];
  };
};

export type UnitDisplayInfo = {
  unit_type: string;
  display_name: string;
  display_name_lowercase: string;
  category: CategoryEnum;
  unit_class: ClassEnum;
  ownership: string[];
};

export type CategoryEnum = 'infantry' | 'cavalry' | 'siege' | 'handler' | 'ship';
export const CategoryStrings: Record<CategoryEnum, string> = {
  infantry: 'Infantry',
  cavalry: 'Cavalry',
  siege: 'Siege Weapon',
  handler: 'Animal Handler',
  ship: 'Ship',
};

export type ClassEnum = 'light' | 'heavy' | 'spearmen' | 'missile' | 'skirmish';
export const ClassStrings: Record<ClassEnum, string> = {
  light: 'Light',
  heavy: 'Heavy',
  spearmen: 'Spearmen',
  missile: 'Missile',
  skirmish: 'Skirmisher',
};

export type AttributesEnum =
  | 'sea_faring'
  | 'hide_forest'
  | 'hide_improved_forest'
  | 'hide_long_grass'
  | 'hide_anywhere'
  | 'can_sap'
  | 'frighten_foot'
  | 'frighten_mounted'
  | 'can_run_amok'
  | 'general_unit'
  | 'cantabrian_circle'
  | 'no_custom'
  | 'command'
  | 'mercenary_unit'
  | 'hardy'
  | 'very_hardy'
  | 'warcry'
  | 'druid'
  | 'power_charge'
  | 'can_swim'
  | 'is_peasant'
  | 'can_horde'
  | 'legionary_name';
export const AttributesStrings: Record<AttributesEnum, string> = {
  sea_faring: 'Can embark',
  hide_forest: 'Can hide in forest',
  hide_improved_forest: 'Improved hiding in forest',
  hide_long_grass: 'Can hide in long grass',
  hide_anywhere: 'Can hide anywhere',
  can_sap: 'Can sap',
  frighten_foot: 'Frightens infantry',
  frighten_mounted: 'Frightens cavalry',
  can_run_amok: 'Can run amok',
  general_unit: 'General unit',
  cantabrian_circle: 'Can form Cantabrian circle',
  no_custom: 'Not available in custom battles',
  command: 'Morale bonus to nearby units',
  mercenary_unit: 'Mercenary unit',
  hardy: 'Hardy',
  very_hardy: 'Very hardy',
  warcry: 'Can warcry',
  druid: 'Can chant',
  power_charge: 'Powerful charge',
  can_swim: 'Can swim',
  is_peasant: 'Peasant unit',
  can_horde: 'Can horde',
  legionary_name: 'Has legionary name',
};

type WeaponTypeEnum = 'melee' | 'thrown' | 'missile' | 'siege_missile';
export const WeaponTypeStrings: Record<WeaponTypeEnum, string> = {
  melee: 'Melee',
  thrown: 'Thrown',
  missile: 'Missile',
  siege_missile: 'Siege missile',
};

type WeaponTechEnum = 'simple' | 'other' | 'blade' | 'archery' | 'siege';
export const WeaponTechStrings: Record<WeaponTechEnum, string> = {
  simple: 'Simple',
  other: 'Other',
  blade: 'Bladed',
  archery: 'Projectile',
  siege: 'Siege',
};

type MountEffectMountsEnum = 'horse' | 'elephant' | 'chariot' | 'camel';
export const MountEffectStrings: Record<MountEffectMountsEnum, string> = {
  horse: '\xa0vs.\xa0horses',
  elephant: '\xa0vs.\xa0elephants',
  chariot: '\xa0vs.\xa0chariots',
  camel: '\xa0vs.\xa0camels',
};

type FormationTypeEnum =
  | 'square'
  | 'wedge'
  | 'phalanx'
  | 'testudo'
  | 'horde'
  | 'schiltrom'
  | 'shield_wall';
export const FormationTypeStrings: Record<FormationTypeEnum, string> = {
  square: 'Square',
  wedge: 'Wedge',
  phalanx: 'Phalanx',
  testudo: 'Testudo',
  horde: 'Horde',
  schiltrom: 'Schiltrom',
  shield_wall: 'Shield wall',
};

type SpearBonusValues = 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
type SpearBonus = `spear_bonus_${SpearBonusValues}`;
export type WeaponAttributesEnum =
  | 'ap'
  | 'bp'
  | 'prec'
  | 'thrown'
  | 'launching'
  | 'area'
  | 'long_pike'
  | 'short_pike'
  | SpearBonus
  | 'light_spear'
  | 'spear';
const SpearBonusValuesArray: SpearBonusValues[] = [4, 5, 6, 7, 8, 9, 10, 11, 12];
const SpearBonusStrings = Object.fromEntries(
  SpearBonusValuesArray.map((x) => [`spear_bonus_${x}`, `+${x}\xa0spear\xa0bonus`]),
) as Record<SpearBonus, string>;
export const WeaponAttributesStrings: Record<WeaponAttributesEnum, string> = {
  ap: 'Armour-piercing',
  bp: 'Body-piercing',
  prec: 'Thrown before charging',
  thrown: 'Thrown',
  launching: 'May launch enemies',
  area: 'Area damage',
  long_pike: 'Long pike',
  short_pike: 'Short pike',
  ...SpearBonusStrings,
  light_spear: 'Light spear',
  spear: 'Spear',
};

const SpearBonusTitles = Object.fromEntries(
  SpearBonusValuesArray.map((x) => [
    `spear_bonus_${x}`,
    `+${x} bonus vs. mounted units`,
  ]),
) as Record<SpearBonus, string>;
export const WeaponAttributesTitles: Record<WeaponAttributesEnum, string | undefined> =
  {
    ap: undefined,
    bp: undefined,
    prec: undefined,
    thrown: undefined,
    launching: undefined,
    area: undefined,
    long_pike: undefined,
    short_pike: '+8 bonus vs. mounted units',
    ...SpearBonusTitles,
    light_spear: '+8 defence vs. cavalry, -4 defence vs. infantry',
    spear: '+8 attack vs. cavalry, -4 attack vs. infantry',
  };

type DisciplineEnum = 'low' | 'normal' | 'disciplined' | 'impetuous' | 'berserker';
export const DisciplineStrings: Record<DisciplineEnum, string> = {
  low: 'Low',
  normal: 'Normal',
  disciplined: 'Disciplined',
  impetuous: 'Impetuous (may charge without orders)',
  berserker: 'Berserker',
};

type TrainingEnum = 'untrained' | 'trained' | 'highly_trained';
export const TrainingStrings: Record<TrainingEnum, string> = {
  untrained: 'Untrained',
  trained: 'Trained',
  highly_trained: 'Highly trained',
};

export type UnitWeapon = {
  attack: number;
  charge: number;
  missile_type: string;
  missile_range: number;
  missile_ammo: number;
  weapon_type: WeaponTypeEnum;
  weapon_tech: WeaponTechEnum;
  min_delay: number;
  lethality: number;
};

type UnitArmour = {
  armour: number;
  defence_skill: number;
  shield?: number;
};

type UnitCardData = {
  local_file_path: string;
  remote_file_path?: string;
  remote_file_tag?: string;
  last_commit_id?: string;
};

export type UnitDataJson = {
  unit_type: string;
  dictionary?: string;
  category: string;
  unit_class: string;
  soldier_data: {
    number_of_soldiers: number;
    extras?: number;
    mass: number;
  };
  mount_effect: { mount: string; effect: number }[];
  attributes: string[];
  formation: {
    close_horizontal_spacing: number;
    close_vertical_spacing: number;
    loose_horizontal_spacing: number;
    loose_vertical_spacing: number;
    number_of_ranks: number;
    formations: FormationTypeEnum[];
  };
  health: {
    hp: number;
    hp_extra?: number;
  };
  primary_weapon: UnitWeapon;
  primary_weapon_attributes: string[];
  secondary_weapon: UnitWeapon;
  secondary_weapon_attributes: string[];
  primary_armour: UnitArmour;
  secondary_armour: UnitArmour;
  heat_modifier: number;
  ground_modifiers: {
    scrub_modifier: number;
    sand_modifier: number;
    forest_modifier: number;
    snow_modifier: number;
  };
  mental_modifiers: {
    morale: number;
    discipline: string;
    training: string;
  };
  charge_distance?: number;
  fire_delay?: number;
  cost: {
    turns: number;
    recruit: number;
    upkeep: number;
    weapon_upgrade: number;
    armour_upgrade: number;
    custom_battle_cost: number;
  };
  recruitment_priority_offset?: number;
  ownership: string[];
  display_name?: string;
  short_description?: string;
  long_description?: string;
  unit_card_data: { [key: string]: UnitCardData };
  unit_info_card_data: { [key: string]: UnitCardData };
};
