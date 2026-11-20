import { graphql, HeadFC, PageProps } from 'gatsby';
import { IGatsbyImageData } from 'gatsby-plugin-image';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHead } from '../components/pageHead';
import JumpToList from '../components/releasePage/jumpToList';
import UnitFilters from '../components/releasePage/unitFilters';
import UnitsList from '../components/releasePage/unitsList';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { useUnitFilterParams } from '../hooks/useUnitFilterParams';
import { ExtendedFactionData } from '../types/factionTypes';
import { CategoryEnum, ClassEnum, UnitDisplayInfo } from '../types/unitTypes';

type ReleasePageProps = {
  allUnitMetadata: {
    nodes: {
      unit_type: string;
      display_name: string;
      ownership: string[];
      category: CategoryEnum;
      unit_class: ClassEnum;
    }[];
  };
  release: {
    slug: string;
    name: string;
  };
  allFaction: {
    nodes: {
      faction_key: string;
      display_name: string;
      primary_colour: { R: string; G: string; B: string };
      faction_symbol: { local_file_path: string };
    }[];
  };
  allFactionSymbol: {
    nodes: {
      absolutePath: string;
      largeImage: {
        gatsbyImageData: IGatsbyImageData;
      };
      smallImage: {
        gatsbyImageData: IGatsbyImageData;
      };
    }[];
  };
  aorSymbol: {
    largeImage: {
      gatsbyImageData: IGatsbyImageData;
    };
    smallImage: {
      gatsbyImageData: IGatsbyImageData;
    };
  };
  mercSymbol: {
    largeImage: {
      gatsbyImageData: IGatsbyImageData;
    };
    smallImage: {
      gatsbyImageData: IGatsbyImageData;
    };
  };
  missingSymbol: {
    largeImage: {
      gatsbyImageData: IGatsbyImageData;
    };
    smallImage: {
      gatsbyImageData: IGatsbyImageData;
    };
  };
};

