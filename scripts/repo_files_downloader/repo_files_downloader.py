"""Entry module for the repository files to local JSON script."""  # noqa: INP001

import json
import logging
import re
from hashlib import file_digest
from io import BytesIO
from multiprocessing import Pool
from os import environ
from pathlib import Path
from sys import stdout
from typing import TYPE_CHECKING, Any, Literal, cast
from urllib import parse, request
from urllib.error import HTTPError

from custom_types import (
    accepted_attributes,
    accepted_discipline_levels,
    accepted_formations,
    accepted_training_levels,
    accepted_weapon_attributes,
    accepted_weapon_techs,
    accepted_weapon_types,
)
from PIL import Image

if TYPE_CHECKING:
    from custom_types import (
        FactionData,
        FactionSymbolDownloadPoolData,
        FactionSymbolMultiprocessPoolData,
        LocalAndRemoteFileData,
        UnitArmourData,
        UnitCardDataReturn,
        UnitCardDownloadPoolData,
        UnitCardMultiprocessingPoolData,
        UnitCostData,
        UnitData,
        UnitDisplayStrings,
        UnitFormationData,
        UnitGroundModifierData,
        UnitHealthData,
        UnitMentalData,
        UnitMountEffectData,
        UnitSoldierData,
        UnitWeaponData,
        unit_card_types,
    )

TOKEN = environ.get("PROJECT_ACCESS_TOKEN", "")
BASE_URL = environ.get("BASE_URL", "https://example.com")
BASE_URL = BASE_URL if BASE_URL[-1] != "/" else BASE_URL[:-1]
REPO_NAME = environ.get("REPO_NAME", "example-mod")
REMOTE_DATA_PATH = environ.get("REMOTE_DATA_PATH", "example/data")
REMOTE_DATA_PATH = (
    REMOTE_DATA_PATH if REMOTE_DATA_PATH[-1] != "/" else REMOTE_DATA_PATH[:-1]
)
# Because the RIS repo stored data/text files with different encoding from a specific version
# If you have issues with the encoding of the files, change this setting
ENCODING_CUTOFF = float(environ.get("ENCODING_CUTOFF", "0"))
MP_POOL_SIZE = int(environ.get("MP_POOL_SIZE", "64"))
BASE_PATH_RELATIVE = environ.get("BASE_PATH_RELATIVE", "")
BASE_PATH = (
    Path(BASE_PATH_RELATIVE).resolve()
    if BASE_PATH_RELATIVE != ""
    else Path(Path(__file__).parent.parent.parent).resolve()
)
RAW_FILES_PATH = Path(BASE_PATH / "assets" / "raw_files")
JSON_PATH = Path(BASE_PATH / "src" / "json")
IMAGES_PATH = Path(BASE_PATH / "src" / "images")

logger = logging.getLogger(f"stdout_{__name__}")
logger.addHandler(logging.StreamHandler(stdout))
logger.setLevel(logging.INFO)


def _get_repo_id() -> int:
    """Get the repository ID for the selected repository."""
    url = f"{BASE_URL}/api/v4/projects"

    req = request.Request(url)  # noqa: S310
    req.add_header("PRIVATE-TOKEN", TOKEN)

    with request.urlopen(req) as response:  # noqa: S310
        repo_id = next(
            int(x["id"]) for x in json.loads(response.read()) if x["name"] == REPO_NAME
        )
        if repo_id is not None and repo_id != []:
            return repo_id
    return 0


def _get_repo_tags() -> tuple[int, list[str]]:
    """Get the list of repository tags."""
    repo_id = _get_repo_id()

    url = f"{BASE_URL}/api/v4/projects/{repo_id}/repository/tags"

    req = request.Request(url)  # noqa: S310
    req.add_header("PRIVATE-TOKEN", TOKEN)

    with request.urlopen(req) as response:  # noqa: S310
        repo_tags = json.loads(response.read())
        return repo_id, [x["name"] for x in repo_tags][::-1]


def _is_equal_hash_and_size(
    repo_id: int,
    repo_file_path: str,
    repo_tag: str,
    local_file_path: Path,
) -> bool:
    """Check whether a remote file has the same hash and size as a local file."""
    url = (
        f"{BASE_URL}/api/v4/projects/{repo_id}/repository/files/"
        f"{parse.quote_plus(repo_file_path)}?ref={repo_tag}"
    )

    req = request.Request(url, method="HEAD")  # noqa: S310
    req.add_header("PRIVATE-TOKEN", TOKEN)

    file_hash = ""

    with request.urlopen(req) as response:  # noqa: S310
        file_hash = next(
            str(x[1])
            for x in response.getheaders()
            if x[0] == "X-Gitlab-Content-Sha256"
        )
        size_in_bytes = next(
            int(x[1]) for x in response.getheaders() if x[0] == "X-Gitlab-Size"
        )
    not_equal = False

    if local_file_path.is_file():
        with local_file_path.open(mode="rb", buffering=0) as f:
            new_file_hash = file_digest(f, "sha256").hexdigest()
            if (
                new_file_hash != file_hash
                and local_file_path.stat().st_size != size_in_bytes
            ):
                not_equal = True
    else:
        not_equal = True

    return not_equal


