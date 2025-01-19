from dataclasses import dataclass, field
from enum import Enum
from typing import List, Tuple

class HieroglyphType(Enum):
  RADICAL = "radical"
  KANJI   = "kanji"
  VOCAB   = "vocab"

@dataclass
class Mnemonics:
  meaning: str = ""
  reading: str = ""

@dataclass
class Reading:
  onyomi:  List[str] = field(default_factory=list)
  kunyomi: List[str] = field(default_factory=list)
  vocab:   List[str] = field(default_factory=list)
  main_reading: str  = ""

@dataclass
class ResourcePaths:
  wanikani_link: str
  pic:   str = ""
  sound: str = ""
  radical_links: List[str] = field(default_factory=list)
  kanji_links:   List[str] = field(default_factory=list)

@dataclass
class Hieroglyph:
  symbol: str
  level:  int
  hieroglyph_type: HieroglyphType
  meanings:  List[str] = field(default_factory=list)
  readings:  Reading   = field(default_factory=Reading)
  mnemonics: Mnemonics = field(default_factory=Mnemonics)
  sentences: List[Tuple[str]] = field(default_factory=list)
  resource_paths: ResourcePaths = field(default_factory=ResourcePaths)

@dataclass
class HieroglyphDB:
  hieroglyphs: List[Hieroglyph] = field(default_factory=list)

  def get_hieroglyphs(self, **filters) -> List[Hieroglyph]:
    found = []
    for h in self.hieroglyphs:
      if all(getattr(h, key) == value for key, value in filters.items()):
        found.append(h)
    return found
  
  def __iter__(self):
    return iter(self.hieroglyphs)
  def __len__(self):
    return len(self.hieroglyphs)
  def __getitem__(self, index):
    return self.hieroglyphs[index]
