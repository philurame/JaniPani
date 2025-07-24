//-----------------------------------------------------------
// HIEROGLYPH CLASSES
//-----------------------------------------------------------
class HieroglyphType {
  static RADICAL = "radical";
  static KANJI = "kanji";
  static VOCAB = "vocab";
}

const HieroglyphProgress = [
  'Apprentice 0', // 0
  'Apprentice 1', // 1
  'Apprentice 2', // 2
  'Apprentice 3', // 3
  'Apprentice 4', // 4
  'Guru 1',       // 5
  'Guru 2',       // 6
  'Master',       // 7
  'Enlightened',  // 8
  'Burned'        // 9
];
HieroglyphProgress[-1] = 'Not Learned';

const SecToReview = [
  0 * 3600,        // 0
  4 * 3600,        // 1
  8 * 3600,        // 2
  24 * 3600,       // 3
  48 * 3600,       // 4
  168 * 3600,      // 5
  336 * 3600,      // 6
  720 * 3600,      // 7
  2880 * 3600,     // 8
  Infinity, // 9
]
SecToReview[-1] = Infinity;
  
class Mnemonics {
  constructor(meaning, reading) {
    this.meaning = meaning;
    this.reading = reading;
    this.custom_meaning = "";
    this.custom_reading = "";
  }
  
  static fromJSON(json) {
    return new Mnemonics(json.meaning, json.reading);
  }
}
  
class Reading {
  constructor(onyomi, kunyomi, vocab, main_reading) {
    this.onyomi = onyomi || [];
    this.kunyomi = kunyomi || [];
    this.vocab = vocab || [];
    this.main_reading = main_reading || "";
  }
  
  static fromJSON(json) {
    return new Reading(json.onyomi, json.kunyomi, json.vocab, json.main_reading);
  }
}
  
class ResourcePaths {
  constructor(pic, sound, wanikani_link, radical_links, kanji_links) {
    this.pic = pic;
    this.sound = sound;
    this.wanikani_link = wanikani_link;
    this.radical_links = radical_links || [];
    this.kanji_links = kanji_links || [];
  }
  
  static fromJSON(json) {
    return new ResourcePaths(json.pic, json.sound, json.wanikani_link, json.radical_links, json.kanji_links);
  }
}
  
class Hieroglyph {
  constructor(symbol, level, hieroglyph_type, meanings, readings, mnemonics, sentences, resource_paths) {
    this.symbol = symbol;
    this.level = level;
    this.hieroglyph_type = hieroglyph_type;
    this.meanings = meanings || [];
    this.readings = readings;
    this.mnemonics = mnemonics;
    this.sentences = sentences || [];
    this.resource_paths = resource_paths;
    this.progres_level = [-1, -1];
    this.progres_timestamp = [-1, -1];
  }
  
  static fromJSON(json) {
    return new Hieroglyph(
      json.symbol,
      json.level,
      json.hieroglyph_type,
      json.meanings,
      Reading.fromJSON(json.readings),
      Mnemonics.fromJSON(json.mnemonics),
      json.sentences,
      ResourcePaths.fromJSON(json.resource_paths)
      );
  }
}
  
class HieroglyphDB {
  constructor(hieroglyphs) {
    this.hieroglyphs = hieroglyphs || [];
  }
  
  static fromJSON(json) {
    const items = (json.hieroglyphs || []).map(h => Hieroglyph.fromJSON(h));
    return new HieroglyphDB(items);
  }
}
  
//-----------------------------------------------------------
// CONSTANTS/VARIABLES
//-----------------------------------------------------------
var DB = null;                // Will hold HieroglyphDB
var LinkIdx = null;           // dict with wanikani link: Db idx
var filteredHieroglyphs = []; // Hieroglyphs that match ProgressLevel etc
var currentQuestion = null;   // The current Hieroglyph being asked about
var currentInfo     = null;   // The current Hieroglyph in Info section
var questionType = null;      // either 'meaning', 'reading'
var currentSoundPath = null;  // The sound path to the current vocabulary
var ProgressLevel = 1;        // The current user's progress level
var isInLesson = 1;            // either 1 or 0
var isInReview = 0;           // is review active now or feedback given
var current_timestamp = null; // current timestamp in seconds (UTC)
var prevLvls = [];
var prevTimestamps = [];
var is_correct_review = false;
var is_half_correct_review = false;

var currentLesson = null;
var lessonIndex = 0;
var eligibleLessons = [];

var is_wanakana_bind = false;
var chartViewMode = "week";
var reviewOrder = "random";

const ProgressRadLevel = 5;         // radical level required for ProgressLevel+=1
const ProgressKanjiLevel = 5;       // kanji level required for ProgressLevel+=1
const ProgressVocabLevel = 2;       // vocab level required for ProgressLevel+=1
const ProgressKanjiShare = 0.9;     // kanji share leveled required for ProgressLevel+=1
const ProgressVocabShare = 0.7;     // vocab share leveled required for ProgressLevel+=1
const RadKanjiLessonLevel = 5;      // radical-compound level required for kanji lesson
const KanjiVocabLessonLevel = 5;    // kanji-compound level required for vocab lesson

const ProgressKanjiLevelLow = 3;    // same for ProgressLevel < LowProgressEnd
const ProgressVocabLevelLow = 3;    // same for ProgressLevel < LowProgressEnd
const RadKanjiLessonLevelLow = 0;
const KanjiVocabLessonLevelLow = 0;
const LowProgressEnd = 4;