def _download_text_files(repo_id: int, repo_tag: str) -> None:
    """Download the text files into the raw_files folder."""
    remote_file_paths = [
        f"{REMOTE_DATA_PATH}/export_descr_unit.txt",
        f"{REMOTE_DATA_PATH}/text/export_units.txt",
        f"{REMOTE_DATA_PATH}/descr_sm_factions.txt",
        f"{REMOTE_DATA_PATH}/text/expanded_bi.txt",
        f"{REMOTE_DATA_PATH}/string_overrides/en.strings",
    ]

    save_path = Path(
        RAW_FILES_PATH / repo_tag,
    )
    save_path.mkdir(parents=True, exist_ok=True)

    for remote_file_path in remote_file_paths:
        local_file_path = Path(save_path / Path(remote_file_path).name)

        not_equal = True

        not_equal = _is_equal_hash_and_size(
            repo_id=repo_id,
            repo_file_path=remote_file_path,
            repo_tag=repo_tag,
            local_file_path=local_file_path,
        )

        if not_equal:
            url = (
                f"{BASE_URL}/api/v4/projects/{repo_id}/repository/files/"
                f"{parse.quote_plus(remote_file_path)}/raw?ref={repo_tag}"
            )

            req = request.Request(url)  # noqa: S310
            req.add_header("PRIVATE-TOKEN", TOKEN)

            with request.urlopen(req) as response:  # noqa: S310
                remote_file = response.read()

                with local_file_path.open(mode="wb") as local_file:
                    local_file.write(remote_file)


def _parse_soldier_data(raw_soldier_data: str | None) -> UnitSoldierData | None:
    soldier_data_dict: UnitSoldierData | None = None
    if raw_soldier_data:
        soldier_data = re.split(r",\s*", raw_soldier_data)
        if len(soldier_data) == 4:  # noqa: PLR2004
            soldier_data.pop(0)

        soldier_data_dict = {
            "number_of_soldiers": int(soldier_data[0]),
            "extras": int(soldier_data[1]),
            "mass": float(soldier_data[2]),
        }
    return soldier_data_dict


def _parse_mount_effect_data(
    raw_mount_effect_data: str | None,
) -> list[UnitMountEffectData]:
    mount_effect_list: list[UnitMountEffectData] = []
    if raw_mount_effect_data:
        mount_effect_data = re.split(r",\s*", raw_mount_effect_data)
        for mount_effect in mount_effect_data:
            mount_effect_split = re.split(r"\s+", mount_effect)
            if len(mount_effect_split) == 2:  # noqa: PLR2004
                mount = str(mount_effect_split[0])
                effect = int(mount_effect_split[1])
                mount_effect_list.append(
                    {
                        "mount": mount,
                        "effect": effect,
                    },
                )
    return mount_effect_list


def _parse_formation_data(raw_formation_data: str | None) -> UnitFormationData | None:
    formation_data_dict: UnitFormationData | None = None
    if raw_formation_data:
        formation_data = re.split(r",\s*", raw_formation_data)
        formation_data_dict = {
            "close_horizontal_spacing": float(formation_data[0]),
            "close_vertical_spacing": float(formation_data[1]),
            "loose_horizontal_spacing": float(formation_data[2]),
            "loose_vertical_spacing": float(formation_data[3]),
            "number_of_ranks": int(formation_data[4]),
            "formations": [
                str(x) for x in formation_data[5:] if x in accepted_formations
            ]
            if len(formation_data[5:]) > 1
            else [str(formation_data[5])]
            if formation_data[5] in accepted_formations
            else [],
        }
    return formation_data_dict


def _parse_weapon_data(raw_weapon_data: str | None) -> UnitWeaponData | None:
    weapon_data_dict: UnitWeaponData | None = None
    if raw_weapon_data:
        weapon_data = re.split(r",\s*", raw_weapon_data)
        if (
            weapon_data[5] in accepted_weapon_types
            and weapon_data[6] in accepted_weapon_techs
        ):
            weapon_data_dict = {
                "attack": int(weapon_data[0]),
                "charge": int(weapon_data[1]),
                "missile_type": weapon_data[2],
                "missile_range": int(weapon_data[3]),
                "missile_ammo": int(weapon_data[4]),
                "weapon_type": weapon_data[5],
                "weapon_tech": weapon_data[6],
                "min_delay": int(weapon_data[-2]),
                "lethality": float(weapon_data[-1]),
            }
    return weapon_data_dict


def _parse_weapon_attributes(raw_weapon_attributes: str | None) -> list[str] | None:
    weapon_attributes_list: list[str] | None = None
    if raw_weapon_attributes:
        weapon_attributes = re.split(r",\s*", raw_weapon_attributes)
        weapon_attributes_list = [
            x for x in weapon_attributes if x in accepted_weapon_attributes
        ]
    return weapon_attributes_list


def _parse_armour_data(
    raw_armour_data: str | None,
    *,
    is_secondary: bool = False,
) -> UnitArmourData | None:
    weapon_data_dict: UnitArmourData | None = None
    if raw_armour_data:
        weapon_data = re.split(r",\s*", raw_armour_data)
        weapon_data_dict = {
            "armour": int(weapon_data[0]),
            "defence_skill": int(weapon_data[1]),
        }
        if not is_secondary:
            weapon_data_dict["shield"] = int(weapon_data[2])
    return weapon_data_dict


def _parse_mental_modifiers_data(
    raw_mental_modifiers: str | None,
) -> UnitMentalData | None:
    mental_modifiers_dict: UnitMentalData | None = None
    if raw_mental_modifiers:
        mental_modifiers = re.split(r",\s*", raw_mental_modifiers)
        if (
            mental_modifiers[1] in accepted_discipline_levels
            and mental_modifiers[2] in accepted_training_levels
        ):
            mental_modifiers_dict = {
                "morale": int(mental_modifiers[0]),
                "discipline": mental_modifiers[1],
                "training": mental_modifiers[2],
            }
    return mental_modifiers_dict


