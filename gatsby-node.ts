import crypto from 'crypto';
import fs from 'fs';
import type { GatsbyNode, SourceNodesArgs } from 'gatsby';
import path from 'path';
import { FactionData } from './src/types/factionTypes';
import { UnitDataJson } from './src/types/unitTypes';

type FactionsJson = Record<string, FactionData>;
type UnitsDataJson = Record<string, UnitDataJson>;

const makeContentDigest = (obj: any) =>
  crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex');

const tagToSlug = (tag: string) =>
  tag
    .replaceAll(/[_ -.]+/g, '-')
    .replace(/^\D+/g, '')
    .toLowerCase();

export const sourceNodes: GatsbyNode['sourceNodes'] = async (args: SourceNodesArgs) => {
  const { actions, getNodesByType, createNodeId, reporter } = args;
  const { createNode } = actions;

  const fileNodes = getNodesByType('File') as readonly any[];

  let releases: string[] = [];

  for (const fileNode of fileNodes) {
    if (!fileNode.absolutePath || !fileNode.name) continue;

    if (fileNode.extension !== 'json' && fileNode.name !== 'parsed_tags') continue;
    else if (fileNode.name === 'parsed_tags') {
      try {
        const raw = fs.readFileSync(fileNode.absolutePath, 'utf8');
        releases = raw.split(/\r?\n/).filter(Boolean);

        for (const r of releases) {
          const name = r;
          const slug = tagToSlug(r);
          const data = { name, slug };

          const nodeId = createNodeId(`Release-${slug}`);
          createNode({
            id: nodeId,
            parent: null,
            children: [],
            name,
            slug,
            internal: {
              type: 'Release',
              content: JSON.stringify(data),
              contentDigest: makeContentDigest(data),
            },
          } as any);
        }
      } catch (err) {
        reporter.warn(`Failed to read parsed_tags: ${(err as Error).message}`);
      }
    } else if (fileNode.sourceInstanceName === 'json_units') {
      let raw: string;
      try {
        raw = fs.readFileSync(fileNode.absolutePath, 'utf8');
      } catch (err) {
        reporter.warn(
          `sourceNodes: failed to read ${fileNode.absolutePath}: ${(err as Error).message}`,
        );
        continue;
      }

      let json: UnitsDataJson;
      try {
        json = JSON.parse(raw);
      } catch (err) {
        reporter.warn(
          `sourceNodes: invalid JSON in ${fileNode.absolutePath}: ${(err as Error).message}`,
        );
        continue;
      }

      const release = fileNode.name;

      for (const [unit_type, value] of Object.entries(json)) {
        const nodeMetadata = {
          unit_type: unit_type,
          display_name: value.display_name ?? unit_type,
          ownership: value.ownership ?? [],
          category: value.category,
          unit_class: value.unit_class,
          release,
        };

        const idSource = `${fileNode.id}::${release}::${unit_type}`;
        const nodeId = createNodeId(
          `UnitMetadata-${crypto.createHash('md5').update(idSource).digest('hex')}`,
        );

        const node = {
          id: nodeId,
          parent: fileNode.id,
          children: [],
          ...nodeMetadata,
          internal: {
            type: 'UnitMetadata',
            contentDigest: makeContentDigest(nodeMetadata),
          },
        };

        createNode(node as any);

        const nodeData = {
          release: release,
          unit_type: unit_type,
          dictionary: value.dictionary,
          category: value.category,
          unit_class: value.unit_class,
          soldier_data: value.soldier_data,
          mount_effect: value.mount_effect,
          attributes: value.attributes,
          formation: value.formation,
          health: value.health,
          primary_weapon: value.primary_weapon,
          primary_weapon_attributes: value.primary_weapon_attributes,
          secondary_weapon: value.secondary_weapon,
          secondary_weapon_attributes: value.secondary_weapon_attributes,
          primary_armour: value.primary_armour,
          secondary_armour: value.secondary_armour,
          heat_modifier: value.heat_modifier,
          ground_modifiers: value.ground_modifiers,
          mental_modifiers: value.mental_modifiers,
          charge_distance: value.charge_distance,
          fire_delay: value.fire_delay,
          cost: value.cost,
          recruitment_priority_offset: value.recruitment_priority_offset,
          ownership: value.ownership,
          display_name: value.display_name ?? unit_type,
          short_description: value.short_description,
          long_description: value.long_description,
          unit_card_data: {
            entries: Object.entries(value.unit_card_data ?? {}).map(
              ([faction, unitCardData]) => ({
                faction,
                ...unitCardData,
              }),
            ),
          },
          unit_info_card_data: {
            entries: Object.entries(value.unit_info_card_data ?? {}).map(
              ([faction, unitInfoCardData]) => ({
                faction,
                ...unitInfoCardData,
              }),
            ),
          },
        };

        const dataIdSource = `${fileNode.id}::${release}::${unit_type}::data`;
        const dataNodeId = createNodeId(
          `UnitData-${crypto.createHash('md5').update(dataIdSource).digest('hex')}`,
        );

        const dataNode = {
          id: dataNodeId,
          parent: fileNode.id,
          children: [],
          ...nodeData,
          internal: {
            type: 'UnitData',
            contentDigest: makeContentDigest(nodeData),
          },
        };

        createNode(dataNode as any);
      }
    } else if (fileNode.sourceInstanceName === 'json_factions') {
      let raw: string;
      try {
        raw = fs.readFileSync(fileNode.absolutePath, 'utf8');
      } catch (err) {
        reporter.warn(
          `sourceNodes: failed to read ${fileNode.absolutePath}: ${(err as Error).message}`,
        );
        continue;
      }

      let json: FactionsJson;
      try {
        json = JSON.parse(raw);
      } catch (err) {
        reporter.warn(
          `sourceNodes: invalid JSON in ${fileNode.absolutePath}: ${(err as Error).message}`,
        );
        continue;
      }

      const release = fileNode.name;

      for (const [faction_key, value] of Object.entries(json)) {
        const nodeData = {
          faction_key: faction_key,
          display_name: value?.display_name ?? faction_key,
          primary_colour: {
            R: value?.primary_colour[0],
            G: value?.primary_colour[1],
            B: value?.primary_colour[2],
          },
          faction_symbol: value?.faction_symbol,
          release,
        };

        const idSource = `${fileNode.id}::${release}::${faction_key}`;
        const nodeId = createNodeId(
          `Faction-${crypto.createHash('md5').update(idSource).digest('hex')}`,
        );

        const node = {
          id: nodeId,
          parent: fileNode.id,
          children: [],
          ...nodeData,
          internal: {
            type: 'Faction',
            contentDigest: makeContentDigest(nodeData),
          },
        };

        createNode(node as any);
      }
    }
  }
};

