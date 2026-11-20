import { IGatsbyImageData } from 'gatsby-plugin-image';

export type FactionData = {
  display_name?: string;
  dictionary_string: string;
  primary_colour: [number, number, number];
  faction_symbol: {
    local_file_path: string;
  };
};

export type ExtendedFactionData = {
  largeImage: IGatsbyImageData;
  smallImage: IGatsbyImageData;
  faction_key: string;
  display_name: string;
  primary_colour: {
    R: string;
    G: string;
    B: string;
  };
  faction_symbol: {
    local_file_path: string;
  };
};