const ReleasePage: React.FC<PageProps<ReleasePageProps>> = ({ data }) => {
  const [units, sortedUnits]: [UnitDisplayInfo[], UnitDisplayInfo[]] = useMemo(() => {
    const unitsObj: UnitDisplayInfo[] = data.allUnitMetadata.nodes.map((unit) => {
      const unitDisplayName =
        unit.unit_type.slice(0, 3) === 'aor' &&
        unit.ownership.length === 1 &&
        unit.ownership.at(0) === 'merc'
          ? `${unit.display_name} [AOR]`
          : unit.ownership.find((ownership) => ownership === 'merc') &&
              unit.display_name.slice(0, 9) !== 'Mercenary'
            ? `${unit.display_name} [Mercenary]`
            : unit.unit_type.slice(0, 6) === 'horde '
              ? `${unit.display_name} [Horde]`
              : unit.display_name
                ? unit.display_name
                : unit.unit_type;
      return {
        ...unit,
        unit_type: unit.unit_type.replace(/[ -]/g, '_'),
        display_name: unitDisplayName,
        display_name_lowercase: unitDisplayName.toLowerCase(),
        category: unit.category,
        unit_class: unit.unit_class,
        ownership:
          unit.ownership.length === 1 && unit.ownership.at(0) === 'merc'
            ? ['aor']
            : unit.ownership,
      };
    });
    const oldUnitsObj = JSON.parse(JSON.stringify(unitsObj));
    const seenUnitsSet = new Set<{ display_name: string; ownership: string }>();
    unitsObj.forEach((unit) => {
      if (
        oldUnitsObj.filter(
          (filterUnit: UnitDisplayInfo) =>
            filterUnit.display_name === unit.display_name,
        ).length > 1
      ) {
        let idx = 0;
        let factionName: string | undefined;
        while (idx < unit.ownership.length || idx === 0) {
          if (
            seenUnitsSet
              .values()
              .find(
                (seenUnit) =>
                  seenUnit.display_name === unit.display_name &&
                  seenUnit.ownership === unit.ownership.at(idx),
              )
          ) {
            idx++;
            continue;
          }
          const factionOwnership = data.allFaction.nodes.filter(
            (faction) => faction.faction_key === unit.ownership.at(idx),
          );
          factionName = factionOwnership.length
            ? (factionOwnership.at(0)!.display_name.split(' ').at(0) ??
              unit.ownership.at(idx))
            : unit.ownership.at(idx);

          seenUnitsSet.add({
            display_name: unit.display_name,
            ownership: unit.ownership.at(idx)!,
          });
          break;
        }
        unit.display_name = factionName
          ? `${unit.display_name} [${factionName}]`
          : unit.display_name;
      }
    });
    return [
      unitsObj,
      unitsObj.slice().sort((a, b) => a.display_name.localeCompare(b.display_name)),
    ];
  }, [data.allUnitMetadata.nodes]);

  const unitsById = useMemo(() => {
    const unitsMap = new Map<string, UnitDisplayInfo>();
    for (const unit of units) unitsMap.set(unit.unit_type, unit);
    return unitsMap as ReadonlyMap<string, UnitDisplayInfo>;
  }, [units]);

  const [unitFactionFilter, setUnitFactionFilter] = useUnitFilterParams('faction', '');
  const [unitCategoryFilter, setUnitCategoryFilter] = useUnitFilterParams(
    'category',
    '',
  );
  const [unitClassFilter, setUnitClassFilter] = useUnitFilterParams('class', '');

  const [debouncedNameFilter, setDebouncedNameFilter] = useUnitFilterParams('name', '');
  const [unitNameFilter, setUnitNameFilter] = useState(debouncedNameFilter);

  useEffect(() => {
    if (unitNameFilter !== debouncedNameFilter) {
      setUnitNameFilter(debouncedNameFilter);
    }
  }, [debouncedNameFilter]);

  useEffect(() => {
    const delayInputTimeoutId = setTimeout(() => {
      setDebouncedNameFilter(unitNameFilter);
    }, 250);
    return () => clearTimeout(delayInputTimeoutId);
  }, [unitNameFilter]);

  const onUnitNameFilterChange = useCallback(
    (event?: React.ChangeEvent<HTMLInputElement>, clear?: boolean) => {
      if (event) setUnitNameFilter(event.target.value);
      if (clear) {
        setUnitNameFilter('');
        setDebouncedNameFilter('');
      }
    },
    [setUnitNameFilter, setDebouncedNameFilter],
  );

  const onUnitNameFilterEnter = useCallback(
    (event?: React.KeyboardEvent<HTMLInputElement>) => {
      if (event?.key !== 'Enter') return;
      const target = event.currentTarget;
      if (target.value !== unitNameFilter) setUnitNameFilter(target.value);
      if (target.value !== debouncedNameFilter) setDebouncedNameFilter(target.value);
    },
    [unitNameFilter, debouncedNameFilter, setUnitNameFilter, setDebouncedNameFilter],
  );

  const onUnitFactionFilterChange = useCallback(
    (event?: React.ChangeEvent<HTMLSelectElement>, clear?: boolean) => {
      if (event && event.target.value !== unitFactionFilter)
        setUnitFactionFilter(event.target.value);
      if (clear) setUnitFactionFilter('');
    },
    [setUnitFactionFilter],
  );

  const onUnitCategoryFilterChange = useCallback(
    (event?: React.ChangeEvent<HTMLSelectElement>, clear?: boolean) => {
      if (event && event.target.value !== unitCategoryFilter)
        setUnitCategoryFilter(event.target.value);
      if (clear) setUnitCategoryFilter('');
    },
    [setUnitCategoryFilter],
  );

  const onUnitClassFilterChange = useCallback(
    (event?: React.ChangeEvent<HTMLSelectElement>, clear?: boolean) => {
      if (event && event.target.value !== unitClassFilter)
        setUnitClassFilter(event.target.value);
      if (clear) setUnitClassFilter('');
    },
    [setUnitClassFilter],
  );

  const factions: ExtendedFactionData[] = useMemo(() => {
    const factionsList = data.allFaction.nodes.slice();
    const missingSymbolLarge = data.missingSymbol.largeImage.gatsbyImageData;
    const missingSymbolSmall = data.missingSymbol.smallImage.gatsbyImageData;
    const factionSymbolByPath = new Map(
      data.allFactionSymbol.nodes.map((s) => [s.absolutePath, s]),
    );
    let extendedFactionsList = factionsList.map((faction) => {
      return {
        ...faction,
        largeImage:
          factionSymbolByPath.get(faction.faction_symbol.local_file_path)?.largeImage
            .gatsbyImageData ?? missingSymbolLarge,
        smallImage:
          factionSymbolByPath.get(faction.faction_symbol.local_file_path)?.smallImage
            .gatsbyImageData ?? missingSymbolSmall,
      };
    });
    console.log(data.allFaction.nodes);
    if (
      extendedFactionsList.at(-1) &&
      extendedFactionsList.at(-1)?.faction_key === 'slave' &&
      extendedFactionsList.at(-2)?.faction_key !== 'mer' &&
      extendedFactionsList.at(-3)?.faction_key !== 'aor'
    ) {
      extendedFactionsList = [
        ...extendedFactionsList.slice(0, -1),
        {
          faction_key: 'aor',
          display_name: 'Area of Recruitment (AOR) Units',
          primary_colour: extendedFactionsList.at(-1)!.primary_colour,
          faction_symbol: extendedFactionsList.at(-1)!.faction_symbol,
          largeImage: data.aorSymbol.largeImage.gatsbyImageData,
          smallImage: data.aorSymbol.smallImage.gatsbyImageData,
        },
        {
          faction_key: 'merc',
          display_name: 'Mercenary Units',
          primary_colour: extendedFactionsList.at(-1)!.primary_colour,
          faction_symbol: extendedFactionsList.at(-1)!.faction_symbol,
          largeImage: data.mercSymbol.largeImage.gatsbyImageData,
          smallImage: data.mercSymbol.smallImage.gatsbyImageData,
        },
        ...extendedFactionsList.slice(-1),
      ];
      extendedFactionsList = extendedFactionsList.filter(
        (faction) => faction.faction_key !== 'dummies',
      );
    }
    return extendedFactionsList;
  }, [
    data.allFaction,
    data.allFactionSymbol,
    data.missingSymbol,
    data.aorSymbol,
    data.mercSymbol,
  ]);

  const factionDisplays = useMemo(() => {
    const displays: { faction_key: string; display_name: string }[] = [];
    for (const faction of factions)
      displays.push({
        faction_key: faction.faction_key,
        display_name: faction.display_name,
      });
    return displays;
  }, [factions]);

  const factionsByKey = useMemo(() => {
    const factionsMap = new Map<string, (typeof factions)[number]>();
    for (const faction of factions) factionsMap.set(faction.faction_key, faction);
    return factionsMap as ReadonlyMap<string, (typeof factions)[number]>;
  }, [factions]);

  const unitsByFaction = useMemo(() => {
    const unitMap = new Map<string, UnitDisplayInfo[]>();
    for (const faction of factions) unitMap.set(faction.faction_key, []);
    for (const unit of sortedUnits) {
      for (const factionKey of unit.ownership) {
        const unitFromMap = unitMap.get(factionKey);
        if (unitFromMap) unitFromMap.push(unit);
      }
    }
    return unitMap as ReadonlyMap<string, UnitDisplayInfo[]>;
  }, [factions, sortedUnits]);

  const filteredUnitIds = useMemo(() => {
    const nameFilter = (debouncedNameFilter ?? '').trim().toLowerCase();
    if (!nameFilter && !unitFactionFilter && !unitCategoryFilter && !unitClassFilter) {
      return sortedUnits.map((unit) => unit.unit_type);
    }
    const unitIds: string[] = [];
    const unitsToFilter = unitFactionFilter
      ? (unitsByFaction.get(unitFactionFilter) ?? [])
      : sortedUnits;
    for (const unit of unitsToFilter) {
      if (nameFilter && !unit.display_name_lowercase.includes(nameFilter)) continue;
      if (
        unitCategoryFilter &&
        !(unit.category === (unitCategoryFilter as CategoryEnum))
      )
        continue;
      if (unitClassFilter && !(unit.unit_class === (unitClassFilter as ClassEnum)))
        continue;
      unitIds.push(unit.unit_type);
    }
    return unitIds;
  }, [
    sortedUnits,
    unitsByFaction,
    debouncedNameFilter,
    unitFactionFilter,
    unitCategoryFilter,
    unitClassFilter,
  ]);

  const filteredUnitIdsByFaction = useMemo(() => {
    const factionRecords: Record<string, string[]> = {};
    for (const faction of factions) factionRecords[faction.faction_key] = [];
    for (const unitKey of filteredUnitIds) {
      const unit = unitsById.get(unitKey);
      if (!unit) continue;
      for (const factionKey of unit.ownership) {
        const unitFactions = factionRecords[factionKey];
        if (unitFactions) unitFactions.push(unit.unit_type);
      }
    }
    const unitsMap = new Map<string, string[]>();
    for (const faction of factions) {
      const unitFactions = factionRecords[faction.faction_key];
      if (unitFactions.length) unitsMap.set(faction.faction_key, unitFactions);
    }
    return unitsMap;
  }, [filteredUnitIds, factions, unitsById]);

  const filteredUnitIdsByLetter = useMemo(() => {
    const letterRecord: Record<string, string[]> = {};
    for (const key of filteredUnitIds) {
      const unit = unitsById.get(key);
      if (!unit) continue;
      const unit_key = unit.display_name?.[0]?.toUpperCase() ?? '#';
      if (unit_key === '#') continue;
      if (!letterRecord[unit_key]) letterRecord[unit_key] = [];
      letterRecord[unit_key].push(key);
    }
    const unitsMap = new Map<string, string[]>();
    Object.keys(letterRecord)
      .sort()
      .forEach((k) => unitsMap.set(k, letterRecord[k]));
    return unitsMap;
  }, [filteredUnitIds, unitsById]);

  const letters = useMemo(
    () => Array.from(filteredUnitIdsByLetter.keys()).sort(),
    [filteredUnitIdsByLetter],
  );

  const factionKeysWithUnits = useMemo(
    () => Array.from(filteredUnitIdsByFaction.keys()),
    [filteredUnitIdsByFaction],
  );

  useEffect(() => {
    const letterHashInUrl = /^#([A-Z])$/.test(window.location.hash) ? false : true;
    setSplitByFactions(letterHashInUrl);
  }, []);

  const [splitByFactions, setSplitByFactions] = useLocalStorageState<boolean>(
    'splitByFactions',
    true,
  );
  const [, , clearHash] = useUnitFilterParams('none', '');

  const onToggleSplit = useCallback(() => {
    setSplitByFactions((x: boolean) => !x);
    clearHash();
  }, [setSplitByFactions]);

  const factionItems = useMemo(
    () =>
      [...factionsByKey.values()].map((faction) => ({
        key: faction.faction_key,
        label: faction.display_name,
        smallImage: faction.smallImage,
      })),
    [factionsByKey],
  );

  const letterItems = useMemo(
    () => letters.map((letter) => ({ key: letter, label: letter })),
    [letters],
  );

  const jumpToDivRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <header>
        <UnitFilters
          unitNameFilter={unitNameFilter}
          unitFactionFilter={unitFactionFilter}
          unitCategoryFilter={unitCategoryFilter}
          unitClassFilter={unitClassFilter}
          onUnitNameFilterChange={onUnitNameFilterChange}
          onUnitNameFilterEnter={onUnitNameFilterEnter}
          onUnitFactionFilterChange={onUnitFactionFilterChange}
          onUnitCategoryFilterChange={onUnitCategoryFilterChange}
          onUnitClassFilterChange={onUnitClassFilterChange}
          factionDisplays={factionDisplays}
        />
        <div ref={jumpToDivRef}>
          {!unitFactionFilter ? (
            splitByFactions ? (
              <JumpToList
                byFaction={true}
                items={factionItems}
                factionKeysWithUnits={factionKeysWithUnits}
                onToggleSplit={onToggleSplit}
                jumpToDivRef={jumpToDivRef}
              />
            ) : (
              <JumpToList
                byFaction={false}
                items={letterItems}
                onToggleSplit={onToggleSplit}
                jumpToDivRef={jumpToDivRef}
              />
            )
          ) : (
            <hr className="my-3" />
          )}
        </div>
      </header>
      <main>
        <UnitsList
          unitFactionFilter={unitFactionFilter}
          factionsByKey={factionsByKey}
          factionsKeysWithUnits={factionKeysWithUnits}
          filteredUnitIdsByFaction={filteredUnitIdsByFaction}
          unitsById={unitsById}
          letters={letters}
          filteredUnitIdsByLetter={filteredUnitIdsByLetter}
          splitByFactions={splitByFactions}
        />
      </main>
    </>
  );
};

