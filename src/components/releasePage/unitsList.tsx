import { GatsbyImage } from 'gatsby-plugin-image';
import React, { memo } from 'react';
import { ExtendedFactionData } from '../../types/factionTypes';
import { UnitDisplayInfo } from '../../types/unitTypes';
import UnitBlock from './unitBlock';

type SectionHeaderProps = {
  factionKey?: string;
  factionsById?: ReadonlyMap<string, ExtendedFactionData>;
  letter?: string;
};
const SectionHeader: React.FC<SectionHeaderProps> = memo(function SectionHeader({
  factionKey,
  factionsById,
  letter,
}) {
  if (factionKey && factionsById) {
    const faction = factionsById.get(factionKey);
    if (!faction) return null;
    return (
      <h3
        className="mb-1 flex h-14 scroll-mt-38 items-center gap-x-1"
        id={faction.faction_key}
      >
        {faction.largeImage ? (
          <GatsbyImage
            image={faction.largeImage}
            alt={faction.display_name ?? 'Faction symbol'}
            loading="lazy"
          />
        ) : null}
        {faction.display_name}
      </h3>
    );
  } else if (letter)
    return (
      <h3 id={letter} className="mb-3 scroll-mt-38">
        {letter}
      </h3>
    );
  else return null;
});

type UnitsGridProps = {
  unitKeys: readonly string[];
  unitsById: ReadonlyMap<string, UnitDisplayInfo>;
  factionKey?: string;
};
const UnitsGrid: React.FC<UnitsGridProps> = memo(function UnitsGrid({
  unitKeys,
  unitsById,
  factionKey,
}) {
  return (
    <main className="mb-8 grid gap-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {unitKeys.map((unitKey) => {
        const unit = unitsById.get(unitKey);
        if (!unit) return null;
        return (
          <UnitBlock
            unitType={unit.unit_type}
            displayName={unit.display_name}
            factionKey={factionKey}
            key={factionKey ? `${factionKey}-${unit.unit_type}` : unit.unit_type}
          />
        );
      })}
    </main>
  );
});

const NoUnitsSection: React.FC = memo(function NoUnitsSection() {
  return (
    <section className="text-xl font-semibold" aria-live="polite">
      No units found. Please try different filters.
    </section>
  );
});

type UnitsListProps = {
  unitFactionFilter?: string;
  factionsByKey: ReadonlyMap<string, ExtendedFactionData>;
  factionsKeysWithUnits: readonly string[];
  filteredUnitIdsByFaction: Map<string, string[]>;
  unitsById: ReadonlyMap<string, UnitDisplayInfo>;
  letters: readonly string[];
  filteredUnitIdsByLetter: Map<string, string[]>;
  splitByFactions: boolean;
};
const UnitsList: React.FC<UnitsListProps> = memo(function UnitsList({
  unitFactionFilter,
  factionsByKey,
  factionsKeysWithUnits,
  filteredUnitIdsByFaction,
  unitsById,
  letters,
  filteredUnitIdsByLetter,
  splitByFactions,
}) {
  const numFactionsWithUnits = factionsKeysWithUnits.length;

  if (unitFactionFilter) {
    return (
      <>
        {numFactionsWithUnits ? (
          <section>
            <SectionHeader
              factionKey={unitFactionFilter}
              factionsById={factionsByKey}
            />
            <UnitsGrid
              unitKeys={filteredUnitIdsByFaction.get(unitFactionFilter) ?? []}
              unitsById={unitsById}
              factionKey={unitFactionFilter}
            />
          </section>
        ) : (
          <NoUnitsSection />
        )}
      </>
    );
  }

  if (splitByFactions)
    return (
      <>
        {factionsKeysWithUnits.map((factionKey) => {
          const unitsForFaction = filteredUnitIdsByFaction.get(factionKey) ?? [];
          if (unitsForFaction.length) {
            return (
              <section key={`${factionKey}-units`}>
                <SectionHeader factionKey={factionKey} factionsById={factionsByKey} />
                <UnitsGrid
                  unitKeys={unitsForFaction}
                  unitsById={unitsById}
                  factionKey={factionKey}
                />
              </section>
            );
          } else return null;
        })}
        {!numFactionsWithUnits && <NoUnitsSection />}
      </>
    );

  return (
    <>
      {letters.map((letter) => (
        <section key={letter}>
          <SectionHeader letter={letter} />
          <UnitsGrid
            unitKeys={filteredUnitIdsByLetter.get(letter) ?? []}
            unitsById={unitsById}
          />
        </section>
      ))}
      {!letters.length && <NoUnitsSection />}
    </>
  );
});

export default UnitsList;
