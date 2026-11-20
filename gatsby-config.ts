import type { GatsbyConfig } from 'gatsby';

const config: GatsbyConfig = {
  siteMetadata: {
    title: `Unit Browser for ${process.env.MOD_NAME}`,
    description: `Unit browser page for ${process.env.MOD_DESCRIPTION}.`,
    siteUrl: `${process.env.SITE_URL}`,
    siteAuthor: process.env.SITE_AUTHOR,
    modAuthors:
      process.env.MOD_AUTHORS,
    copyrightFrom: process.env.COPYRIGHT_FROM,
  },
  // More easily incorporate content into your pages through automatic TypeScript type generation and better GraphQL IntelliSense.
  // If you use VSCode you can also use the GraphQL plugin
  // Learn more at: https://gatsby.dev/graphql-typegen
  graphqlTypegen: true,
  plugins: [
    'gatsby-plugin-postcss',
    'gatsby-plugin-image',
    'gatsby-plugin-sharp',
    'gatsby-transformer-sharp',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: `json_units`,
        path: `${__dirname}/src/json/units`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: `json_factions`,
        path: `${__dirname}/src/json/factions`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: `faction_symbols`,
        path: `${__dirname}/src/images/faction_symbols`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: `unit_cards`,
        path: `${__dirname}/src/images/unit_cards`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: `unit_info_cards`,
        path: `${__dirname}/src/images/unit_info_cards`,
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'RTR: Imperium Surrectum',
        short_name: 'RTR: Imperium Surrectum',
        start_url: '/',
        background_color: '#67033d',
        theme_color: '#67033d',
        display: 'standalone',
        icon: 'src/images/icon.png',
        crossOrigin: `use-credentials`,
      },
    },
  ],
};

export default config;
