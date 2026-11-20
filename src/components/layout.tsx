import { Link, navigate } from 'gatsby';
import { StaticImage } from 'gatsby-plugin-image';
import React, { ReactNode, useEffect } from 'react';
import { useReleaseSlug } from '../hooks/useReleaseSlug';
import { useSiteMetadata } from '../hooks/useSiteMetadata';

const thisYear = new Date().getFullYear();

type LayoutProps = {
  children: ReactNode;
};
const Layout = ({ children }: LayoutProps) => {
  const { currentReleaseSlug, setCurrentReleaseSlug, tags, currentUnitSlug } =
    useReleaseSlug();

  const [atTop, setAtTop] = React.useState<boolean>(true);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY > 100);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const { modAuthors, copyrightFrom } = useSiteMetadata();

  return (
    <div
      className="mx-auto mb-[1.5%] w-fit max-w-450 sm:px-[5%] md:w-[95.2%] 2xl:px-0"
      id="top"
    >
      <div className="flex w-full justify-center">
        <a
          href="#content"
          className="absolute z-2 -translate-y-12500 rounded border border-white bg-black text-white transition-transform focus:translate-y-0 focus:p-2"
        >
          Skip to content
        </a>
      </div>
      <header className="sticky top-0 z-1 mx-2 md:mx-0">
        <div className="font-cinzel bg-tyrian-purple flex h-25 w-full items-center justify-between gap-x-4 px-[1%] pt-4 pb-1 text-[#fcd97b]">
          <Link
            to="/"
            className="inline-flex items-center no-underline"
            rel="canonical"
          >
            <div className="me-1 hidden h-12.5 w-12.5 md:inline">
              <StaticImage
                src="../images/ris_small.png"
                alt="RTR: Imperium Surrectum logo"
                placeholder="blurred"
                width={50}
                height={50}
                className="me-2 mb-2 md:mb-4"
              />
            </div>
            <h1
              className="inline text-[20px] sm:text-3xl md:mb-4 xl:text-4xl"
              style={{ marginBottom: 0 }}
            >
              <span className="">Unit&nbsp;Browser&nbsp;for&nbsp;</span>
              <span className="block xl:inline">RTR:&nbsp;Imperium&nbsp;Surrectum</span>
            </h1>
          </Link>
          <a
            href="#top"
            className="max-w-[20%] text-[16px] sm:max-w-20 md:max-w-[unset] md:text-[18px]"
            hidden={!atTop}
          >
            ↑ Back to top
          </a>
        </div>
        <div className="flex flex-wrap justify-between bg-[url(../images/menu_marble_frame.jpg)] px-[1%] pt-3.25">
          <div className="flex items-end">
            <button
              onClick={() => navigate(-1)}
              className={`${!currentUnitSlug && 'hidden'} cursor-pointer underline`}
            >
              ↩ Go Back
            </button>
          </div>
          <div className="inline-block text-end text-lg">
            <label htmlFor="release_selector" className="font-bold">
              Mod Version:{' '}
            </label>
            <select
              name="release_selector"
              id="release_selector"
              className="font-bold"
              value={currentReleaseSlug}
              onChange={(e) => {
                const v = e.target.value;
                setCurrentReleaseSlug(v);
                navigate(`/${v}`);
              }}
            >
              {tags.map((tag) => (
                <option key={tag.key} value={tag.key} className="font-normal">
                  {tag.display}
                </option>
              ))}
            </select>
          </div>
          <hr className="mt-2 w-full" />
        </div>
      </header>
      <main
        className="mx-2 min-h-100 min-w-90 bg-[url(../images/menu_marble_frame.jpg)] bg-position-[left_top_-50px] px-[1%] pt-3 pb-1.25 md:mx-0"
        id="content"
      >
        {children}
      </main>
      <footer className="pt-4 text-center text-xs text-[#fcd97b]">
        <p>
          Copyright © {copyrightFrom}&ndash;{thisYear} {modAuthors} | All Rights
          Reserved.
        </p>
        <p>
          Website template created by <a href="https://www.jorellaf.com">jorellaf</a>{' '}
          for RTR: Imperium Surrectum.{' '}
          <a href="https://github.com/jorellaf/ris-unit-browser">See code on Github</a>.
        </p>
      </footer>
    </div>
  );
};

export default Layout;
