import { Link } from 'gatsby';
import React, { memo } from 'react';

type UnitBlockProps = {
  unitType: string;
  displayName: string;
  factionKey?: string;
};

const UnitBlock: React.FC<UnitBlockProps> = memo(function UnitBlock({
  unitType,
  displayName,
  factionKey,
}: {
  unitType: string;
  displayName: string;
  factionKey?: string;
}) {
  return (
    <span className="block">
      <Link to={unitType} state={{ faction: factionKey }}>
        {displayName}
      </Link>{' '}
    </span>
  );
});

export default UnitBlock;
