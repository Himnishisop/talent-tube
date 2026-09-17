import type { Category } from "./types";
import { ALL_VOCAL_GROUPS, SINGING_SPECIALTIES, VOICE_ACTING_SPECIALTIES, VOCAL_FX_SPECIALTIES } from "./vocalTaxonomy";
import { AUDIO_PRO_GROUPS, AUDIO_PRO_SPECIALTIES } from "./audioProTaxonomy";

export { LANGUAGES } from "./geo";
export * from "./vocalTaxonomy";
export * from "./audioProTaxonomy";

// Default categories. These are seeded into Firestore on first run and can be
// extended by the admin from the Admin Dashboard → Categories tab.
// ---------------------------------------------------------------------------
// Musician specialties: Indian classical & folk instruments plus instruments
// from around the world. Grouped for readability; flattened + de-duplicated
// below. Add new instruments to the relevant group.
// ---------------------------------------------------------------------------
const INSTRUMENT_GROUPS: Record<string, string[]> = {
  "Ensembles": ["Live Band", "Wedding Band", "Jazz Band", "String Quartet", "Orchestra", "Acoustic Duo / Trio", "Fusion Band", "Qawwali Group", "Brass Band", "Drumline / Percussion Ensemble", "Baraat Band", "Marching Band", "Choir"],
  "Indian Strings": ["Sitar", "Sarod", "Veena (Saraswati)", "Rudra Veena", "Vichitra Veena", "Santoor", "Sarangi", "Esraj", "Dilruba", "Tanpura", "Swarmandal", "Ektara", "Dotara", "Rabab", "Tumbi", "Kamaicha", "Ravanahatha", "Mohan Veena", "Gottuvadyam (Chitravina)"],
  "Indian Wind": ["Bansuri (Bamboo Flute)", "Venu (Carnatic Flute)", "Shehnai", "Nadaswaram", "Harmonium", "Pungi / Been", "Algoza", "Shankh (Conch)", "Kombu"],
  "Indian Percussion": ["Tabla", "Pakhawaj", "Mridangam", "Dhol", "Dholak", "Dholki", "Nagara", "Dhak", "Chenda", "Thavil", "Khol", "Kanjira", "Ghatam", "Morsing", "Duff / Dafli", "Damaru", "Manjira / Taal", "Thali & Ghungroo", "Tasha", "Dhol Tasha Pathak", "Pung (Manipuri)", "Idakka", "Udukkai", "Urumi"],
  "Guitar & Fretted": ["Acoustic Guitar", "Electric Guitar", "Classical Guitar", "Bass Guitar", "Ukulele", "Banjo", "Mandolin", "Bouzouki", "Oud", "Lute", "Charango", "Cuatro", "Balalaika", "Pipa", "Shamisen", "Guzheng", "Koto", "Kora", "Slide Guitar", "12-String Guitar", "Cavaquinho"],
  "Keyboards": ["Piano", "Grand Piano", "Keyboard / Synthesizer", "Electric Organ", "Church Organ", "Accordion", "Melodica", "Harpsichord", "Bandoneon", "Celesta"],
  "Bowed Strings": ["Violin", "Viola", "Cello", "Double Bass", "Electric Violin", "Fiddle (Folk)", "Erhu", "Kemenche", "Nyckelharpa", "Hardanger Fiddle", "Hurdy-Gurdy", "Morin Khuur"],
  "Harps & Zithers": ["Harp", "Celtic Harp", "Lyre", "Kantele", "Hammered Dulcimer", "Cimbalom", "Autoharp", "Kanun (Qanun)", "Yangqin"],
  "Woodwinds": ["Flute (Western Concert)", "Piccolo", "Clarinet", "Bass Clarinet", "Oboe", "English Horn", "Bassoon", "Recorder", "Tin Whistle", "Pan Flute", "Ney", "Duduk", "Dizi", "Shakuhachi", "Quena", "Ocarina", "Didgeridoo", "Bagpipes", "Uilleann Pipes", "Harmonica"],
  "Saxophones": ["Soprano Saxophone", "Alto Saxophone", "Tenor Saxophone", "Baritone Saxophone"],
  "Brass": ["Trumpet", "Cornet", "Flugelhorn", "Trombone", "French Horn", "Tuba", "Sousaphone", "Euphonium", "Bugle", "Alphorn"],
  "Drums & World Percussion": ["Drum Kit", "Electronic Drums", "Cajón", "Djembe", "Congas", "Bongos", "Timbales", "Darbuka / Doumbek", "Riq", "Frame Drum", "Bodhrán", "Taiko", "Tabla (Fusion)", "Udu", "Talking Drum", "Dunun", "Surdo", "Pandeiro", "Cuíca", "Steelpan (Steel Drum)", "Handpan / Hang", "Marimba", "Xylophone", "Vibraphone", "Glockenspiel", "Timpani", "Cymbals / Gong", "Shaker & Auxiliary Percussion", "Beatboxing"],
  "Electronic & Other": ["Theremin", "Live Looping Artist", "Electronic Producer (Live Set)", "Multi-Instrumentalist", "One-Man Band", "Music Director / Arranger", "Session Musician", "Music Teacher"],
};