export const query = graphql`
  query ReleasePageQuery(
    $slug: String!
    $name: String
    $factionSymbolPaths: [String]!
  ) {
    release(slug: { eq: $slug }) {
      slug
      name
    }
    allUnitMetadata(filter: { release: { eq: $name } }) {
      nodes {
        unit_type
        display_name
        ownership
        category
        unit_class
      }
    }
    allFaction(filter: { release: { eq: $name } }) {
      nodes {
        faction_key
        display_name
        primary_colour {
          R
          G
          B
        }
        faction_symbol {
          local_file_path
        }
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
        largeImage: childImageSharp {
          gatsbyImageData(
            width: 56
            height: 56
            placeholder: BLURRED
            formats: [AUTO, WEBP, AVIF]
          )
        }
        smallImage: childImageSharp {
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
      largeImage: childImageSharp {
        gatsbyImageData(
          width: 56
          height: 56
          placeholder: BLURRED
          formats: [AUTO, WEBP, AVIF]
        )
      }
      smallImage: childImageSharp {
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
      largeImage: childImageSharp {
        gatsbyImageData(
          width: 56
          height: 56
          placeholder: BLURRED
          formats: [AUTO, WEBP, AVIF]
        )
      }
      smallImage: childImageSharp {
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
      largeImage: childImageSharp {
        gatsbyImageData(
          width: 56
          height: 56
          placeholder: BLURRED
          formats: [AUTO, WEBP, AVIF]
        )
      }
      smallImage: childImageSharp {
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

export default ReleasePage;

export const Head: HeadFC<ReleasePageProps> = ({ data }) => {
  const release = data.release;
  const title = release?.slug
    ? `Units (${release.name.replace(/^\D+/g, '') ?? ''})`
    : 'Units';
  return <PageHead title={title} />;
};
