import { graphql, HeadFC, Link, PageProps } from 'gatsby';
import { GatsbyImage, IGatsbyImageData } from 'gatsby-plugin-image';
import React, { useEffect, useMemo, useState } from 'react';
import { PageHead } from '../components/pageHead';
import { useReleaseSlug } from '../hooks/useReleaseSlug';
import {
  AttributesEnum,
  AttributesStrings,
  CategoryStrings,
  ClassStrings,
  DisciplineStrings,
  FormationTypeStrings,
  MountEffectStrings,
  TrainingStrings,
  UnitData,
  UnitWeapon,
  WeaponAttributesEnum,
  WeaponAttributesStrings,
  WeaponAttributesTitles,
  WeaponTechStrings,
  WeaponTypeStrings,
} from '../types/unitTypes';

type UnitPageProps = {
  unitData: UnitData;
  allFaction: {
    nodes: {
      faction_key: string;
      display_name: string;
      faction_symbol: {
        local_file_path: string;
      };
    }[];
  };
  allUnitCards: {
    nodes: {
      absolutePath: string;
      childImageSharp: {
        gatsbyImageData: IGatsbyImageData;
      };
    }[];
  };
  allUnitInfoCards: {
    nodes: {
      absolutePath: string;
      childImageSharp: {
        gatsbyImageData: IGatsbyImageData;
      };
    }[];
  };
  missingUnitCard: {
    childImageSharp: {
      gatsbyImageData: IGatsbyImageData;
    };
  };
  missingUnitInfoCard: {
    childImageSharp: {
      gatsbyImageData: IGatsbyImageData;
    };
  };
  allFactionSymbol: {
    nodes: {
      absolutePath: string;
      childImageSharp: {
        gatsbyImageData: IGatsbyImageData;
      };
    }[];
  };
  aorSymbol: {
    childImageSharp: {
      gatsbyImageData: IGatsbyImageData;
    };
  };
  mercSymbol: {
    childImageSharp: {
      gatsbyImageData: IGatsbyImageData;
    };
  };
  missingSymbol: {
    childImageSharp: {
      gatsbyImageData: IGatsbyImageData;
    };
  };
};

