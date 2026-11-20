import { graphql, useStaticQuery } from 'gatsby';

export const useSiteMetadata = () => {
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
          description
          siteUrl
          siteAuthor
          modAuthors
          copyrightFrom
        }
      }
    }
  `);

  return data.site.siteMetadata;
};
