import { useLocation } from '@reach/router';
import { graphql, useStaticQuery } from 'gatsby';
import { useEffect, useState } from 'react';

const parsedTagsQuery = graphql`
  query {
    allRelease {
      nodes {
        name
        slug
      }
    }
  }
`;

export function useReleaseSlug() {
  const parsedTagsResponse = useStaticQuery(parsedTagsQuery);
  const parsedTags: { key: string; display: string }[] =
    parsedTagsResponse.allRelease.nodes.map((x: any) => {
      return { key: x.slug, display: `${x.name.replace(/^\D+/, '')}` };
    });
  const tagsReversed = parsedTags.toReversed();
  if (tagsReversed.length > 0) tagsReversed.at(0)!.key = '';
  const optionKeys = new Set(tagsReversed.map((tag) => tag.key));

  const location = typeof window !== 'undefined' ? useLocation() : null;
  const [currentReleaseSlug, setCurrentReleaseSlug] = useState<string>(
    tagsReversed[0]?.key ?? '',
  );
  const [currentReleaseDisplay, setCurrentReleaseDisplay] = useState<string>(
    tagsReversed[0]?.display ?? '',
  );
  const [currentUnitSlug, setCurrentUnitSlug] = useState<string>('');

  useEffect(() => {
    if (!location) return;
    const path = location.pathname ?? '';
    const releaseAndUnitSlug = path.startsWith('/')
      ? path.slice(1).split('/', 2)
      : path;
    const releaseSlug = releaseAndUnitSlug.at(0) ?? '';
    const firstSlugIsRelease = optionKeys.has(releaseSlug);
    const releaseValue = firstSlugIsRelease
      ? releaseSlug
      : (tagsReversed[0]?.key ?? '');
    setCurrentReleaseSlug(releaseValue);
    setCurrentReleaseDisplay(
      parsedTags.filter((tag) => tag.key === releaseValue)[0].display,
    );

    const unitSlug = firstSlugIsRelease
      ? (releaseAndUnitSlug.at(1) ?? '')
      : (releaseAndUnitSlug.at(0) ?? '');
    setCurrentUnitSlug(unitSlug);
  }, [location]);

  return {
    currentReleaseSlug,
    currentReleaseDisplay,
    setCurrentReleaseSlug,
    tags: tagsReversed,
    currentUnitSlug,
  };
}