def _parse_unit_data(unit_definition: str) -> UnitData | None:
    unit_dict: dict[str, Any] = {}

    def extract_unit_data(pattern: str) -> str | None:
        m = re.search(rf"^{pattern}\s+(.*)\s*", unit_definition, flags=re.MULTILINE)
        return m.group(1) if m else None

    (
        unit_dict["unit_type"],
        unit_dict["dictionary"],
        unit_dict["category"],
        unit_dict["unit_class"],
    ) = (
        extract_unit_data("type"),
        extract_unit_data("dictionary"),
        extract_unit_data("category"),
        extract_unit_data("class"),
    )

    unit_dict["soldier_data"] = _parse_soldier_data(extract_unit_data("soldiers?"))

    unit_dict["mount_effect"] = _parse_mount_effect_data(
        extract_unit_data("mount_effect"),
    )

    unit_attributes_list: list[str] | None = None
    if raw_unit_attributes := extract_unit_data("attributes"):
        unit_attributes = re.split(r",\s*", raw_unit_attributes)
        unit_attributes_list = [
            x
            for x in unit_attributes
            if x in accepted_attributes or x[:20] == "general_unit_upgrade"
        ]
    unit_dict["attributes"] = unit_attributes_list

    unit_dict["formation"] = _parse_formation_data(extract_unit_data("formation"))

    health_data_dict: UnitHealthData | None = None
    if raw_health_data := extract_unit_data("stat_health"):
        health_data = re.split(r",\s*", raw_health_data)
        health_data_dict = {"hp": int(health_data[0]), "hp_extra": int(health_data[1])}
    unit_dict["health"] = health_data_dict

    unit_dict["primary_weapon"] = _parse_weapon_data(extract_unit_data("stat_pri"))

    unit_dict["primary_weapon_attributes"] = _parse_weapon_attributes(
        extract_unit_data("stat_pri_attr"),
    )

    unit_dict["secondary_weapon"] = _parse_weapon_data(extract_unit_data("stat_sec"))

    unit_dict["secondary_weapon_attributes"] = _parse_weapon_attributes(
        extract_unit_data("stat_sec_attr"),
    )

    unit_dict["primary_armour"] = _parse_armour_data(
        extract_unit_data("stat_pri_armour"),
    )

    unit_dict["secondary_armour"] = _parse_armour_data(
        extract_unit_data("stat_sec_armour"),
        is_secondary=True,
    )

    unit_dict["heat_modifier"] = (
        int(h) if (h := extract_unit_data("stat_heat")) else None
    )

    ground_modifiers_dict: UnitGroundModifierData | None = None
    if raw_ground_modifiers := extract_unit_data("stat_ground"):
        ground_modifiers = re.split(r",\s*", raw_ground_modifiers)
        ground_modifiers_dict = {
            "scrub_modifier": int(ground_modifiers[0]),
            "sand_modifier": int(ground_modifiers[1]),
            "forest_modifier": int(ground_modifiers[2]),
            "snow_modifier": int(ground_modifiers[3]),
        }
    unit_dict["ground_modifiers"] = ground_modifiers_dict

    unit_dict["mental_modifiers"] = _parse_mental_modifiers_data(
        extract_unit_data("stat_mental"),
    )

    unit_dict["charge_distance"] = (
        int(d) if (d := extract_unit_data("stat_charge_dist")) else None
    )

    unit_dict["fire_delay"] = (
        int(d) if (d := extract_unit_data("stat_fire_delay")) else None
    )

    cost_dict: UnitCostData | None = None
    if raw_cost := extract_unit_data("stat_cost"):
        cost = re.split(r",\s*", raw_cost)
        cost_dict = {
            "turns": int(cost[0]),
            "recruit": int(cost[1]),
            "upkeep": int(cost[2]),
            "weapon_upgrade": int(cost[3]),
            "armour_upgrade": int(cost[4]),
            "custom_battle_cost": int(cost[5]),
        }
    unit_dict["cost"] = cost_dict

    unit_dict["recruitment_priority_offset"] = (
        int(d) if (d := extract_unit_data("recruit_priority_offset")) else None
    )

    ownership: list[str] | None = None
    if raw_ownership := extract_unit_data("ownership"):
        ownership = re.split(r",\s*", raw_ownership)
        if unit_attributes_list and "mercenary_unit" in unit_attributes_list:
            ownership.append("merc")
    unit_dict["ownership"] = ownership

    try:
        unit_typed_dict: UnitData = cast("UnitData", unit_dict)
    except TypeError:
        return None

    return unit_typed_dict


def _get_encoding(repo_tag: str) -> str:
    version = (
        float(x.group(1)) if (x := re.search(r"(\d+\.?\d*)\.?\d*", repo_tag)) else 0
    )
    return "utf-16-le" if version < ENCODING_CUTOFF else "utf-8"


def _clean_data_text_file(raw_text_file: str) -> str:
    return re.sub(
        r"\r",
        "",
        re.sub(r"¬.*", "", raw_text_file, flags=re.MULTILINE),
    )