export const MUSICIAN_INSTRUMENTS: string[] = Array.from(new Set(Object.values(INSTRUMENT_GROUPS).flat()));

/** All grouped specialty lists (instruments + vocal taxonomy). */
const ALL_SPECIALTY_GROUPS: Record<string, string[]> = { ...INSTRUMENT_GROUPS, ...ALL_VOCAL_GROUPS, ...AUDIO_PRO_GROUPS };
const GROUP_INDEX = new Map<string, string>();
Object.entries(ALL_SPECIALTY_GROUPS).forEach(([label, list]) => list.forEach((s) => GROUP_INDEX.has(s) || GROUP_INDEX.set(s, label)));

/** Group label for a specialty (used for grouped dropdowns / headings). */
export const instrumentGroupOf = (specialty: string): string | undefined => GROUP_INDEX.get(specialty);

export { INSTRUMENT_GROUPS };

// `order` is derived from array position below, so new categories can simply be inserted where they belong.
const CATEGORY_LIST: Category[] = [
  { id: "singer", name: "Singer", icon: "singer", subCategories: SINGING_SPECIALTIES, active: true, order: 1 },
  { id: "voice-actor", name: "Voice Actor & Dubbing", icon: "voice-actor", subCategories: VOICE_ACTING_SPECIALTIES, active: true, order: 2 },
  { id: "vocal-fx", name: "Vocal FX & Beatbox", icon: "vocal-fx", subCategories: VOCAL_FX_SPECIALTIES, active: true, order: 3 },
  { id: "karaoke-singer", name: "Karaoke Singer", icon: "karaoke-singer", subCategories: ["Karaoke Host / KJ", "Party Karaoke", "Bollywood Karaoke", "Retro Classics", "Duet Performer", "Karaoke Night Entertainer", "Corporate Karaoke"], active: true, order: 2 },
  { id: "dancer", name: "Dancer", icon: "dancer", subCategories: ["Contemporary", "Hip-Hop", "Ballet", "Latin / Salsa", "Bollywood", "Classical", "Folk", "Wedding Choreographer"], active: true, order: 2 },
  { id: "musician", name: "Musician", icon: "musician", subCategories: MUSICIAN_INSTRUMENTS, active: true, order: 3 },
  { id: "dj", name: "DJ", icon: "dj", subCategories: ["Wedding DJ", "Club DJ", "Corporate Events", "House / EDM", "Hip-Hop / R&B", "Bollywood", "Afrobeats", "Latin"], active: true, order: 4 },
  { id: "mehendi-artist", name: "Henna Artist", icon: "mehendi-artist", subCategories: ["Bridal Henna", "Arabic", "Indian", "Moroccan", "Party Henna"], active: true, order: 5 },
  { id: "makeup-artist", name: "Makeup Artist", icon: "makeup-artist", subCategories: ["Bridal Makeup", "Editorial / Fashion", "Airbrush", "Special Effects", "Party Makeup", "Hair Stylist"], active: true, order: 6 },
  { id: "photographer", name: "Photographer", icon: "photographer", subCategories: ["Wedding", "Engagement / Pre-Wedding", "Portrait", "Fashion", "Product", "Event", "Newborn / Family"], active: true, order: 7 },
  { id: "videographer", name: "Videographer", icon: "videographer", subCategories: ["Wedding Films", "Cinematic", "Drone", "Corporate", "Music Videos", "Short-form / Reels"], active: true, order: 8 },
  { id: "sound-audio-pro", name: "Sound Engineer & Audio Pro", icon: "sound-audio-pro", subCategories: AUDIO_PRO_SPECIALTIES, active: true, order: 9 },
  { id: "anchor-emcee", name: "Host / Emcee", icon: "anchor-emcee", subCategories: ["Wedding Host", "Corporate Emcee", "Awards Night", "Bilingual Host", "Kids Party Host"], active: true, order: 9 },
  { id: "comedian", name: "Comedian", icon: "comedian", subCategories: ["Stand-up", "Improv", "Impressions", "Clean / Corporate", "Roast"], active: true, order: 10 },
  { id: "magician", name: "Magician", icon: "magician", subCategories: ["Stage Magic", "Close-up Magic", "Kids Party", "Illusionist", "Mentalist"], active: true, order: 11 },
  { id: "bartender", name: "Bartender", icon: "bartender", subCategories: ["Flair Bartender", "Mixologist", "Mocktail Specialist", "Mobile Bar"], active: true, order: 12 },
  { id: "chef", name: "Chef", icon: "chef", subCategories: ["Private Chef", "Live Cooking Station", "Baker / Pastry", "Catering", "Regional Cuisine", "Plant-based"], active: true, order: 13 },
  { id: "painter", name: "Visual Artist", icon: "painter", subCategories: ["Live Portrait", "Caricature", "Mural", "Canvas Art", "Face Painting", "Body Art"], active: true, order: 14 },
  { id: "fitness-trainer", name: "Fitness Trainer", icon: "fitness-trainer", subCategories: ["Personal Trainer", "Yoga", "Pilates", "Zumba", "Crossfit", "Nutrition Coach"], active: true, order: 15 },
  { id: "event-performer", name: "Event Performer", icon: "event-performer", subCategories: ["Fire Show", "LED Act", "Circus / Acrobat", "Stilt Walker", "Puppet Show", "Drumline", "Living Statue"], active: true, order: 16 },
  { id: "wedding-artist", name: "Wedding Specialist", icon: "wedding-artist", subCategories: ["Wedding Planner", "Decorator / Florist", "Officiant", "Ceremony Musician", "Procession Band"], active: true, order: 17 },
];

export const DEFAULT_CATEGORIES: Category[] = CATEGORY_LIST.map((c, i) => ({ ...c, order: i + 1 }));

export const EXPERIENCE_OPTIONS = [
  { value: 0, label: "Any experience" },
  { value: 1, label: "1+ years" },
  { value: 3, label: "3+ years" },
  { value: 5, label: "5+ years" },
  { value: 10, label: "10+ years" },
];

export const REPORT_REASONS = [
  "Fake profile",
  "Inappropriate content",
  "Wrong contact details",
  "Spam / scam",
  "Other",
];

export const APP_NAME = "Talent Tube";
export const APP_TAGLINE = "Showcase your talent. Get endless opportunities.";
export const APP_ICON_URL = "https://i.ibb.co/FLb3pqDf/Whats-App-Image-2026-09-15-at-12-20-41-AM.jpg";