export const createSchemaCustomization: GatsbyNode['createSchemaCustomization'] = ({
  actions,
}) => {
  const { createTypes } = actions;
  createTypes(`
    type Release
      implements Node {
      name: String!
      slug: String!
    }
    type UnitMetadata implements Node {
      unit_type: String!
      display_name: String!
      ownership: [String!]!
      category: String!
      class: String!
      release: String!
    }

    type FactionColour {
      R: Int!
      G: Int!
      B: Int!
    }

    type FactionSymbol {
      local_file_path: String!
      remote_file_path: String
      remote_file_tag: String
      last_commit_id: String
    }

    type Faction implements Node {
      faction_key: String!
      display_name: String!
      primary_colour: FactionColour!
      faction_symbol: FactionSymbol!
      release: String!
    }

    type SoldierData {
      number_of_soldiers: Int!
      extras: Int
      mass: Float!
    }

    type MountEffectData {
      mount: String!
      effect: Int!
    }

    type Formation {
      close_horizontal_spacing: Float!
      close_vertical_spacing: Float!
      loose_horizontal_spacing: Float!
      loose_vertical_spacing: Float!
      number_of_ranks: Int!
      formations: [String!]!
    }

    type Health {
      hp: Int!
      hp_extra: Int
    }

    type Weapon {
      attack: Int!
      charge: Int!
      missile_type: String!
      missile_range: Int!
      missile_ammo: Int!
      weapon_type: String!
      weapon_tech: String!
      min_delay: Int!
      lethality: Float!
    }

    type Armour {
      armour: Int!
      defence_skill: Int!
      shield: Int
    }

    type GroundModifiers {
      scrub_modifier: Float!
      sand_modifier: Float!
      forest_modifier: Float!
      snow_modifier: Float!
    }

    type MentalModifiers {
      morale: Int!
      discipline: String!
      training: String!
    }

    type Cost {
      turns: Int!
      recruit: Int!
      upkeep: Int!
      weapon_upgrade: Int!
      armour_upgrade: Int!
      custom_battle_cost: Int!
    }

    type UnitCardEntry {
      faction: String!
      local_file_path: String!
      remote_file_path: String
      remote_file_tag: String
      last_commit_id: String
    }

    type UnitCardData {
      entries: [UnitCardEntry!]!
    }

    type UnitData implements Node {
      release: String!
      unit_type: String!
      dictionary: String!
      category: String!
      unit_class: String!
      soldier_data: SoldierData!
      mount_effect: [MountEffectData]
      attributes: [String!]!
      formation: Formation!
      health: Health!
      primary_weapon: Weapon!
      primary_weapon_attributes: [String!]
      secondary_weapon: Weapon!
      secondary_weapon_attributes: [String!]
      primary_armour: Armour!
      secondary_armour: Armour!
      heat_modifier: Float!
      ground_modifiers: GroundModifiers!
      mental_modifiers: MentalModifiers!
      charge_distance: Int!
      fire_delay: Int!
      cost: Cost!
      recruitment_priority_offset: Int
      ownership: [String!]!
      display_name: String
      short_description: String
      long_description: String
      unit_card_data: UnitCardData
      unit_info_card_data: UnitCardData
    }
  `);
};