def _parse_unit_display_strings(
    export_units_path: Path,
    en_strings_path: Path,
    repo_tag: str,
) -> dict[str, UnitDisplayStrings]:
    encoding = _get_encoding(repo_tag=repo_tag)
    export_units_dict: dict[str, UnitDisplayStrings] = {}
    with export_units_path.open(encoding=encoding) as export_units_file:
        export_units = _clean_data_text_file(export_units_file.read())
        unit_names = re.findall(
            r"{(.*(?<!descr)(?<!descr_short))}(.*)",
            export_units,
            flags=re.MULTILINE,
        )
        short_descriptions = re.findall(
            r"{(.*descr_short)}(.*)",
            export_units,
            flags=re.MULTILINE,
        )
        long_descriptions = re.findall(
            r"{(.*descr)}\n*((?:(?:\\n)*(?:[^\s{}]|\t| )+\n?)+)",
            export_units,
            flags=re.MULTILINE,
        )
        export_units_dict = {
            x[0]: {"display_name": x[1], "descr_short": None, "descr": None}
            for x in unit_names
        }
        export_units_dict = {
            x[0][:-12]: {
                "display_name": export_units_dict[key]["display_name"]
                if (
                    len(x) > 0
                    and isinstance(x[0], str)
                    and (key := x[0][:-12]) in export_units_dict
                )
                else None,
                "descr_short": x[1],
                "descr": None,
            }
            for x in short_descriptions
        }
        export_units_dict = {
            x[0][:-6]: {
                "display_name": export_units_dict[key]["display_name"]
                if (
                    len(x) > 0
                    and isinstance(x[0], str)
                    and (key := x[0][:-6]) in export_units_dict
                )
                else None,
                "descr_short": export_units_dict[key]["descr_short"]
                if (
                    len(x) > 0
                    and isinstance(x[0], str)
                    and (key := x[0][:-6]) in export_units_dict
                )
                else None,
                "descr": re.sub(r"(?<!\\)\n", "", x[1]),
            }
            for x in long_descriptions
        }

    with en_strings_path.open() as strings_file:
        raw_strings_file = strings_file.read()
        clean_strings = re.sub(
            r"\r",
            "",
            re.sub(
                r"^\s+$",
                "",
                raw_strings_file,
                flags=re.MULTILINE,
            ),
        )
        strings = re.findall(
            r"\"Rome\.Override\.(.*?)\"\s*=\s*\"(.*?)\";",
            clean_strings,
            flags=re.MULTILINE,
        )
        for string in strings:
            (key, string_type) = (
                (string[0][:-12], string[0][-12:])
                if string[0][-12:] == "_descr_short"
                else (string[0][:-6], string[0][-6:])
                if string[0][-6:] == "_descr"
                else (string[0], "")
            )
            if key in export_units_dict:
                match string_type:
                    case "":
                        export_units_dict[key]["display_name"] = string[1]
                    case "_descr_short":
                        export_units_dict[key]["descr_short"] = string[1]
                    case "_descr":
                        export_units_dict[key]["descr"] = string[1]
    return export_units_dict


def _get_all_units_data(
    edu_path: Path,
) -> dict[str, UnitData]:
    units_dict: dict[str, UnitData] = {}

    with Path(edu_path).open() as edu_file:
        raw_edu = edu_file.read()
        edu = re.sub(r"\r", "", re.sub(r";.*", "", raw_edu, flags=re.MULTILINE))
        unit_definitions = re.split(r"\n(?=type\s+\w)", edu)[1:]

        for unit_definition in unit_definitions:
            unit_data = _parse_unit_data(unit_definition)

            if unit_data:
                units_dict[unit_data["unit_type"]] = unit_data

    return units_dict


def _get_unit_display_strings(
    units_dict: dict[str, UnitData],
    export_units_dict: dict[str, UnitDisplayStrings],
) -> dict[str, UnitData]:
    for unit in units_dict.values():
        if (key := unit["dictionary"]) in export_units_dict:
            unit["display_name"] = export_units_dict[key]["display_name"]
            unit["short_description"] = export_units_dict[key]["descr_short"]
            unit["long_description"] = export_units_dict[key]["descr"]
    return units_dict


def clean_rr_json(text: str) -> str:
    """Return a cleaned up JSON from the non-standard RR JSONs."""
    clean_text = re.sub(r"\s*;.*\n", "\n", text, flags=re.MULTILINE)
    clean_text = (
        clean_text.replace("\n\n", "\n")
        .replace("\t", "")
        .replace(", ]", " ]")
        .replace(",\n}", "}")
    )
    clean_text = re.sub(",\t+]", "]", clean_text)
    clean_text = re.sub(", +]", "]", clean_text)
    clean_text = re.sub(",\n+]", "]", clean_text)
    return f"{{{clean_text[clean_text.find('[') + 1 : clean_text.rfind(']')]}}}"


def _parse_faction_data(
    sm_factions_path: Path,
    expanded_bi_path: Path,
    repo_tag: str,
) -> dict[str, FactionData]:
    factions_dict: dict[str, FactionData] = {}
    with sm_factions_path.open() as sm_factions_file:
        clean_sm_factions = clean_rr_json(sm_factions_file.read())
        parsed_json = json.loads(clean_sm_factions)
        factions_dict = {
            str(key).lower(): {
                "dictionary_string": str(value["string"]).upper(),
                "primary_colour": tuple(value["colours"]["primary"]),
                "secondary_colour": tuple(value["colours"]["secondary"]),
            }
            for key, value in parsed_json.items()
        }

    encoding = _get_encoding(repo_tag=repo_tag)
    with expanded_bi_path.open(encoding=encoding) as expanded_bi_file:
        expanded_bi = _clean_data_text_file(expanded_bi_file.read())
        expanded_bi_dict = {
            str(x[0]).upper(): x[1]
            for x in re.findall(r"{(.*?)}\s*(.*)\n", expanded_bi, flags=re.MULTILINE)
        }

    for key, faction in factions_dict.items():
        if (key := faction["dictionary_string"]) in expanded_bi_dict:
            faction["display_name"] = expanded_bi_dict[key]
            if (
                (number_suffix := re.search(r".*(_?(\d+))$", key))
                and number_suffix.group(
                    2,
                )
                and (
                    f"{str(faction['display_name']).lower().replace(' ', '_')}"
                    f"{number_suffix.group(1)}"
                )
                == key
            ):
                faction["display_name"] = (
                    f"{faction['display_name']} {number_suffix.group(2)}"
                )

    return factions_dict


