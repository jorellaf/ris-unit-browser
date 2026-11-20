import React, { memo } from 'react';
import { CategoryStrings, ClassStrings } from '../../types/unitTypes';

type UnitFiltersProps = {
  unitNameFilter: string;
  unitFactionFilter: string;
  unitCategoryFilter: string;
  unitClassFilter: string;
  onUnitNameFilterChange: (
    event?: React.ChangeEvent<HTMLInputElement>,
    clear?: boolean,
  ) => void;
  onUnitNameFilterEnter: (event?: React.KeyboardEvent<HTMLInputElement>) => void;
  onUnitFactionFilterChange: (
    event?: React.ChangeEvent<HTMLSelectElement>,
    clear?: boolean,
  ) => void;
  onUnitCategoryFilterChange: (
    event?: React.ChangeEvent<HTMLSelectElement>,
    clear?: boolean,
  ) => void;
  onUnitClassFilterChange: (
    event?: React.ChangeEvent<HTMLSelectElement>,
    clear?: boolean,
  ) => void;
  factionDisplays: { faction_key: string; display_name: string }[];
};
const UnitFilters: React.FC<UnitFiltersProps> = memo(function UnitFilters({
  unitNameFilter,
  unitFactionFilter,
  unitCategoryFilter,
  unitClassFilter,
  onUnitNameFilterChange,
  onUnitNameFilterEnter,
  onUnitFactionFilterChange,
  onUnitCategoryFilterChange,
  onUnitClassFilterChange,
  factionDisplays,
}) {
  return (
    <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-2 pb-3 *:flex *:grow *:flex-wrap *:items-center 2xl:gap-x-6 [&_input]:grow lg:[&_input]:grow-0 [&_select]:grow lg:[&_select]:grow-0">
      <div>
        <label
          htmlFor="filter-unit-name"
          className="inline-block min-w-40 md:max-lg:min-w-66"
        >
          Filter by unit name:
        </label>
        <span className="flex grow items-center whitespace-nowrap">
          <input
            type="search"
            id="filter-unit-name"
            onChange={onUnitNameFilterChange}
            value={unitNameFilter}
            onKeyDown={onUnitNameFilterEnter}
            className="ease mx-1 min-w-65 rounded-md border border-taupe-200 bg-white/90 px-2 py-1 text-sm text-taupe-700 shadow-sm transition duration-300 placeholder:text-taupe-400 hover:border-taupe-500 focus:border-taupe-600 focus:bg-white focus:shadow"
          />
          <span className="ms-0.5 inline-block w-6 [-webkit]:hidden">
            {unitNameFilter ? (
              <button
                onClick={() => onUnitNameFilterChange(undefined, true)}
                className="cursor-pointer text-amber-800"
                title="Remove unit name filter"
                aria-label="Remove unit name filter"
              >
                ✖
              </button>
            ) : (
              <>&nbsp;</>
            )}
          </span>
        </span>
      </div>
      <div>
        <label
          htmlFor="category-select"
          className="inline-block min-w-40 md:max-lg:min-w-66"
        >
          Filter by category:
        </label>
        <span className="flex grow items-center whitespace-nowrap">
          <select
            className="ease mx-1 min-w-65 rounded-md border border-taupe-200 bg-white/90 px-2 py-1 text-sm text-taupe-700 shadow-sm transition duration-300 hover:border-taupe-500 focus:border-taupe-600 focus:bg-white focus:shadow"
            id="category-select"
            onChange={onUnitCategoryFilterChange}
            value={unitCategoryFilter}
          >
            <option value="">All unit categories</option>
            {Object.entries(CategoryStrings).map(([unitCategory, categoryString]) => {
              return (
                <option key={`option-${unitCategory}`} value={unitCategory}>
                  {categoryString}
                </option>
              );
            })}
          </select>
          <span className="ms-0.5 inline-block w-6 [:not(:not(-webkit))]:hidden">
            {unitCategoryFilter && (
              <button
                onClick={() => onUnitCategoryFilterChange(undefined, true)}
                className="cursor-pointer text-amber-800"
                title="Remove unit category filter"
                aria-label="Remove unit category filter"
              >
                ✖
              </button>
            )}
          </span>
        </span>
      </div>
      <div>
        <label
          htmlFor="class-select"
          className="inline-block min-w-40 md:max-lg:min-w-66"
        >
          Filter by class:
        </label>
        <span className="flex grow items-center whitespace-nowrap">
          <select
            className="ease mx-1 min-w-65 rounded-md border border-taupe-200 bg-white/90 px-2 py-1 text-sm text-taupe-700 shadow-sm transition duration-300 hover:border-taupe-500 focus:border-taupe-600 focus:bg-white focus:shadow"
            id="class-select"
            onChange={onUnitClassFilterChange}
            value={unitClassFilter}
          >
            <option value="">All unit classes</option>
            {Object.entries(ClassStrings).map(([unitClass, classString]) => {
              return (
                <option key={`option-${unitClass}`} value={unitClass}>
                  {classString}
                </option>
              );
            })}
          </select>
          <span className="ms-0.5 inline-block w-6 [:not(:not(-webkit))]:hidden">
            {unitClassFilter && (
              <button
                onClick={() => onUnitClassFilterChange(undefined, true)}
                className="cursor-pointer text-amber-800"
                title="Remove unit class filter"
                aria-label="Remove unit class filter"
              >
                ✖
              </button>
            )}
          </span>
        </span>
      </div>
      <div>
        <label
          htmlFor="faction-select"
          className="inline-block min-w-40 md:max-lg:min-w-66"
        >
          Filter by ownership:
        </label>
        <span className="flex grow items-center whitespace-nowrap">
          <select
            className="ease mx-1 min-w-65 rounded-md border border-taupe-200 bg-white/90 px-2 py-1 text-sm text-taupe-700 shadow-sm transition duration-300 hover:border-taupe-500 focus:border-taupe-600 focus:bg-white focus:shadow"
            id="faction-select"
            onChange={onUnitFactionFilterChange}
            value={unitFactionFilter}
          >
            <option value="">All factions</option>
            {factionDisplays.map((faction) => (
              <option key={`option-${faction.faction_key}`} value={faction.faction_key}>
                {faction.display_name}
              </option>
            ))}
          </select>
          <span className="ms-0.5 inline-block w-6 [:not(:not(-webkit))]:hidden">
            {unitFactionFilter && (
              <button
                onClick={() => onUnitFactionFilterChange(undefined, true)}
                className="cursor-pointer text-amber-800"
                title="Remove unit faction filter"
                aria-label="Remove unit faction filter"
              >
                ✖
              </button>
            )}
          </span>
        </span>
      </div>
    </div>
  );
});

export default UnitFilters;
