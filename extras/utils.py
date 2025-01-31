from hieroglyph_class import *
import json, os, requests
from datetime import datetime

# -----------------------------------------------------------------------------------------------------------------------
# GET WANIKANI PROGRESS
# -----------------------------------------------------------------------------------------------------------------------
def save_wanikani_progress(save_to=None):
  api_token = input("ENTER YOUR WANIKANI API TOKEN: ")
  print("Please wait...")
  headers = {
    "Wanikani-Revision": "20170710",
    "Authorization": f"Bearer {api_token}"
  }

  def _get_data_url(url):
    all_subjects = []
    next_url = url
    while next_url:
      response = requests.get(next_url, headers=headers)
      if response.status_code != 200:
        print(f"Error {response.status_code}: {response.text}")
        print("I guess... You can try again idk")
        return None
      data = response.json()
      all_subjects.extend(data["data"])
      next_url = data["pages"]["next_url"]
    return all_subjects
  
  sub = _get_data_url("https://api.wanikani.com/v2/subjects")
  ass = _get_data_url("https://api.wanikani.com/v2/assignments")

  fix_url = lambda s: 'http://wanikani.com/' + '/'.join(s.split("/")[-2:])
  fix_ts  = lambda t:  int(datetime.strptime(t, "%Y-%m-%dT%H:%M:%S.%fZ").timestamp())

  id_to_url = {i['id']: fix_url(i['data']['document_url']) for i in sub}
  res_data  = {id_to_url[i['data']['subject_id']]: {"progres_level": [i['data']['srs_stage']]*2, "progres_timestamp": [fix_ts(i['data']['created_at'])]*2, "custom_meaning": "", "custom_reading": ""}  for i in ass}

  with open(save_to or 'JaniPaniProgress.json', 'w+') as f:
    json.dump(res_data, f)

# -----------------------------------------------------------------------------------------------------------------------
# LOAD HIEROGLYPHDB from JSON
# -----------------------------------------------------------------------------------------------------------------------
def load_hieroglyphDB_from_json(filename: str) -> HieroglyphDB:
  def dict_to_reading(d: dict) -> Reading:
    return Reading(
        onyomi=d["onyomi"],
        kunyomi=d["kunyomi"],
        vocab=d["vocab"],
        main_reading=d["main_reading"]
      )

  def dict_to_mnemonics(d: dict) -> Mnemonics:
    return Mnemonics(
      meaning=d["meaning"],
      reading=d["reading"]
    )

  def dict_to_resource_paths(d: dict) -> ResourcePaths:
    return ResourcePaths(
      pic=d["pic"],
      sound=d["sound"],
      wanikani_link=d["wanikani_link"],
      radical_links=d["radical_links"],
      kanji_links=d["kanji_links"]
    )

  def dict_to_hieroglyph(d: dict) -> Hieroglyph:
    hieroglyph_type = HieroglyphType(d["hieroglyph_type"])
    reading = dict_to_reading(d["readings"])
    mnemonics = dict_to_mnemonics(d["mnemonics"])
    resource_paths = dict_to_resource_paths(d["resource_paths"])
    sentences = [tuple(s) for s in d["sentences"]]

    return Hieroglyph(
      symbol=d["symbol"],
      level=d["level"],
      hieroglyph_type=hieroglyph_type,
      meanings=d["meanings"],
      readings=reading,
      mnemonics=mnemonics,
      sentences=sentences,
      resource_paths=resource_paths
    )

  def dict_to_hieroglyphDB(d: dict) -> HieroglyphDB:
    hieroglyphs = [dict_to_hieroglyph(h) for h in d["hieroglyphs"]]
    return HieroglyphDB(hieroglyphs=hieroglyphs)

  # Load the JSON file
  with open(filename, "r", encoding="utf-8") as f:
    data = json.load(f)

  # Reconstruct HieroglyphDB from the loaded dictionary
  return dict_to_hieroglyphDB(data)


# -----------------------------------------------------------------------------------------------------------------------
# SAVE CUSTOM PROGRESS TO JSON
# -----------------------------------------------------------------------------------------------------------------------
def save_progress(progress_dict, save_to=None):
  current_dir = os.path.dirname(os.path.abspath(__file__))
  hieDB_path  = os.path.join(current_dir, '../HieroglyphDB.json')
  db = load_hieroglyphDB_from_json(hieDB_path)

  res_data = {}
  for hieroglyph_type in progress_dict:
    levels_progress = progress_dict[hieroglyph_type]
    for level in levels_progress:
      for h in [i for i in db if i.level==level and i.hieroglyph_type.value == hieroglyph_type]:
        res_data[h.resource_paths.wanikani_link] = dict(
          progres_level = [levels_progress[level]] * 2,
          progres_timestamp = [-1, -1]
        )
  with open(save_to or 'JaniPaniProgress.json', 'w+') as f:
    json.dump(res_data, f)


# -----------------------------------------------------------------------------------------------------------------------
# HOW TO DUMP HIEROGLYPHDB to JSON
# -----------------------------------------------------------------------------------------------------------------------
# from enum import Enum
# from dataclasses import is_dataclass

# def enum_to_value(obj):
#   # Converts enum instances to their value
#   return obj.value if isinstance(obj, Enum) else obj

# def dataclass_to_dict(obj):
#   # Recursively converts dataclasses (and lists, tuples) to dict for JSON serialization
#   if is_dataclass(obj):
#     result = {}
#     for field_name in obj.__dataclass_fields__:
#       field_value = getattr(obj, field_name)
#       result[field_name] = dataclass_to_dict(field_value)
#     return result
#   elif isinstance(obj, list):
#     return [dataclass_to_dict(item) for item in obj]
#   elif isinstance(obj, tuple):
#     return tuple(dataclass_to_dict(item) for item in obj)
#   elif isinstance(obj, Enum):
#     return enum_to_value(obj)
#   else:
#     return obj

# # # Load the pickled HieroglyphDB
# # with open('HieroglyphDB.pkl', 'rb') as f:
# #   db: HieroglyphDB = pickle.load(f)

# # Convert to JSON-serializable dictionary
# db_dict = dataclass_to_dict(db)

# # Write out to JSON
# with open('../HieroglyphDB.json', 'w', encoding='utf-8') as f:
#   json.dump(db_dict, f, ensure_ascii=False, indent=2)

# print("HieroglyphDB successfully converted to HieroglyphDB.json")