def _get_faction_symbol_paths(
    faction_data: FactionSymbolMultiprocessPoolData,
) -> tuple[str, LocalAndRemoteFileData]:
    (faction, repo_data) = (faction_data["faction"], faction_data["repo_data"])
    repo_id, repo_tag = repo_data

    local_symbol_path = Path(
        IMAGES_PATH / "faction_symbols" / "missing_symbol.png",
    )
    faction_symbol_data: LocalAndRemoteFileData = {
        "local_file_path": str(local_symbol_path.absolute()),
    }

    remote_symbol_path = (
        f"{REMOTE_DATA_PATH}/menu/symbols/fe_buttons_feral/symbol128_{faction}.tga"
    )
    url = (
        f"{BASE_URL}/api/v4/projects/{repo_id}/repository/files/"
        f"{parse.quote_plus(remote_symbol_path)}?ref={repo_tag}"
    )

    req = request.Request(url, method="HEAD")  # noqa: S310
    req.add_header("PRIVATE-TOKEN", TOKEN)

    try:
        with request.urlopen(req) as response:  # noqa: S310
            last_commit_id = next(
                x[1] for x in response.getheaders() if x[0] == "X-Gitlab-Last-Commit-Id"
            )
            local_symbol_path = Path(
                IMAGES_PATH / "faction_symbols" / repo_tag / f"{faction}.png",
            )
            faction_symbol_data = {
                "local_file_path": str(local_symbol_path.absolute()),
                "remote_file_path": remote_symbol_path,
                "remote_file_tag": repo_tag,
                "last_commit_id": last_commit_id,
            }

    except HTTPError as e:
        if e.code == 404:  # noqa: PLR2004
            pass
    return (faction, faction_symbol_data)


def _get_unit_card_paths(
    dictionary: str,
    repo_data: tuple[int, str],
    faction: str,
    card_type: unit_card_types,
) -> LocalAndRemoteFileData:
    repo_id, repo_tag = repo_data
    unit_card_name = dictionary

    local_unit_card_path = Path(
        IMAGES_PATH
        / card_type
        / (
            f"{'#' if card_type == 'unit_cards' else ''}missing_card"
            f"{'' if card_type == 'unit_cards' else '_info'}.png"
        ),
    )
    unit_card_data: LocalAndRemoteFileData = {
        "local_file_path": str(local_unit_card_path.absolute()),
    }

    remote_unit_card_path = (
        f"{REMOTE_DATA_PATH}/ui/"
        f"{'units' if card_type == 'unit_cards' else 'unit_info'}"
        f"/{faction}/{'#' if card_type == 'unit_cards' else ''}{unit_card_name}"
        f"{'' if card_type == 'unit_cards' else '_info'}.tga"
    )
    url = (
        f"{BASE_URL}/api/v4/projects/{repo_id}/repository/files/"
        f"{parse.quote_plus(remote_unit_card_path)}?ref={repo_tag}"
    )

    req = request.Request(url, method="HEAD")  # noqa: S310
    req.add_header("PRIVATE-TOKEN", TOKEN)

    try:
        with request.urlopen(req) as response:  # noqa: S310
            last_commit_id = next(
                x[1] for x in response.getheaders() if x[0] == "X-Gitlab-Last-Commit-Id"
            )
            local_unit_card_path = Path(
                IMAGES_PATH
                / card_type
                / repo_tag
                / faction
                / (
                    f"{'#' if card_type == 'unit_cards' else ''}{unit_card_name}"
                    f"{'' if card_type == 'unit_cards' else '_info'}.png"
                ),
            )
            unit_card_data = {
                "local_file_path": str(local_unit_card_path.absolute()),
                "remote_file_path": remote_unit_card_path,
                "remote_file_tag": repo_tag,
                "last_commit_id": last_commit_id,
            }

    except HTTPError as e:
        if e.code == 404:  # noqa: PLR2004
            if card_type == "unit_info_cards":
                remote_unit_card_path = (
                    f"{REMOTE_DATA_PATH}/ui/"
                    f"unit_info/{faction}/{unit_card_name}"
                    f"{'' if card_type == 'unit_cards' else '_INFO'}.tga"
                )
                url = (
                    f"{BASE_URL}/api/v4/projects/{repo_id}/repository/files/"
                    f"{parse.quote_plus(remote_unit_card_path)}?ref={repo_tag}"
                )

                req = request.Request(url, method="HEAD")  # noqa: S310
                req.add_header("PRIVATE-TOKEN", TOKEN)

                try:
                    with request.urlopen(req) as response:  # noqa: S310
                        last_commit_id = next(
                            x[1]
                            for x in response.getheaders()
                            if x[0] == "X-Gitlab-Last-Commit-Id"
                        )
                        local_unit_card_path = Path(
                            IMAGES_PATH
                            / card_type
                            / repo_tag
                            / faction
                            / (f"{unit_card_name}_info.png"),
                        )
                        unit_card_data = {
                            "local_file_path": str(local_unit_card_path.absolute()),
                            "remote_file_path": remote_unit_card_path,
                            "remote_file_tag": repo_tag,
                            "last_commit_id": last_commit_id,
                        }
                except HTTPError as e:
                    if e.close == 404:  # noqa: PLR2004
                        pass
            else:
                pass
    return unit_card_data


def _process_unit_card_data(
    unit_card_mp_data: UnitCardMultiprocessingPoolData,
) -> UnitCardDataReturn | None:
    unit_card_data = unit_card_mp_data["unit"]
    unit_type = unit_card_mp_data["unit_type"]
    dictionary = unit_card_mp_data["dictionary"]
    faction = unit_card_mp_data["faction"]
    repo_id = unit_card_mp_data["repo_id"]
    repo_tag = unit_card_mp_data["repo_tag"]
    card_type = unit_card_mp_data["card_type"]
    last_in_unit = unit_card_mp_data["last_in_unit"]

    unit_card_data = _get_unit_card_paths(
        dictionary=dictionary,
        repo_data=(repo_id, repo_tag),
        faction=faction,
        card_type=card_type,
    )

    logger.info(
        "\t%s processed for %s: unit '%s'",
        card_type.replace("_", " ").capitalize(),
        repo_tag,
        unit_type,
    ) if last_in_unit else None

    return {
        "unit_type": unit_type,
        "card_type": card_type,
        "faction": faction,
        "unit_card_data": unit_card_data,
    }


