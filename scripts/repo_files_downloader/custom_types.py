"""Custom types of the script."""  # noqa: INP001

from typing import Literal, NotRequired, TypedDict


class UnitCardDataReturn(TypedDict):
    """Unit card multiprocessing pool return data typed dictionary."""

    unit_type: str
    card_type: str
    faction: str
    unit_card_data: LocalAndRemoteFileData


class UnitCardDownloadPoolData(TypedDict):
    """Unit card multiprocessing pool typed dictionary for unit card downloading."""

    unit_card_data: LocalAndRemoteFileData
    repo_id: int


class FactionSymbolDownloadPoolData(TypedDict):
    """Faction symbol multiprocessing pool typed dictionary for symbol downloading."""

    faction_symbol_data: LocalAndRemoteFileData
    repo_id: int


class UnitCardMultiprocessingPoolData(TypedDict):
    """Unit card multiprocessing pool typed dictionary."""

    unit: LocalAndRemoteFileData | None
    unit_type: str
    dictionary: str
    faction: str
    card_type: Literal["unit_cards", "unit_info_cards"]
    repo_id: int
    repo_tag: str
    last_in_unit: int | None


class UnitDisplayStrings(TypedDict):
    """Unit display strings typed dictionary."""

    display_name: str | None
    descr_short: str | None
    descr: str | None


class LocalAndRemoteFileData(TypedDict):
    """Unit card data typed dictionary."""

    local_file_path: str
    remote_file_path: NotRequired[str]
    remote_file_tag: NotRequired[str]
    last_commit_id: NotRequired[str]


class UnitData(TypedDict):
    """Unit data typed dictionary."""

    unit_type: str
    dictionary: str
    category: str
    unit_class: str
    soldiers: UnitSoldierData
    mount_effect: list[UnitMountEffectData]
    attributes: list[str]
    formation: UnitFormationData
    health: UnitHealthData
    primary_weapon: UnitWeaponData
    primary_weapon_attributes: list[str]
    secondary_weapon: UnitWeaponData
    secondary_weapon_attributes: list[str]
    primary_armour: UnitArmourData
    secondary_armour: UnitArmourData
    heat_modifier: int
    ground_modifiers: UnitGroundModifierData
    mental_modifiers: str
    charge_distance: int
    fire_delay: int
    cost: UnitCostData
    recruitment_priority_offset: NotRequired[int]
    ownership: list[str]
    display_name: NotRequired[str | None]
    short_description: NotRequired[str | None]
    long_description: NotRequired[str | None]
    unit_card_data: NotRequired[dict[str, LocalAndRemoteFileData]]
    unit_info_card_data: NotRequired[dict[str, LocalAndRemoteFileData]]


class UnitSoldierData(TypedDict):
    """Unit soldier data typed dictionary."""

    number_of_soldiers: int
    extras: int
    mass: float


class UnitMountEffectData(TypedDict):
    """Unit mount effect data typed dictionary."""

    mount: str
    effect: int


class UnitFormationData(TypedDict):
    """Unit formation data typed dictionary."""

    close_horizontal_spacing: float
    close_vertical_spacing: float
    loose_horizontal_spacing: float
    loose_vertical_spacing: float
    number_of_ranks: int
    formations: list[str]


class UnitHealthData(TypedDict):
    """Unit health data typed dictionary."""

    hp: int
    hp_extra: int


class UnitWeaponData(TypedDict):
    """Unit weapon data typed dictionary."""

    attack: int
    charge: int
    missile_type: str
    missile_range: int
    missile_ammo: int
    weapon_type: str
    weapon_tech: str
    min_delay: float
    lethality: float


class UnitArmourData(TypedDict):
    """Unit armour data typed dictionary."""

    armour: int
    defence_skill: int
    shield: NotRequired[int]


class UnitGroundModifierData(TypedDict):
    """Unit ground modifier data typed dictionary."""

    scrub_modifier: int
    sand_modifier: int
    forest_modifier: int
    snow_modifier: int


class UnitMentalData(TypedDict):
    """Unit morale data typed dictionary."""

    morale: int
    discipline: str
    training: str


class UnitCostData(TypedDict):
    """Unit cost data typed dictionary."""

    turns: int
    recruit: int
    upkeep: int
    weapon_upgrade: int
    armour_upgrade: int
    custom_battle_cost: int


class FactionSymbolMultiprocessPoolData(TypedDict):
    """Faction symbol multiprocessing pool typed dictionary."""

    faction: str
    repo_data: tuple[int, str]


class FactionData(TypedDict):
    """Faction data typed dictionary."""

    dictionary_string: str
    primary_colour: tuple[int, int, int]
    secondary_colour: tuple[int, int, int]
    display_name: NotRequired[str]
    faction_symbol: NotRequired[LocalAndRemoteFileData]


unit_card_types = Literal["unit_cards", "unit_info_cards"]

accepted_formations = [
    "square",
    "wedge",
    "phalanx",
    "testudo",
    "horde",
    "schiltrom",
    "shield_wall",
]

accepted_attributes = [
    "sea_faring",
    "hide_forest",
    "hide_improved_forest",
    "hide_long_grass",
    "hide_anywhere",
    "can_sap",
    "frighten_foot",
    "frighten_mounted",
    "can_run_amok",
    "general_unit",
    "cantabrian_circle",
    "no_custom",
    "command",
    "screeching_women",
    "mercenary_unit",
    "hardy",
    "very_hardy",
    "extremely_hardy",
    "inexhaustible",
    "warcry",
    "druid",
    "power_charge",
    "can_swim",
    "is_peasant",
    "can_horde",
    "legionary_name",
    "infinite_ammo",
    "non_scaling",
]

accepted_weapon_types = ["melee", "thrown", "missile", "siege_missile"]

accepted_weapon_techs = ["simple", "other", "blade", "archery", "siege"]

accepted_weapon_attributes = [
    "ap",
    "bp",
    "prec",
    "thrown",
    "launching",
    "area",
    "long_pike",
    "short_pike",
    *[f"spear_bonus_{x}" for x in range(4, 13)],
    "light_spear",
    "spear",
]

accepted_discipline_levels = ["low", "normal", "disciplined", "impetuous", "berserker"]

accepted_training_levels = ["untrained", "trained", "highly_trained"]
