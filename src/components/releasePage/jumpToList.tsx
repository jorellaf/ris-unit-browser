import { GatsbyImage, IGatsbyImageData } from 'gatsby-plugin-image';
import React, { memo, useCallback, useState } from 'react';

type Item = { key: string; label: string; smallImage?: IGatsbyImageData };

type ImageItemProps = { label: string; smallImage?: IGatsbyImageData };
const ImageItem: React.FC<ImageItemProps> = memo(function ImageItem({
  label,
  smallImage,
}) {
  if (!smallImage) return null;
  return (
    <div className="h-4.5 w-4.5 shrink-0 grow-0" aria-hidden="true">
      <GatsbyImage
        image={smallImage}
        alt={label}
        className="h-4.5 w-4.5"
        loading="lazy"
      />
    </div>
  );
});

type FactionListProps = {
  items: readonly Item[];
  factionKeysWithUnits?: readonly string[];
  jumpToDivRef: React.MutableRefObject<HTMLDivElement | null>;
};
const FactionList: React.FC<FactionListProps> = memo(function FactionList({
  items,
  factionKeysWithUnits,
  jumpToDivRef,
}) {
  const [showJumpTo, setShowJumpTo] = useState(true);

  const hideAndScroll = useCallback(() => {
    const element = jumpToDivRef.current;
    if (!element) {
      setShowJumpTo(false);
      return;
    }
    const rect = element.getBoundingClientRect();

    const stickyHeaderHeight = 150;
    const jumpToDivHeight = 96;
    const rectTop = rect.top - stickyHeaderHeight;
    const rectHeight = Math.max(0, rect.height - jumpToDivHeight);
    const scrollAmount = Math.min(rectHeight, window.scrollY);

    setShowJumpTo(false);

    if (rectTop <= 0 && scrollAmount > 0) {
      requestAnimationFrame(() => {
        window.scrollBy({ top: -scrollAmount, behavior: 'auto' });
      });
    }
  }, []);

  const onShowJumpTo = useCallback(() => {
    setShowJumpTo(true);
    requestAnimationFrame(() => jumpToDivRef.current?.querySelector('a')?.focus());
  }, [setShowJumpTo]);

  const onHideJumpTo = useCallback(hideAndScroll, [hideAndScroll]);
  return (
    <div ref={jumpToDivRef}>
      {showJumpTo && (
        <button
          className="mb-1 block cursor-pointer leading-6 underline xl:hidden"
          onClick={onHideJumpTo}
          aria-expanded={showJumpTo}
          aria-controls="jump-to-factions"
        >
          Hide list of factions
        </button>
      )}
      <span className="leading-6">Jump to:&nbsp;</span>
      {!showJumpTo && (
        <button
          className="cursor-pointer underline xl:hidden"
          onClick={onShowJumpTo}
          aria-expanded={showJumpTo}
          aria-controls="jump-to-factions"
        >
          Show list of factions
        </button>
      )}
      <nav
        className={`${!showJumpTo ? 'hidden' : 'inline'} xl:inline`}
        role="region"
        id="jump-to-factions"
      >
        <ul className="inline">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            const visible =
              !factionKeysWithUnits || factionKeysWithUnits.includes(item.key);
            return (
              <span
                key={`faction-jump-to-${item.key}`}
                className={`${visible ? '' : 'hidden'} align-top leading-6 whitespace-break-spaces`}
                aria-hidden={!visible}
              >
                <span className="whitespace-nowrap">
                  <li className="inline">
                    <a
                      href={`#${item.key}`}
                      className="inline-flex h-4.25 items-center gap-x-0.5 align-middle whitespace-nowrap"
                    >
                      <ImageItem label={item.label} smallImage={item.smallImage} />
                      {item.label}
                    </a>
                  </li>
                  {!isLast && <>&nbsp;|</>}
                </span>
                {!isLast && ' '}
              </span>
            );
          })}
        </ul>
      </nav>
      {showJumpTo && (factionKeysWithUnits?.length ?? 0) > 10 && (
        <button
          className="mt-2 block cursor-pointer leading-6 underline xl:hidden"
          onClick={onHideJumpTo}
          aria-expanded={showJumpTo}
          aria-controls="jump-to-factions"
        >
          Hide list of factions
        </button>
      )}
    </div>
  );
});

type LetterListProps = { items: readonly Item[] };
const LetterList: React.FC<LetterListProps> = memo(function LetterList({ items }) {
  return (
    <>
      <span className="leading-6">Jump to:&nbsp;</span>
      <nav aria-label="Jump to letters" className="inline ps-0.5">
        <ul className="inline">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <li key={`letter-jump-to-${item.key}`} className="inline">
                <a href={`#${item.key}`} className="leading-6 whitespace-nowrap">
                  {item.label}
                </a>
                {!isLast && <>&nbsp;&nbsp;|{'  '}</>}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
});

type JumpToListProps = {
  byFaction: boolean;
  items: readonly Item[];
  factionKeysWithUnits?: readonly string[];
  onToggleSplit: () => void;
  jumpToDivRef: React.MutableRefObject<HTMLDivElement | null>;
};
const JumpToList: React.FC<JumpToListProps> = memo(function JumpToList({
  byFaction,
  items,
  factionKeysWithUnits,
  onToggleSplit,
  jumpToDivRef,
}) {
  const splitByButton = (
    <div className="pt-2 pb-4 text-sm">
      <button
        className="cursor-pointer rounded-md border bg-taupe-200/80 px-1.5 py-0.5 shadow-md transition-all hover:bg-taupe-400/80 hover:shadow-lg focus:bg-taupe-400/90 focus:shadow-none active:bg-taupe-400 active:shadow-sm"
        onClick={onToggleSplit}
      >
        {byFaction
          ? 'Split units by first letter of name'
          : 'Split units by faction ownership'}
      </button>
    </div>
  );

  if (
    !items ||
    !items.length ||
    (factionKeysWithUnits && !factionKeysWithUnits.length)
  ) {
    return (
      <div>
        {splitByButton}
        <hr className="mb-2" />
        <div className="text-justify text-xs">
          <span className="leading-6">Jump to:&nbsp;N/A</span>
          <hr className="my-3" />
        </div>
      </div>
    );
  }

  return (
    <>
      {splitByButton}
      <hr className="mb-2" />
      <div className="text-justify text-xs">
        {byFaction ? (
          <FactionList
            items={items}
            factionKeysWithUnits={factionKeysWithUnits}
            jumpToDivRef={jumpToDivRef}
          />
        ) : (
          <LetterList items={items} />
        )}
        <hr className="my-3" />
      </div>
    </>
  );
});

export default JumpToList;