def _handle_faction_symbol_download(
    download_data: FactionSymbolDownloadPoolData,
) -> None:
    faction_symbol_data, repo_id = (
        download_data["faction_symbol_data"],
        download_data["repo_id"],
    )
    (local_file_path, remote_file_path, remote_file_tag) = (
        Path(faction_symbol_data["local_file_path"]),
        cast("str", faction_symbol_data.get("remote_file_path")),
        cast("str", faction_symbol_data.get("remote_file_tag")),
    )
    local_file_path.parent.mkdir(parents=True, exist_ok=True)

    url = (
        f"{BASE_URL}/api/v4/projects/{repo_id}/repository/files/"
        f"{parse.quote_plus(remote_file_path)}/raw?ref={remote_file_tag}&lfs=true"
    )
    req = request.Request(url)  # noqa: S310
    req.add_header("PRIVATE-TOKEN", TOKEN)

    with request.urlopen(req) as response:  # noqa: S310
        remote_file = BytesIO(response.read())

        with Image.open(remote_file).convert("RGBA") as im:
            im.save(local_file_path)


def _handle_unit_card_download(
    download_data: UnitCardDownloadPoolData,
) -> None:
    unit_card_data, repo_id = (
        download_data["unit_card_data"],
        download_data["repo_id"],
    )
    (local_file_path, remote_file_path, remote_file_tag) = (
        Path(unit_card_data["local_file_path"]),
        cast("str", unit_card_data.get("remote_file_path")),
        cast("str", unit_card_data.get("remote_file_tag")),
    )

    local_file_path.parent.mkdir(parents=True, exist_ok=True)

    url = (
        f"{BASE_URL}/api/v4/projects/{repo_id}/repository/files/"
        f"{parse.quote_plus(remote_file_path)}/raw?ref={remote_file_tag}&lfs=true"
    )
    req = request.Request(url)  # noqa: S310
    req.add_header("PRIVATE-TOKEN", TOKEN)

    with request.urlopen(req) as response:  # noqa: S310
        remote_file = BytesIO(response.read())

        with Image.open(remote_file).convert("RGBA") as im:
            im.save(local_file_path)


def _batch_process_faction_symbols(
    repo_tag: str,
    unique_faction_symbols: set[tuple[str, str | None, str | None, str | None]],
) -> set[tuple[str, str | None, str | None, str | None]]:

    parsed_tags_factions_path = Path(JSON_PATH / "factions" / "parsed_tags.txt")
    unparsed_factions_tags: list[str] = []
    parsed_tags_factions_path.touch()
    with parsed_tags_factions_path.open() as f:
        parsed_tags = f.read().splitlines()
        unparsed_factions_tags = [x for x in repo_tags if x not in parsed_tags]

    factions_json_path = Path(
        JSON_PATH / "factions" / f"{repo_tag}.json",
    )
    factions_dict: dict[str, FactionData] = {}
    with factions_json_path.open() as factions_json_file:
        factions_dict = json.loads(factions_json_file.read())

    if repo_tag in unparsed_factions_tags:
        logger.info(
            "Processing assignment of faction symbols in %s",
            repo_tag,
        )

        tag_index = repo_tags.index(repo_tag)
        previous_factions_json_path = Path(
            JSON_PATH / "factions" / f"{repo_tags[tag_index - 1]}.json",
        )
        with previous_factions_json_path.open() as factions_json_file:
            previous_factions_dict: dict[str, FactionData] = json.loads(
                factions_json_file.read(),
            )

        symbol_mp_pool_data: list[FactionSymbolMultiprocessPoolData] = [
            {
                "faction": faction,
                "repo_data": (repo_id, repo_tag),
            }
            for faction in factions_dict
        ]

        with Pool(min(len(factions_dict), MP_POOL_SIZE)) as pool:
            results = pool.map(_get_faction_symbol_paths, symbol_mp_pool_data)
            pool.close()

            pool.join()

            for result in [x for x in results if x]:
                faction_symbol_data = result[1]
                factions_dict[result[0]]["faction_symbol"] = faction_symbol_data

                if (
                    "last_commit_id" in faction_symbol_data
                    and tag_index > 0
                    and result[0] in previous_factions_dict
                ):
                    previous_tag_symbol_data: LocalAndRemoteFileData | None = (
                        previous_factions_dict[result[0]].get("faction_symbol")
                    )
                    if (
                        previous_tag_symbol_data
                        and faction_symbol_data
                        == previous_tag_symbol_data.get("last_commit_id", "none")
                    ):
                        faction_symbol_data = previous_tag_symbol_data
                factions_dict[result[0]]["faction_symbol"] = faction_symbol_data

        with factions_json_path.open("w") as f:
            json.dump(factions_dict, f, indent=2)

        with parsed_tags_factions_path.open("a") as p:
            p.write(f"{repo_tag}\n")

        logger.info(
            "All faction symbols for %s processed",
            repo_tag,
        )

    for faction_dict in factions_dict.values():
        faction_symbol_dict = faction_dict.get("faction_symbol")
        if faction_symbol_dict and "local_file_path" in faction_symbol_dict:
            unique_faction_symbols.add(
                (
                    faction_symbol_dict["local_file_path"],
                    faction_symbol_dict.get("remote_file_path"),
                    faction_symbol_dict.get("remote_file_tag"),
                    faction_symbol_dict.get("last_commit_id"),
                ),
            )

    return unique_faction_symbols