const UnitPage: React.FC<PageProps<UnitPageProps, Location>> = ({ data, location }) => {
  const currentReleaseSlug = useReleaseSlug().currentReleaseSlug;
  const currentReleaseDisplay = useReleaseSlug().currentReleaseDisplay;

  const [allFactionsMap, allFactions] = useMemo(() => {
    const factionSymbolByPath = new Map(
      data.allFactionSymbol.nodes.map((s) => [s.absolutePath, s]),
    );
    const missingFactionSymbol = data.missingSymbol.childImageSharp.gatsbyImageData;
    const factionMap = new Map(
      data.allFaction.nodes.map((faction) => [
        faction.faction_key,
        {
          display_name: faction.display_name,
          factionSymbol:
            factionSymbolByPath.get(faction.faction_symbol.local_file_path)
              ?.childImageSharp.gatsbyImageData ?? missingFactionSymbol,
        },
      ]),
    );
    factionMap.set('aor', {
      display_name: 'AOR Unit',
      factionSymbol: data.aorSymbol.childImageSharp.gatsbyImageData,
    });
    factionMap.set('merc', {
      display_name: 'Mercenary Unit',
      factionSymbol: data.mercSymbol.childImageSharp.gatsbyImageData,
    });
    let factionsList = data.allFaction.nodes;
    if (factionsList.at(-1) && factionsList.at(-1)?.faction_key === 'slave') {
      factionsList.splice(
        -2,
        0,
        {
          faction_key: 'merc',
          display_name: 'Mercenary Unit',
          faction_symbol: { local_file_path: '' },
        },
        {
          faction_key: 'aor',
          display_name: 'AOR Unit',
          faction_symbol: { local_file_path: '' },
        },
      );
    }
    return [factionMap, factionsList];
  }, [data.allFaction.nodes]);

  const unit = useMemo(() => {
    const unitDefinition = data.unitData;
    if (unitDefinition) {
      unitDefinition.ownership = unitDefinition.ownership.sort(
        (a, b) =>
          allFactions.findIndex((faction) => faction.faction_key === a) -
          allFactions.findIndex((faction) => faction.faction_key === b),
      );
      if (
        unitDefinition.unit_type.slice(0, 3) === 'aor' &&
        unitDefinition.ownership.length === 1 &&
        unitDefinition.ownership.at(0) === 'merc'
      ) {
        unitDefinition.display_name += ' (AOR)';
        unitDefinition.ownership[0] = 'aor';
      }
      const extendedUnitDefinition:
        | (UnitData & { unitCardFactions?: string[] })
        | undefined = {
        ...unitDefinition,
        ownership: unitDefinition.ownership ?? [],
        unitCardFactions: unitDefinition?.ownership.includes('merc')
          ? ['merc']
          : (unitDefinition.ownership ?? []),
      };
      return extendedUnitDefinition;
    }
    return undefined;
  }, [data.unitData, allFactions]);

  const missingUnitCard = data.missingUnitCard.childImageSharp.gatsbyImageData;
  const missingUnitInfoCard = data.missingUnitInfoCard.childImageSharp.gatsbyImageData;

  const unitCards = useMemo(() => {
    const unitCardData = unit?.unit_card_data?.entries ?? [];
    const gatsbyUnitCards = data.allUnitCards.nodes;
    return unitCardData
      .map((unitCard) => {
        const gatsbyUnitCard =
          gatsbyUnitCards
            .filter((y) => y.absolutePath === unitCard.local_file_path)
            .at(0)?.childImageSharp.gatsbyImageData ?? missingUnitCard;

        unitCard.faction =
          unit?.ownership.length === 1 && unitCard.faction === 'merc'
            ? 'aor'
            : unitCard.faction;

        return {
          faction: unitCard.faction,
          factionDisplay: allFactionsMap.get(unitCard.faction) ?? '',
          unitCard: gatsbyUnitCard,
        };
      })
      .filter((unitCard) => unitCard.unitCard)
      .sort(
        (a, b) =>
          allFactions.findIndex((y) => y.faction_key == a.faction) -
          allFactions.findIndex((y) => y.faction_key == b.faction),
      );
  }, [unit, data.allUnitCards.nodes, data.missingUnitCard, allFactions]);

  const unitInfoCards = useMemo(() => {
    const unitInfoCardData = unit?.unit_info_card_data?.entries ?? [];
    const gatsbyUnitInfoCards = data.allUnitInfoCards.nodes;
    return unitInfoCardData
      .map((unitInfoCard) => {
        const gatsbyUnitInfoCard =
          gatsbyUnitInfoCards
            .filter((y) => y.absolutePath === unitInfoCard.local_file_path)
            .at(0)?.childImageSharp.gatsbyImageData ?? missingUnitInfoCard;

        unitInfoCard.faction =
          unit?.ownership.length === 1 && unitInfoCard.faction === 'merc'
            ? 'aor'
            : unitInfoCard.faction;

        return {
          faction: unitInfoCard.faction,
          factionDisplay: allFactionsMap.get(unitInfoCard.faction) ?? '',
          unitInfoCard: gatsbyUnitInfoCard,
        };
      })
      .filter((unitInfoCard) => unitInfoCard.unitInfoCard)
      .sort(
        (a, b) =>
          allFactions.findIndex((y) => y.faction_key == a.faction) -
          allFactions.findIndex((y) => y.faction_key == b.faction),
      );
  }, [unit, data.allUnitInfoCards.nodes, data.missingUnitInfoCard, allFactions]);

  const [selectedFaction, setSelectedFaction] = useState<string>(
    unit?.unitCardFactions?.includes(
      (location.state as { faction?: string } | undefined)?.faction ?? '',
    )
      ? ((location.state as { faction?: string } | undefined)?.faction ??
          unit?.unitCardFactions?.at(0) ??
          '')
      : (unit?.unitCardFactions?.at(0) ?? ''),
  );

  const [selectedUnitCard, setSelectedUnitCard] = useState<
    IGatsbyImageData | undefined
  >();
  const [selectedUnitInfoCard, setSelectedUnitInfoCard] = useState<
    IGatsbyImageData | undefined
  >();

  const [hasMissileWeapon, setHasMissileWeapon] = useState<boolean>(true);

  useEffect(() => {
    setSelectedUnitCard(
      unitCards.filter((unitCard) => unitCard.faction === selectedFaction).at(0)
        ?.unitCard ?? missingUnitCard,
    );
    setSelectedUnitInfoCard(
      unitInfoCards.filter((unitCard) => unitCard.faction === selectedFaction).at(0)
        ?.unitInfoCard ?? missingUnitInfoCard,
    );
  }, [selectedFaction]);

  useEffect(() => {
    setHasMissileWeapon(
      unit?.primary_weapon.missile_type !== 'no' ||
        unit?.secondary_weapon.missile_type !== 'no',
    );
  }, [unit]);

  const [showAdditionalStats, setShowAdditionalStats] = useState(false);

  const WeaponData = (props: {
    weaponData: UnitWeapon;
    type: 'Primary' | 'Secondary';
  }) => {
    const weaponData = props.weaponData;
    const hasWeapon = weaponData.attack !== 0;
    return (
      <>
        <strong>{props.type}</strong>

        <span>{hasWeapon ? weaponData.attack : 'None'}</span>
        <span>{hasWeapon ? weaponData.lethality : '-'}</span>
        <span>{hasWeapon ? weaponData.charge : '-'}</span>
        <span>
          {hasWeapon ? <>{WeaponTypeStrings[weaponData.weapon_type]}</> : '-'}
        </span>
        <span>
          {hasWeapon ? <>{WeaponTechStrings[weaponData.weapon_tech]}</> : '-'}
        </span>
        <span>{hasWeapon ? weaponData.min_delay : '-'}</span>
        {hasMissileWeapon ? (
          <>
            <span className="italic">
              {weaponData.missile_type === 'no' ? '-' : weaponData.missile_type}
            </span>
            <span>
              {weaponData.missile_range === 0 ? '-' : weaponData.missile_range}
            </span>
            <span>{weaponData.missile_ammo === 0 ? '-' : weaponData.missile_ammo}</span>
          </>
        ) : (
          ''
        )}
      </>
    );
  };

  const WeaponAttributes = (props: { weaponAttributes: WeaponAttributesEnum[] }) => {
    const attributes = props.weaponAttributes;
    if (attributes.length) {
      return attributes.map((x, idx) => {
        const strickenThrough =
          (x.startsWith('spear_bonus') &&
            !attributes.includes('spear') &&
            !attributes.includes('light_spear')) ||
          (x === 'spear' && attributes.includes('short_pike')) ||
          (x === 'light_spear' && attributes.includes('short_pike'));
        const displayText = strickenThrough ? (
          <del>{WeaponAttributesStrings[x]}</del>
        ) : (
          WeaponAttributesStrings[x]
        );
        return (
          <span key={`pri-weapon-attr-${x}`}>
            <>
              {WeaponAttributesTitles[x] ? (
                <abbr title={WeaponAttributesTitles[x]}>{displayText}</abbr>
              ) : (
                displayText
              )}
            </>
            {attributes.length !== idx + 1 && ', '}
          </span>
        );
      });
    }
    return <>None</>;
  };

  const [showFullUnitType, setShowFullUnitType] = useState(false);
  const [showFullUnitDictionary, setShowFullUnitDictionary] = useState(false);

  return (
    <>
      {unit ? (
        <article className="px-2 pb-8 text-taupe-800">
          <div className="grid grid-cols-2 items-end justify-center text-center xl:grid xl:grid-cols-4 xl:text-start">
            <h2 className="font-cinzel col-span-2 mb-0 flex-1 overflow-x-auto overflow-y-hidden text-center text-[2.25rem] font-[450] sm:text-[2.5rem]">
              {unit.display_name}
            </h2>
            <span className="col-span-2 row-start-2 w-full text-center text-lg sm:text-xl xl:col-span-1 xl:row-start-1 xl:ms-[5%] xl:w-auto">
              {ClassStrings[unit.unit_class]} {CategoryStrings[unit.category]}
            </span>
            <span className="col-span-2 row-start-3 w-full text-center text-lg sm:text-xl xl:col-span-1 xl:col-start-4 xl:row-start-1 xl:ms-[5%] xl:w-auto">
              ({currentReleaseDisplay})
            </span>
          </div>

          <div className="tapered-hr mt-2 mb-8 h-2 w-full"></div>

          <div className="grid grid-cols-1 justify-items-center gap-y-2 lg:grid-cols-2 xl:justify-around xl:gap-x-2 2xl:flex 2xl:flex-nowrap [&_h3]:text-[20px] [&_h3]:font-bold">
            <div className="grid h-190 w-full min-w-82 shrink-0 grid-cols-1 justify-items-center gap-y-4 lg:me-4 lg:w-82">
              <div className="w-82">
                {selectedUnitInfoCard ? (
                  <GatsbyImage
                    className="shrink-0 grow-0"
                    image={selectedUnitInfoCard}
                    alt={`Unit info card for ${unit.display_name} (${allFactionsMap.get(selectedFaction)})`}
                  />
                ) : (
                  ''
                )}
              </div>
              <div className="flex h-5.5 w-82 items-center">
                <label htmlFor="faction_unit_card_selector">Faction:</label>
                <select
                  onChange={(e) => setSelectedFaction(e.target.value)}
                  id="faction_unit_card_selector"
                  name="faction_unit_card_selector"
                  value={selectedFaction}
                  className="ms-1.5 grow"
                >
                  {unit.unitCardFactions?.map((faction) => {
                    return (
                      <option key={faction} value={faction}>
                        {allFactionsMap.get(faction)?.display_name}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="w-82 text-center">
                {selectedUnitCard ? (
                  <GatsbyImage
                    className="shrink-0 grow-0 shadow-sm/40"
                    image={selectedUnitCard}
                    alt={`Unit card for ${unit.display_name} (${allFactionsMap.get(selectedFaction)})`}
                  />
                ) : (
                  ''
                )}
              </div>
            </div>

            <div className="contents gap-y-2 2xl:flex 2xl:flex-wrap 2xl:justify-around 2xl:*:grow [&_hr]:mb-3 [&_hr]:w-[92%]">
              <div className="justify-items-center 2xl:grid 2xl:grid-cols-1 [&_section]:mb-3 [&_section]:grid [&_section]:auto-rows-max [&_section]:grid-cols-3 [&_section]:gap-x-2 [&_section]:text-center [&_section]:leading-7 [&_section]:2xl:w-88">
                <section>
                  <span className="col-span-2 col-start-2 font-bold">Weapons</span>
                  <div
                    className={`${hasMissileWeapon ? 'row-span-10' : 'row-span-7'} row-start-3 grid grid-flow-col grid-rows-subgrid`}
                  >
                    <strong className="text-end">Attack</strong>
                    <strong className="text-end">Lethality</strong>
                    <strong className="text-end">Charge</strong>
                    <strong className="text-end">Type</strong>
                    <strong className="text-end">
                      <abbr title="Defines whether units get weapons upgrades with certain buildings">
                        <em>Tech</em>
                      </abbr>
                    </strong>
                    <strong className="text-end">Min. Delay</strong>
                    {hasMissileWeapon ? (
                      <>
                        <strong className="text-end">Missile Type</strong>
                        <strong className="text-end">Missile Range</strong>
                        <strong className="text-end">Ammo</strong>
                      </>
                    ) : (
                      ''
                    )}
                  </div>
                  <strong className="col-span-2 col-start-2 text-center">
                    Weapon Attributes
                  </strong>
                  <strong className="text-end">Primary</strong>
                  <span className="col-span-2 text-left">
                    <WeaponAttributes
                      weaponAttributes={unit.primary_weapon_attributes}
                    />
                  </span>
                  <strong className="text-end">Secondary</strong>
                  <span className="col-span-2 text-start">
                    <WeaponAttributes
                      weaponAttributes={unit.secondary_weapon_attributes}
                    />
                  </span>
                  <strong className="col-span-2 col-start-2 text-center">
                    Attack Attributes
                  </strong>
                  <strong className="text-end">Fire Delay</strong>
                  <span className="col-span-2 text-start">{unit.fire_delay}</span>
                  <strong className="text-end">Modifiers</strong>

                  <div
                    className={`${hasMissileWeapon ? 'row-span-10' : 'row-span-7'} col-start-2 row-start-2 grid grid-flow-col grid-rows-subgrid`}
                  >
                    <WeaponData weaponData={unit.primary_weapon} type="Primary" />
                  </div>
                  <div
                    className={`${hasMissileWeapon ? 'row-span-10' : 'row-span-7'} col-start-3 row-start-2 grid grid-flow-col grid-rows-subgrid`}
                  >
                    <WeaponData weaponData={unit.secondary_weapon} type="Secondary" />
                  </div>
                  {unit.mount_effect.length ? (
                    <span className="col-span-2 text-start">
                      {unit.mount_effect.map((x, idx) => (
                        <span key={`mount-effect-${x.mount}`}>
                          {idx === 3 && '(ignored: '}
                          {x.effect > 0 ? `+${x.effect}` : x.effect}
                          {MountEffectStrings[x.mount]}
                          {unit.mount_effect.length !== idx + 1 ? `, ` : idx > 2 && ')'}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-start">None</span>
                  )}
                </section>
                <hr />
                <section>
                  <span className="col-span-2 col-start-2 font-bold">Defence</span>
                  <div className="row-span-4 row-start-3 grid grid-flow-col grid-rows-subgrid">
                    <strong className="text-end">Total</strong>
                    <strong className="text-end">Armour</strong>
                    <strong className="text-end">Defence Skill</strong>
                    <strong className="text-end">Shield</strong>
                  </div>

                  <div className="col-start-2 row-span-5 row-start-2 grid grid-flow-col grid-rows-subgrid">
                    <strong>Primary</strong>
                    <span>
                      {unit.primary_armour.armour +
                        unit.primary_armour.defence_skill +
                        (unit.primary_armour.shield ?? 0)}
                    </span>
                    <span>{unit.primary_armour.armour}</span>
                    <span>{unit.primary_armour.defence_skill}</span>
                    <span>{unit.primary_armour.shield ?? 0}</span>
                  </div>

                  <div className="col-start-3 row-span-5 row-start-2 grid grid-flow-col grid-rows-subgrid">
                    <strong>Secondary</strong>
                    <span>
                      {unit.secondary_armour.armour !== 0
                        ? unit.primary_armour.armour + unit.primary_armour.defence_skill
                        : '-'}
                    </span>
                    <span>
                      {unit.secondary_armour.armour !== 0
                        ? unit.secondary_armour.armour
                        : '-'}
                    </span>
                    <span>
                      {unit.secondary_armour.armour !== 0
                        ? unit.secondary_armour.defence_skill
                        : '-'}
                    </span>
                    <span>-</span>
                  </div>
                </section>
              </div>
              <div className="mb-3 w-[92%] border-t border-[#aaa] pt-5 text-center lg:col-span-2 2xl:hidden">
                {showAdditionalStats ? (
                  <button
                    className="cursor-pointer rounded-md border bg-taupe-200/80 px-1.5 py-0.5 shadow-md transition-all hover:bg-taupe-400/80 hover:shadow-lg focus:bg-taupe-400/90 focus:shadow-none active:bg-taupe-400 active:shadow-sm"
                    onClick={() => setShowAdditionalStats(false)}
                  >
                    Hide additional stats
                  </button>
                ) : (
                  <button
                    className="cursor-pointer rounded-md border bg-taupe-200/80 px-1.5 py-0.5 shadow-md transition-all hover:bg-taupe-400/80 hover:shadow-lg focus:bg-taupe-400/90 focus:shadow-none active:bg-taupe-400 active:shadow-sm"
                    onClick={() => setShowAdditionalStats(true)}
                  >
                    Show additional stats
                  </button>
                )}
              </div>
              <div
                className={`${!showAdditionalStats && 'hidden'} justify-items-center 2xl:grid 2xl:grid-cols-1 [&_section]:mb-3 [&_section]:grid [&_section]:auto-rows-max [&_section]:grid-cols-2 [&_section]:gap-x-2 [&_section]:text-center [&_section]:leading-7 [&_section]:2xl:w-62`}
              >
                <section>
                  <span className="col-start-2 font-bold">Soldier Stats</span>
                  <div className="row-span-3 grid grid-flow-col grid-rows-subgrid">
                    <strong className="text-end">
                      <abbr title="On medium unit size">Soldiers</abbr>
                    </strong>
                    <strong className="text-end">Mass</strong>
                    {unit.soldier_data.extras ? (
                      <strong className="text-end">
                        <abbr title="On medium unit size">
                          {unit.category === 'siege'
                            ? 'Engines'
                            : unit.display_name.toLowerCase().includes('chariots')
                              ? 'Chariots'
                              : 'Animals'}
                        </abbr>
                      </strong>
                    ) : (
                      ''
                    )}
                  </div>
                  <div className="col-start-2 row-span-3 row-start-2 grid grid-flow-col grid-rows-subgrid">
                    <span>{unit.soldier_data.number_of_soldiers}</span>
                    <span>
                      {unit.category === 'cavalry' ? (
                        <abbr title="Mass value for mounted units comes from mount's mass">
                          ?
                        </abbr>
                      ) : (
                        unit.soldier_data.mass
                      )}
                    </span>
                    {unit.soldier_data.extras ? (
                      <span>{unit.soldier_data.extras}</span>
                    ) : (
                      ''
                    )}
                  </div>
                </section>
                <hr />
                <section>
                  <span className="col-start-2 font-bold">Mental Stats</span>
                  <div className="row-span-3 grid grid-flow-col grid-rows-subgrid">
                    <strong className="text-end">Morale</strong>
                    <strong className="text-end">Discipline</strong>
                    <strong className="text-end">Training</strong>
                  </div>
                  <div className="col-start-2 row-span-3 row-start-2 grid grid-flow-col grid-rows-subgrid">
                    <span>{unit.mental_modifiers.morale}</span>
                    <span>{DisciplineStrings[unit.mental_modifiers.discipline]}</span>
                    <span>{TrainingStrings[unit.mental_modifiers.training]}</span>
                  </div>
                </section>
                <hr />
                <section>
                  <span className="col-start-2 font-bold">Health</span>
                  <div className="row-span-2 grid grid-flow-col grid-rows-subgrid">
                    <strong className="text-end">Hit Points</strong>
                    <strong className="text-end">
                      <abbr title="Additional hit points for unit's animals and for auto-resolve">
                        Extra HP
                      </abbr>
                    </strong>
                  </div>
                  <div className="col-start-2 row-span-2 row-start-2 grid grid-flow-col grid-rows-subgrid">
                    <span>{unit.health.hp}</span>
                    <span>{unit.health.hp_extra}</span>
                  </div>
                </section>
                <hr />
                <section>
                  <span className="col-start-2 font-bold">Formation</span>
                  <div className="row-span-3 grid grid-flow-col grid-rows-subgrid">
                    <strong className="text-end">Formations</strong>
                    <strong className="text-end">Depth</strong>
                    <strong className="text-end">Charge Dist.</strong>
                  </div>

                  <span className="col-start-2 leading-6 font-bold">
                    Spacing
                    <br />
                    &nbsp;Side&nbsp;/&nbsp;Back
                  </span>
                  <div className="row-span-2 grid grid-flow-col grid-rows-subgrid">
                    <strong className="text-end">Close</strong>
                    <strong className="text-end">Loose</strong>
                  </div>

                  <div className="col-start-2 row-span-3 row-start-2 grid grid-flow-col grid-rows-subgrid">
                    <span>
                      {unit.formation.formations.map((x, idx) => (
                        <span key={`formation-${x}`}>
                          {idx > 1 ? (
                            <abbr title="Only two formations per unit possible.">
                              <del>{FormationTypeStrings[x]}</del>
                            </abbr>
                          ) : (
                            FormationTypeStrings[x]
                          )}
                          {unit.formation.formations.length !== idx + 1 && ', '}
                        </span>
                      ))}
                    </span>
                    <span>{unit.formation.number_of_ranks}</span>
                    <span>{unit.charge_distance}</span>
                  </div>
                  <div className="col-start-2 row-span-2 row-start-6 grid grid-flow-col grid-rows-subgrid">
                    <span>
                      {unit.formation.close_horizontal_spacing}&nbsp;/&nbsp;
                      {unit.formation.close_vertical_spacing}
                    </span>
                    <span>
                      {unit.formation.loose_horizontal_spacing}&nbsp;/&nbsp;
                      {unit.formation.loose_vertical_spacing}
                    </span>
                  </div>
                </section>
              </div>
              <div
                className={`${!showAdditionalStats && 'hidden'} justify-items-center 2xl:grid 2xl:grid-cols-1 [&_section]:mb-3 [&_section]:grid [&_section]:auto-rows-max [&_section]:grid-cols-2 [&_section]:gap-x-2 [&_section]:text-center [&_section]:leading-7 [&_section]:2xl:w-78`}
              >
                <hr className="lg:hidden" />
                <section>
                  <span className="col-start-2 font-bold">Cost</span>
                  <div className="row-span-7 grid grid-flow-col grid-rows-subgrid">
                    <strong className="text-end">
                      <abbr title="On medium unit size.">Recruitment</abbr>
                    </strong>
                    <strong className="text-end">
                      <abbr title="On medium unit size.">Upkeep</abbr>
                    </strong>
                    <strong className="text-end">Weapon Upgrade</strong>
                    <strong className="text-end">Armour Upgrade</strong>
                    <strong className="text-end">Custom Battle</strong>
                  </div>
                  <div className="col-start-2 row-span-7 row-start-2 grid grid-flow-col grid-rows-subgrid">
                    <span>{unit.cost.recruit}</span>
                    <span>{unit.cost.upkeep}</span>
                    <span>{unit.cost.weapon_upgrade}</span>
                    <span>{unit.cost.armour_upgrade}</span>
                    <span>{unit.cost.custom_battle_cost}</span>
                  </div>
                </section>
                <hr />
                <section>
                  <span className="col-start-2 font-bold">Recruitment</span>
                  <div className="row-span-7 grid grid-flow-col grid-rows-subgrid">
                    <strong className="text-end">Turns Taken</strong>
                    <strong className="text-end">AI Priority Offset</strong>
                  </div>
                  <div className="col-start-2 row-span-7 row-start-2 grid grid-flow-col grid-rows-subgrid">
                    <span>{unit.cost.turns}</span>
                    <span>{unit.recruitment_priority_offset ?? '-'}</span>
                  </div>
                </section>
                <hr />
                <section>
                  <span className="col-start-2 font-bold">Terrain Modifiers</span>
                  <div className="row-span-5 grid grid-flow-col grid-rows-subgrid">
                    <strong className="text-end">
                      <abbr title="Modifies raw attack value">Attack ± in Scrub</abbr>
                    </strong>
                    <strong className="text-end">
                      <abbr title="Modifies raw attack value">Attack ± in Sand</abbr>
                    </strong>
                    <strong className="text-end">
                      <abbr title="Modifies raw attack value">Attack ± in Forest</abbr>
                    </strong>
                    <strong className="text-end">
                      <abbr title="Modifies raw attack value">Attack ± in Snow</abbr>
                    </strong>
                    <strong className="text-end">
                      <abbr title="Modifies stamina consumption and recovery rate">
                        Heat Modifier
                      </abbr>
                    </strong>
                  </div>
                  <div className="col-start-2 row-span-5 row-start-2 grid grid-flow-col grid-rows-subgrid">
                    <span>{unit.ground_modifiers.scrub_modifier}</span>
                    <span>{unit.ground_modifiers.sand_modifier}</span>
                    <span>{unit.ground_modifiers.forest_modifier}</span>
                    <span>{unit.ground_modifiers.snow_modifier}</span>
                    <span>{unit.heat_modifier}</span>
                  </div>
                </section>
                <hr />
                <section>
                  <span className="col-start-2 font-bold">Unit Data</span>
                  <div className="row-span-4 grid grid-flow-col grid-rows-subgrid">
                    <strong className="text-end">Unit Type (ID)</strong>
                    <strong className="text-end">Dictionary String</strong>
                    <strong className="text-end">Unit Class</strong>
                    <strong className="text-end">Unit Category</strong>
                  </div>
                  <div className="col-start-2 row-span-4 row-start-2 grid grid-flow-col grid-rows-subgrid text-center">
                    {unit.unit_type.length > 20 ? (
                      <span
                        className={`cursor-pointer ${!showFullUnitType && 'truncate'}`}
                        title={unit.unit_type}
                        aria-label={unit.unit_type}
                        onClick={() => setShowFullUnitType((value) => !value)}
                      >
                        <em>{unit.unit_type}</em>
                      </span>
                    ) : (
                      <span>
                        <em>{unit.unit_type}</em>
                      </span>
                    )}
                    {unit.dictionary.length > 20 ? (
                      <span
                        className={`cursor-pointer ${!showFullUnitDictionary && 'truncate'}`}
                        title={unit.dictionary}
                        aria-label={unit.dictionary}
                        onClick={() => setShowFullUnitDictionary((value) => !value)}
                      >
                        <em>
                          {showFullUnitDictionary
                            ? unit.dictionary.split('_').map((substr, idx, arr) => {
                                return (
                                  <>
                                    {substr}
                                    {arr.length !== idx + 1 && '_'}
                                    <wbr />
                                  </>
                                );
                              })
                            : unit.dictionary}
                        </em>
                      </span>
                    ) : (
                      <span>
                        <em>{unit.dictionary}</em>
                      </span>
                    )}
                    <span>{ClassStrings[unit.unit_class]}</span>
                    <span>{CategoryStrings[unit.category]}</span>
                  </div>
                </section>
              </div>
              <div className="w-full lg:col-span-2">
                <div className="w-full text-center 2xl:hidden">
                  {showAdditionalStats && (
                    <button
                      className="mb-5 cursor-pointer rounded-md border bg-taupe-200/80 px-1.5 py-0.5 shadow-md transition-all hover:bg-taupe-400/80 hover:shadow-lg focus:bg-taupe-400/90 focus:shadow-none active:bg-taupe-400 active:shadow-sm"
                      onClick={() => setShowAdditionalStats(false)}
                    >
                      Hide additional stats
                    </button>
                  )}
                </div>
                <hr />
                <div>
                  <strong>Attributes:&nbsp;</strong>
                  <span>
                    {unit.attributes.length
                      ? unit.attributes
                          .filter(
                            (attribute) =>
                              !attribute.startsWith('general_unit_upgrade') &&
                              (AttributesStrings[attribute as AttributesEnum] ?? false),
                          )
                          .map((x, idx) => (
                            <span key={`unit-attribs-${x}`}>
                              {AttributesStrings[x as AttributesEnum]}
                              {unit.attributes.length !== idx + 1 && ', '}
                            </span>
                          ))
                      : 'None'}
                  </span>
                </div>
                <div className="mt-2">
                  <strong>Ownership:&nbsp;</strong>
                  {unit.ownership.map((ownershipFaction, idx) => (
                    <span key={`unit-roster-ownership-${ownershipFaction}`}>
                      <span className="me-px leading-6 whitespace-nowrap">
                        <Link
                          to={`/${currentReleaseSlug}/#${ownershipFaction}`.replaceAll(
                            '//',
                            '/',
                          )}
                          className="me-px inline-flex items-baseline text-sm"
                        >
                          {(() => {
                            const item = allFactionsMap.get(ownershipFaction);
                            return (
                              item &&
                              item.factionSymbol && (
                                <GatsbyImage
                                  image={item.factionSymbol}
                                  alt={item.display_name}
                                  className="me-0.5 h-4.5 w-4.5 shrink-0 grow-0 self-center"
                                />
                              )
                            );
                          })()}
                          {allFactionsMap.get(ownershipFaction)?.display_name ??
                            ownershipFaction}
                        </Link>
                        {unit.ownership.length !== idx + 1 && ','}
                      </span>
                      {unit.ownership.length !== idx + 1 && ' '}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <div className="w-full basis-full [&_hr]:my-4">
              <hr />
              <section>
                <h3>Short description</h3>
                <p>{unit.short_description ?? 'N/A'}</p>
              </section>
              <hr />
              <section>
                <h3>Description</h3>
                {unit.long_description
                  ?.split('\\n')
                  .filter((paragraph, idx) => idx > 1 || (idx < 2 && paragraph))
                  .map((paragraph, idx) => (
                    <p key={`long-descr-${idx}`}>
                      {paragraph ? paragraph : <>&nbsp;</>}
                    </p>
                  )) ?? 'N/A'}
              </section>
            </div>
          </div>
        </article>
      ) : (
        <></>
      )}
    </>
  );
};

export default UnitPage;
export const query = graphql`
  query UnitPageQuery(
    $release: String!
    $unitType: String!
    $unitCardPaths: [String]!
    $unitInfoCardPaths: [String]!
    $factionSymbolPaths: [String]!
  ) {
    unitData(release: { eq: $release }, unit_type: { eq: $unitType }) {
      release
      unit_type
      dictionary
      category
      unit_class
      soldier_data {
        number_of_soldiers
        extras
        mass
      }
      mount_effect {
        mount
        effect
      }
      attributes
      formation {
        close_horizontal_spacing
        close_vertical_spacing
        loose_horizontal_spacing
        loose_vertical_spacing
        number_of_ranks
        formations
      }
      health {
        hp
        hp_extra
      }
      primary_weapon {
        attack
        charge
        missile_type
        missile_range
        missile_ammo
        weapon_type
        weapon_tech
        min_delay
        lethality
      }
      primary_weapon_attributes
      secondary_weapon {
        attack
        charge
        missile_type
        missile_range
        missile_ammo
        weapon_type
        weapon_tech
        min_delay
        lethality
      }
      secondary_weapon_attributes
      primary_armour {
        armour
        defence_skill
        shield
      }
      secondary_armour {
        armour
        defence_skill
      }
      heat_modifier
      ground_modifiers {
        scrub_modifier
        sand_modifier
        forest_modifier
        snow_modifier
      }
      mental_modifiers {
        morale
        discipline
        training
      }
      charge_distance
      fire_delay
      cost {
        turns
        recruit
        upkeep
        weapon_upgrade
        armour_upgrade
        custom_battle_cost
      }
      recruitment_priority_offset
      ownership
      display_name
      short_description
      long_description
      unit_card_data {
        entries {
          faction
          local_file_path
        }
      }
      unit_info_card_data {
        entries {
          faction
          local_file_path
        }
      }
    }
    allFaction(filter: { release: { eq: $release } }) {
      nodes {
        faction_key
        display_name
        faction_symbol {
          local_file_path
        }
      }
    }
    allUnitCards: allFile(
      filter: {
        sourceInstanceName: { eq: "unit_cards" }
        absolutePath: { in: $unitCardPaths }
      }
    ) {
      nodes {
        absolutePath
        childImageSharp {
          gatsbyImageData(
            width: 164
            height: 218
            placeholder: BLURRED
            formats: [AUTO, WEBP, AVIF]
          )
        }
      }
    }
    allUnitInfoCards: allFile(
      filter: {
        sourceInstanceName: { eq: "unit_info_cards" }
        absolutePath: { in: $unitInfoCardPaths }
      }
    ) {
      nodes {
        absolutePath
        childImageSharp {
          gatsbyImageData(
            width: 328
            height: 448
            placeholder: BLURRED
            formats: [AUTO, WEBP, AVIF]
          )
        }
      }
    }
    missingUnitCard: file(
      sourceInstanceName: { eq: "unit_cards" }
      name: { eq: "#missing_card" }
    ) {
      childImageSharp {
        gatsbyImageData(
          width: 164
          height: 218
          placeholder: BLURRED
          formats: [AUTO, WEBP, AVIF]
        )
      }
    }
    missingUnitInfoCard: file(
      sourceInstanceName: { eq: "unit_info_cards" }
      name: { eq: "missing_card_info" }
    ) {
      childImageSharp {
        gatsbyImageData(
          width: 328
          height: 448
          placeholder: BLURRED
          formats: [AUTO, WEBP, AVIF]
        )
      }
    }
    allFactionSymbol: allFile(
      filter: {
        sourceInstanceName: { eq: "faction_symbols" }
        absolutePath: { in: $factionSymbolPaths }
      }
    ) {
      nodes {
        absolutePath
        childImageSharp {
          gatsbyImageData(
            width: 18
            height: 18
            placeholder: BLURRED
            formats: [AUTO, WEBP, AVIF]
          )
        }
      }
    }
    missingSymbol: file(
      sourceInstanceName: { eq: "faction_symbols" }
      name: { eq: "missing_symbol" }
    ) {
      childImageSharp {
        gatsbyImageData(
          width: 18
          height: 18
          placeholder: BLURRED
          formats: [AUTO, WEBP, AVIF]
        )
      }
    }
    aorSymbol: file(
      sourceInstanceName: { eq: "faction_symbols" }
      name: { eq: "aor_symbol" }
    ) {
      childImageSharp {
        gatsbyImageData(
          width: 18
          height: 18
          placeholder: BLURRED
          formats: [AUTO, WEBP, AVIF]
        )
      }
    }
    mercSymbol: file(
      sourceInstanceName: { eq: "faction_symbols" }
      name: { eq: "merc_symbol" }
    ) {
      childImageSharp {
        gatsbyImageData(
          width: 18
          height: 18
          placeholder: BLURRED
          formats: [AUTO, WEBP, AVIF]
        )
      }
    }
  }
`;

export const Head: HeadFC<UnitPageProps> = ({ data }) => {
  const currentReleaseDisplay = data.unitData.release.replaceAll(/^\D+/g, '') ?? '';
  const unitDisplayName = data.unitData.display_name ?? data.unitData.unit_type ?? '';
  const title = currentReleaseDisplay
    ? `${unitDisplayName} (${currentReleaseDisplay})`
    : `${unitDisplayName}`;
  const description = data.unitData.short_description;
  const pathname =
    `${useReleaseSlug().currentReleaseSlug}/${useReleaseSlug().currentUnitSlug}/`.replaceAll(
      '//',
      '/',
    );
  return <PageHead title={title} description={description} pathname={pathname} />;
};