export const createPages: GatsbyNode['createPages'] = async ({ graphql, actions }) => {
  const { createPage } = actions;
  const allReleases = await graphql<{
    allRelease: { nodes: { slug: string; name: string }[] };
    allFaction: {
      nodes: { release: string; faction_symbol: { local_file_path: string } }[];
    };
  }>(`
    query AllReleasesData {
      allRelease {
        nodes {
          slug
          name
        }
      }
      allFaction {
        nodes {
          release
          faction_symbol {
            local_file_path
          }
        }
      }
    }
  `);

  if (allReleases.errors) throw allReleases.errors;
  const releaseTemplate = path.resolve(__dirname, 'src/templates/releasePage.tsx');

  const releaseNodes = allReleases.data!.allRelease.nodes;

  const allFactions = allReleases.data!.allFaction.nodes.map((faction) => faction);

  const lastIndex = releaseNodes.length - 1;

  releaseNodes.forEach((node, idx) => {
    const factionSymbolPaths = allFactions
      .filter((faction) => faction.release === node.name)
      .map((faction) => faction.faction_symbol.local_file_path);
    const last = idx === lastIndex;
    createPage({
      path: last ? '/' : `/${node.slug}/`,
      component: releaseTemplate,
      context: {
        slug: node.slug,
        name: node.name,
        factionSymbolPaths: factionSymbolPaths,
      },
    });
  });

  const last = releaseNodes.at(-1);

  const allUnits = await graphql<{
    allUnitData: {
      nodes: {
        release: string;
        ownership: string[];
        unit_type: string;
        unit_card_data: { entries: { local_file_path: string }[] };
        unit_info_card_data: { entries: { local_file_path: string }[] };
      }[];
    };
    allFaction: {
      nodes: {
        release: string;
        faction_key: string;
        faction_symbol: {
          local_file_path: string;
        };
      }[];
    };
  }>(`
    query AllUnitData {
      allUnitData {
        nodes {
          release
          ownership
          unit_type
          unit_card_data {
            entries {
              local_file_path
            }
          }
          unit_info_card_data {
            entries {
              local_file_path
            }
          }
        }
      }
      allFaction {
        nodes {
          release
          faction_key
          faction_symbol {
            local_file_path
          }
        }
      }
    }
  `);

  if (allUnits.errors) throw allUnits.errors;
  const unitTemplate = path.resolve(__dirname, 'src/templates/unitDetailPage.tsx');

  const unitNodes = allUnits.data!.allUnitData.nodes;

  unitNodes.forEach((node) => {
    const unitCardPaths = node.unit_card_data.entries.map(
      (unitCard) => unitCard.local_file_path,
    );
    const unitInfoCArdPaths = node.unit_info_card_data.entries.map(
      (unitCard) => unitCard.local_file_path,
    );
    const factionSymbolPaths = node.ownership.map(
      (ownershipFaction) =>
        allUnits.data?.allFaction.nodes
          .filter(
            (faction) =>
              faction.faction_key === ownershipFaction &&
              node.release === faction.release,
          )
          .at(0)?.faction_symbol.local_file_path,
    );
    const releaseSlug =
      releaseNodes.filter((release) => release.name === node.release).at(0)?.slug ?? '';
    createPage({
      path: `/${(node.release !== last?.name && releaseNodes.find((release) => release.name === node.release)?.slug) || ''}/${node.unit_type.replaceAll(/[ -]/g, '_')}/`.replace(
        '\/\/',
        '/',
      ),
      component: unitTemplate,
      context: {
        release: node.release,
        releaseSlug: releaseSlug,
        unitType: node.unit_type,
        unitCardPaths: unitCardPaths,
        unitInfoCardPaths: unitInfoCArdPaths,
        factionSymbolPaths: factionSymbolPaths,
      },
    });
  });
};