def _batch_process_unit_card_data(
    repo_tag: str,
    card_type: unit_card_types,
    unique_unit_cards: set[tuple[str, str | None, str | None, str | None]],
    *,
    process_unit_cards: bool,
) -> set[tuple[str, str | None, str | None, str | None]]:

    parsed_tags_path = Path(JSON_PATH / "units" / "parsed_tags.txt")
    unparsed_tags: list[str] = []
    with parsed_tags_path.open() as f:
        parsed_tags = f.read().splitlines()
        unparsed_tags = [x for x in repo_tags if x not in parsed_tags]

    key: Literal["unit_card_data", "unit_info_card_data"] = (
        "unit_card_data" if card_type == "unit_cards" else "unit_info_card_data"
    )

    units_json_path = Path(
        JSON_PATH / "units" / f"{repo_tag}.json",
    )
    units_dict: dict[str, UnitData] = {}
    with units_json_path.open() as units_json_file:
        units_dict = json.loads(units_json_file.read())

    factions_dict: dict[str, FactionData] = {}

    if process_unit_cards and repo_tag in unparsed_tags:
        logger.info(
            "\nProcessing assignment of %s for units in %s",
            card_type.replace("_", " "),
            repo_tag,
        )

        tag_index = repo_tags.index(repo_tag)
        previous_units_json_path = Path(
            JSON_PATH / "units" / f"{repo_tags[tag_index - 1]}.json",
        )
        with previous_units_json_path.open() as units_json_file:
            previous_units_dict: dict[str, UnitData] = json.loads(
                units_json_file.read(),
            )

        factions_json_path = Path(
            JSON_PATH / "factions" / f"{repo_tag}.json",
        )
        with factions_json_path.open() as factions_json_file:
            factions_dict = json.loads(
                factions_json_file.read(),
            )

        for unit in units_dict.values():
            if "merc" in unit["ownership"] and "all" in unit["ownership"]:
                unit["ownership"].remove("all")
            elif "all" in unit["ownership"] and "merc" not in unit["ownership"]:
                unit["ownership"].remove("all")
                unit["ownership"] = list(factions_dict.keys())

        unit_card_mp_pool_data: list[UnitCardMultiprocessingPoolData] = [
            {
                "unit": unit.get(key, {}).get(faction, None),
                "unit_type": unit_key,
                "dictionary": unit["dictionary"],
                "faction": "mercs"
                if faction == "merc" and card_type == "unit_cards"
                else faction,
                "card_type": card_type,
                "repo_id": repo_id,
                "repo_tag": repo_tag,
                "last_in_unit": 1 if (idx + 1) == len(unit["ownership"]) else None,
            }
            for unit_key, unit in units_dict.items()
            for idx, faction in enumerate(
                unit["ownership"] if "merc" not in unit["ownership"] else ["merc"],
            )
        ]

        with Pool(min(len(unit_card_mp_pool_data), MP_POOL_SIZE)) as pool:
            results = pool.map(
                _process_unit_card_data,
                unit_card_mp_pool_data,
            )
            pool.close()

            pool.join()

            for result in [x for x in results if x]:
                result["faction"] = (
                    "merc" if result["faction"] == "mercs" else result["faction"]
                )
                unit_card_key: Literal["unit_card_data", "unit_info_card_data"] = (
                    "unit_card_data"
                    if result["card_type"] == "unit_cards"
                    else "unit_info_card_data"
                )
                unit_card_data: LocalAndRemoteFileData | None = (
                    units_dict[result["unit_type"]]
                    .get(unit_card_key, {})
                    .get(result["faction"])
                )
                unit_card_data = result["unit_card_data"]

                if (
                    "last_commit_id" in unit_card_data
                    and tag_index > 0
                    and result["unit_type"] in previous_units_dict
                ):
                    previous_tag_unit_card_data: LocalAndRemoteFileData | None = (
                        previous_units_dict[result["unit_type"]]
                        .get(unit_card_key, {})
                        .get(result["faction"])
                    )
                    if previous_tag_unit_card_data and unit_card_data[
                        "last_commit_id"
                    ] == previous_tag_unit_card_data.get("last_commit_id", "none"):
                        unit_card_data = previous_tag_unit_card_data
                if units_dict[result["unit_type"]].get(unit_card_key) is None:
                    units_dict[result["unit_type"]][unit_card_key] = {}
                units_dict[result["unit_type"]][unit_card_key][  # pyright: ignore[reportTypedDictNotRequiredAccess]
                    result["faction"]
                ] = unit_card_data

        with units_json_path.open("w") as f:
            json.dump(units_dict, f, indent=2)

        if card_type == "unit_info_cards":
            with parsed_tags_path.open("a") as p:
                p.write(f"{repo_tag}\n")

        logger.info(
            "All %s for %s processed",
            card_type.replace("_", " "),
            repo_tag,
        )

    for unit in units_dict.values():
        for unit_card_dict in unit.get(
            key,
            {},
        ).values():
            if "local_file_path" in unit_card_dict:
                unique_unit_cards.add(
                    (
                        unit_card_dict["local_file_path"],
                        unit_card_dict.get("remote_file_path", None),
                        unit_card_dict.get("remote_file_tag", None),
                        unit_card_dict.get("last_commit_id", None),
                    ),
                )

    return unique_unit_cards


def _faction_symbols_download_wrapper(
    repo_id: int,
    repo_tags: list[str],
    *,
    perform_download: bool = True,
) -> None:
    unique_faction_symbols: set[tuple[str, str | None, str | None, str | None]] = set()

    for repo_tag in repo_tags:
        unique_faction_symbols = _batch_process_faction_symbols(
            repo_tag=repo_tag,
            unique_faction_symbols=unique_faction_symbols,
        )

    logger.info("\nAll faction symbols assigned")

    if perform_download:
        symbols_to_download: list[LocalAndRemoteFileData] = [
            {
                "local_file_path": x[0],
                "remote_file_path": x[1],
                "remote_file_tag": x[2],
                "last_commit_id": x[3],
            }
            for x in unique_faction_symbols
            if x[1] is not None
            and x[2] is not None
            and x[3] is not None
            and not Path(x[0]).is_file()
        ]

        num_symbols_to_download = len(symbols_to_download)
        download_data: list[FactionSymbolDownloadPoolData] = [
            {
                "faction_symbol_data": x,
                "repo_id": repo_id,
            }
            for x in symbols_to_download
        ]
        if num_symbols_to_download > 0:
            logger.info("\nStarting download of faction symbols")

            with Pool(min(num_symbols_to_download, MP_POOL_SIZE)) as pool:
                for completed, _ in enumerate(
                    pool.imap_unordered(_handle_faction_symbol_download, download_data),
                ):
                    if completed % 100 == 0 or completed == num_symbols_to_download:
                        logger.info(
                            "%i/%i faction symbols available locally",
                            completed,
                            num_symbols_to_download,
                        )

        logger.info(
            "\nAll faction symbols now available locally",
        )


def _unit_cards_download_wrapper(
    repo_id: int,
    repo_tags: list[str],
    *,
    process_unit_cards: bool = True,
    perform_download: bool = True,
) -> None:
    unique_unit_cards: set[tuple[str, str | None, str | None, str | None]] = set()

    for repo_tag in repo_tags:
        for card_type in ("unit_cards", "unit_info_cards"):
            unique_unit_cards = _batch_process_unit_card_data(
                repo_tag=repo_tag,
                card_type=card_type,
                unique_unit_cards=unique_unit_cards,
                process_unit_cards=process_unit_cards,
            )

    logger.info(
        "\nAll unit and unit info cards assigned",
    )

    if perform_download:
        for card_type in ("unit_cards", "unit_info_cards"):
            unit_cards_to_download: list[LocalAndRemoteFileData] = [
                {
                    "local_file_path": x[0],
                    "remote_file_path": x[1],
                    "remote_file_tag": x[2],
                    "last_commit_id": x[3],
                }
                for x in unique_unit_cards
                if card_type in x[0]
                and x[1] is not None
                and x[2] is not None
                and x[3] is not None
                and not Path(x[0]).is_file()
            ]
            num_unit_cards_to_download = len(unit_cards_to_download)
            download_data: list[UnitCardDownloadPoolData] = [
                {
                    "unit_card_data": x,
                    "repo_id": repo_id,
                }
                for x in unit_cards_to_download
            ]
            if num_unit_cards_to_download > 0:
                logger.info("\nStarting download of %s", card_type.replace("_", " "))

                with Pool(min(num_unit_cards_to_download, MP_POOL_SIZE)) as pool:
                    for completed, _ in enumerate(
                        pool.imap_unordered(_handle_unit_card_download, download_data),
                    ):
                        if (
                            completed % 100 == 0
                            or completed == num_unit_cards_to_download
                        ):
                            logger.info(
                                "%i/%i %s available locally",
                                completed,
                                num_unit_cards_to_download,
                                card_type.replace("_", " "),
                            )

                logger.info(
                    "\nAll %s now available locally",
                    card_type.replace("_", " "),
                )

        logger.info(
            "\nAll unit and unit info cards now available locally",
        )


def _process_raw_files_to_json(repo_tags: list[str]) -> None:
    """Process the raw local files to JSON files for the units."""
    json_units_path = Path(JSON_PATH / "units")
    json_units_path.mkdir(parents=True, exist_ok=True)

    json_factions_path = Path(JSON_PATH / "factions")
    json_factions_path.mkdir(parents=True, exist_ok=True)

    parsed_tags_units_path = Path(json_units_path / "parsed_tags.txt")

    unparsed_tags: list[str] = []
    parsed_tags_units_path.touch()
    with parsed_tags_units_path.open() as f:
        parsed_tags_units = f.read().splitlines()
        unparsed_tags = [x for x in repo_tags if x not in parsed_tags_units]

    for repo_tag in unparsed_tags:
        local_raw_files_path = Path(
            RAW_FILES_PATH / repo_tag,
        )

        units_dict = _get_all_units_data(
            Path(local_raw_files_path / "export_descr_unit.txt"),
        )

        export_units_dict = _parse_unit_display_strings(
            Path(local_raw_files_path / "export_units.txt"),
            Path(local_raw_files_path / "en.strings"),
            repo_tag=repo_tag,
        )

        units_dict = _get_unit_display_strings(
            units_dict=units_dict,
            export_units_dict=export_units_dict,
        )

        with Path(json_units_path / f"{repo_tag}.json").open("w") as f:
            json.dump(units_dict, f, indent=2)

        logger.info("Unit files for %s processed into JSON.", repo_tag)

    parsed_tags_factions_path = Path(json_factions_path / "parsed_tags.txt")

    unparsed_tags = []
    parsed_tags_factions_path.touch()
    with parsed_tags_factions_path.open() as f:
        parsed_tags_units = f.read().splitlines()
        unparsed_tags = [x for x in repo_tags if x not in parsed_tags_units]

    for repo_tag in unparsed_tags:
        local_raw_files_path = Path(
            RAW_FILES_PATH / repo_tag,
        )

        factions_dict = _parse_faction_data(
            Path(local_raw_files_path / "descr_sm_factions.txt"),
            Path(local_raw_files_path / "expanded_bi.txt"),
            repo_tag=repo_tag,
        )

        with Path(json_factions_path / f"{repo_tag}.json").open("w") as f:
            json.dump(factions_dict, f, indent=2, sort_keys=False)

        logger.info("Faction files for %s processed into JSON.", repo_tag)

    logger.info("\nAll JSON files available locally.")


def _get_text_files_batch(*, perform_download: bool = True) -> tuple[int, list[str]]:
    """Handle the downloading of files from every tag."""
    repo_id, repo_tags = _get_repo_tags()

    if perform_download:
        for repo_tag in repo_tags:
            _download_text_files(repo_id, repo_tag)
            logger.info("Text files from %s now available locally", repo_tag)
        logger.info("All text files available locally.")

    return repo_id, repo_tags


if __name__ == "__main__":
    if TOKEN != "":
        repo_id, repo_tags = _get_text_files_batch()

        _process_raw_files_to_json(repo_tags)

        _faction_symbols_download_wrapper(repo_id, repo_tags)
        _unit_cards_download_wrapper(repo_id, repo_tags)
