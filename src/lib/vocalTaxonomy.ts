// ---------------------------------------------------------------------------
// Vocal talent taxonomy. Grouped for readability; each group renders as an
// <optgroup> in registration/search and as a heading on the Categories page.
// Three master categories consume these groups:
//   singer        → SINGING_GROUPS
//   voice-actor   → VOICE_ACTING_GROUPS
//   vocal-fx      → VOCAL_FX_GROUPS
// ---------------------------------------------------------------------------

export const SINGING_GROUPS: Record<string, string[]> = {
  "Commercial & Session": [
    "Jingle Singer (Adult)", "Jingle Singer (Child)", "Jingle Singer (Teen)", "Radio Imaging / Station ID Singer", "Brand Anthem Singer", "Political & Campaign Song Singer",
    "Backing Vocalist", "Harmony Vocalist / Harmonizer", "Humming Artist", "Vocalese / Wordless Vocalist", "Ad-lib & Riff Specialist", "Scratch / Guide Vocalist", "Demo Singer (Songwriter Demos)",
    "Session Vocalist (Studio)", "Ghost Singer", "Vocal Top-liner / Melody Writer", "Sample Pack Vocalist", "Vocal Stem Provider", "Sync / Library Music Vocalist", "Ringtone & Notification Vocalist",
    "Festive / Holiday Singer", "Carol Singer / Caroler", "Wedding Singer", "Birthday & Anniversary Serenader", "Singing Telegram Performer", "Lullaby Singer", "Vocal Coach / Trainer", "Vocal Arranger / Music Director",
  ],
  "Playback & Screen": [
    "Playback Singer (Film)", "Playback Singer (OTT / Web Series)", "Playback Singer (TV Serial)", "Title Track Singer", "Item Song Vocalist", "Background Score Vocalist", "Ad Film Vocalist", "Trailer Vocalist (Epic / Cinematic)", "Dubbing Singer (Song Localization)", "Reality Show Contestant", "Theatre & Musical Singer (Stage)",
  ],
  "Classical – Indian": [
    "Hindustani Classical Vocalist", "Khayal Singer", "Dhrupad Singer", "Thumri / Dadra Singer", "Tappa Singer", "Carnatic Classical Vocalist", "Kriti / Varnam Singer", "Ragam-Tanam-Pallavi Specialist", "Bhajan Singer (Classical)", "Ghazal Singer", "Qawwali Vocalist", "Rabindra Sangeet Singer", "Nazrul Geeti Singer", "Sopana Sangeetham Singer", "Odissi Vocalist", "Manipuri Nat Sankirtan Singer",
  ],
  "Classical – Western & Opera": [
    "Opera Singer", "Soprano", "Mezzo-Soprano", "Contralto", "Countertenor", "Tenor", "Baritone", "Bass", "Coloratura Specialist", "Lieder / Art Song Singer", "Oratorio Soloist", "Chamber Choir Singer", "Early Music / Baroque Vocalist", "Gregorian Chant Singer", "Musical Theatre Vocalist (Broadway / West End)", "Operetta Singer",
  ],
  "Semi-Classical & Light": [
    "Semi-Classical Singer", "Sugam Sangeet Singer", "Geet & Nazm Singer", "Light Classical Fusion Vocalist", "Indo-Western Fusion Singer", "Bollywood Retro Singer", "Old Hindi Classics Singer", "Kirtan / Abhang Singer", "Marathi Natya Sangeet Singer", "Tamil Film Classics Singer",
  ],
  "Pop, Indie & Contemporary": [
    "Pop Singer", "Indie Singer-Songwriter", "Acoustic / Unplugged Soloist", "R&B / Soul Singer", "Jazz Vocalist", "Blues Singer", "Rock Vocalist", "Metal Vocalist (Clean)", "Metal Vocalist (Growl / Scream)", "Punk Vocalist", "Country Singer", "Folk-Pop Singer", "K-Pop Style Vocalist", "J-Pop Style Vocalist", "Afrobeats Vocalist", "Reggae / Dancehall Singer", "Latin Pop Singer", "Bossa Nova Singer", "Electronic / EDM Topline Vocalist", "Lo-fi / Bedroom Pop Vocalist", "Crooner / Lounge Singer", "Cabaret Singer", "Cover Artist", "Mashup Artist", "Loop-Station Vocalist",
  ],
  "Rap, Hip-Hop & Spoken Word": [
    "Rapper", "Hip-Hop Artist", "Desi Hip-Hop Artist", "Drill Artist", "Trap Artist", "Freestyle Rapper", "Battle Rapper", "Melodic Rapper", "Spoken Word Poet", "Slam Poet", "Shayari / Mushaira Performer", "Storytelling Rapper", "Conscious / Political Rapper", "Toasting / MC Chant Artist", "Hype Man",
  ],
  "Devotional & Spiritual": [
    "Bhajan Singer", "Kirtan Leader", "Sufi Singer", "Qawwal", "Naat & Hamd Reciter", "Gospel Singer", "Praise & Worship Leader", "Church Choir Vocalist", "Shabad Kirtan Singer (Gurbani)", "Carnatic Devotional Singer", "Mantra Chanter", "Vedic Chant Reciter", "Buddhist Chant Vocalist", "Aarti Singer", "Mata Ki Chowki / Jagrata Singer", "Devotional Fusion Artist", "Christmas Gospel Soloist", "Sound Healing Vocalist",
  ],
  "Folk & Regional": [
    "Punjabi Folk Singer", "Bhangra Vocalist", "Rajasthani Folk (Manganiyar / Langa) Singer", "Maand Singer", "Bhojpuri Folk Singer", "Haryanvi Ragini Singer", "Garhwali / Kumaoni Singer", "Himachali Folk Singer", "Kashmiri Sufiana Singer", "Gujarati Garba / Dandiya Singer", "Marathi Lavani Singer", "Powada Singer", "Bengali Baul Singer", "Bhatiali Singer", "Assamese Bihu Singer", "Odia Folk Singer", "Tamil Folk (Gaana) Singer", "Telugu Folk Singer", "Kannada Janapada Singer", "Malayalam Folk Singer", "Goan Konkani / Mando Singer", "Nepali Folk Singer", "Sindhi Folk Singer", "Chhattisgarhi Folk Singer", "Bundeli / Braj Folk Singer", "Tribal Folk Vocalist",
    "Celtic / Irish Folk Singer", "Flamenco Cantaor", "Fado Singer", "Arabic Tarab Singer", "Turkish Folk Singer", "Persian Classical Vocalist", "Mongolian Long Song Singer", "Chinese Opera Singer", "Enka Singer", "Sean-nós Singer", "Yodeler", "Griot / West African Praise Singer", "Mariachi Vocalist", "Tango Singer", "Country Blues / Delta Singer", "Sea Shanty Singer",
  ],
  "Live & Event": [
    "Wedding Sangeet Singer", "Live Band Frontman / Frontwoman", "Restaurant & Lounge Singer", "Cruise Ship Vocalist", "Hotel Lobby Singer", "Corporate Event Singer", "Karaoke Host / Duet Partner", "Busker / Street Performer", "Stadium National Anthem Singer", "Sports Event Vocalist", "Nightclub Live PA Vocalist", "Orchestra Featured Vocalist", "Tribute Act Vocalist",
  ],
  "Choral & Ensemble": [
    "Choir Singer (SATB)", "Section Leader", "A Cappella Group Member", "Barbershop Quartet Singer", "Gospel Choir Member", "Children's Choir Member", "Chamber Ensemble Vocalist", "Vocal Group / Boy Band / Girl Group Member", "Duet Partner", "Backing Choir (Film / Studio)",
  ],
  "Age & Voice Type": [
    "Child Singer (4–9)", "Pre-teen Singer (10–12)", "Teen Singer (13–19)", "Young Adult Vocalist", "Mature / Veteran Vocalist", "Senior Vocalist (60+)", "Textured / Raspy Voice Singer", "Husky Female Vocalist", "Deep Bass Male Vocalist", "High Falsetto Specialist", "Whistle Register Singer", "Belter", "Breathy / Intimate Vocalist", "Androgynous Voice Singer", "Boy Soprano / Treble",
  ],
};

export const VOICE_ACTING_GROUPS: Record<string, string[]> = {
  "Animation & Character": [
    "Animation Voice Actor", "Cartoon Character Voice", "Anime Dub Voice Actor", "Video Game Voice Actor", "Creature & Monster Voice", "Villain Voice", "Hero / Protagonist Voice", "Sidekick / Comic Relief Voice", "Mascot & Toy Voice", "Puppet & Muppet-style Voice", "Robot / AI Character Voice", "Alien & Fantasy Language Voice", "Motion Capture Performance Voice", "Multi-Character Voice Actor",
  ],
  "Dubbing & Localization": [
    "Film Dubbing Artist", "TV Series Dubbing Artist", "OTT Localization Voice", "Lip-sync Dubbing Specialist", "ADR / Looping Artist", "Hindi Dubbing Artist", "Tamil Dubbing Artist", "Telugu Dubbing Artist", "Malayalam Dubbing Artist", "Kannada Dubbing Artist", "Bengali Dubbing Artist", "Marathi Dubbing Artist", "Punjabi Dubbing Artist", "Gujarati Dubbing Artist", "Bhojpuri Dubbing Artist", "Urdu Dubbing Artist", "English (Indian Accent) Dubbing", "English (US / UK / AU) Dubbing", "Spanish Dubbing Artist", "Arabic Dubbing Artist", "French Dubbing Artist", "Multilingual Dubbing Artist", "Dubbing Director", "Reality Show Voice (Commentary)",
  ],
  "Narration & Storytelling": [
    "Audiobook Narrator", "Fiction Narrator (Multi-voice)", "Non-fiction Narrator", "Children's Story Narrator", "Podcast Host / Narrator", "Podcast Fiction Voice", "Bedtime Story Teller", "Kahani / Dastangoi Storyteller", "Mythology & Epic Narrator", "Horror / Thriller Narrator", "Poetry Reciter", "Museum & Audio Guide Narrator", "Religious Text Reciter",
  ],
  "Commercial & Broadcast": [
    "TV Commercial Voice-Over", "Radio Commercial Voice-Over", "Digital Ad / Social Media VO", "Promo & Trailer Voice (Deep / Epic)", "Movie Trailer Voice", "Radio Jockey (RJ)", "Radio Imaging Voice", "TV Channel Continuity Announcer", "News Anchor Voice", "Sports Commentator", "Cricket Commentator", "Esports Caster", "Live Event Announcer", "Stadium PA Announcer", "Award Show Announcer", "Infomercial Voice",
  ],
  "Corporate & Learning": [
    "Corporate Video Narrator", "Explainer Video Voice", "E-Learning Narrator", "Training Module Voice", "Documentary Narrator", "Medical / Pharma Narrator", "Technical / Product Demo Voice", "Real Estate Walkthrough Voice", "Investor Pitch / Annual Report Voice", "Government & PSA Voice", "Safety Announcement Voice (Aviation / Rail / Metro)", "Museum & Exhibition Voice",
  ],
  "IVR, Telephony & AI": [
    "IVR / Phone Menu Voice", "On-hold Message Voice", "Voicemail Greeting Voice", "Call Centre Prompt Voice", "GPS / Navigation Voice", "Smart Assistant Voice", "AI / TTS Voice Model (Licensed Dataset)", "Voice Cloning Consent Artist", "Elevator & Kiosk Voice", "Metro / Airport Announcement Voice", "Wearable & App Notification Voice", "Chatbot Persona Voice",
  ],
  "Child & Teen VO": [
    "Child Voice-Over Artist (4–8)", "Child Voice-Over Artist (9–12)", "Teen Voice-Over Artist", "Child Cartoon Voice", "Child E-Learning Voice", "Child Commercial VO", "Adult Playing Child Voice", "Baby Talk Voice Artist",
  ],
  "Age, Texture & Character Voices": [
    "Senior / Elderly Voice Artist", "Grandparent Voice", "Veteran Gravelly Voice", "Warm Mature Female Voice", "Authoritative Male Voice", "Youthful Energetic Voice", "Neutral / Corporate Voice", "Sultry / Smooth Voice", "Comedic Voice", "Regional Accent Specialist (Indian)", "Regional Accent Specialist (International)", "Dialect Coach", "Accent Reduction Coach", "Whisper / ASMR Voice Artist", "Meditation & Sleep Guide Voice", "Hypnotherapy Voice", "Villainous / Menacing Voice", "Announcer 'God Voice'",
  ],
};

export const VOCAL_FX_GROUPS: Record<string, string[]> = {
  "Beatbox & Vocal Percussion": [
    "Beatboxer", "Battle Beatboxer", "Loop-Station Beatboxer", "A Cappella Vocal Percussionist", "Konnakol Artist (Carnatic Vocal Percussion)", "Bol / Tabla Vocalizer", "Mouth Drummer", "Vocal Bassist", "Vocal Scratch / DJ FX Artist", "Beatbox + Flute (Beatflute)", "Beatbox Instructor",
  ],
  "Foley & Sound Effects": [
    "Human Foley Artist", "Animal Mimicry Artist", "Bird Call Artist", "Insect & Nature Sound Vocalist", "Vehicle & Engine Sound Vocalist", "Weapon & Impact Sound Vocalist", "Creature Growl & Roar Artist", "Zombie / Monster Vocal FX", "Crowd Walla / Loop Group Artist", "Baby Cry & Coo Provider", "Laugh Track / Reaction Vocalist", "Scream Artist", "Breathing & Effort Sounds Artist", "Eating & Mouth Sounds (ASMR / Foley)", "Horror Sound Vocalist",
  ],
  "Whistling & Tonal": [
    "Melodic Whistler", "Pucker Whistler", "Palatal Whistler", "Finger Whistler", "Bird-song Whistler", "Whistle Register Specialist", "Overtone / Throat Singer", "Tuvan Khoomei Singer", "Kargyraa Singer", "Polyphonic Overtone Singer", "Yodeler", "Ululation Artist", "Kulning / Herding Call Singer", "Vocal Drone Artist", "Humming Specialist",
  ],
  "Mimicry & Impressions": [
    "Voice Impressionist", "Celebrity Mimicry Artist", "Bollywood Star Mimicry", "Politician Mimicry", "Cricketer Mimicry", "Cartoon Voice Impressionist", "Singer Impersonator", "Multi-voice Comedian", "Ventriloquist", "Sound-alike Voice (Licensed)", "Gender-flip Voice Artist", "Age-shift Voice Artist",
  ],
  "Extended & Experimental": [
    "Extended Vocal Technique Artist", "Vocal Fry & Growl Specialist", "Screamo / Harsh Vocalist", "Circular Breathing Vocalist", "Vocal Improviser", "Live Vocal Looping Artist", "Sound Poet", "Glossolalia / Invented Language Vocalist", "Vocal Sound Designer", "Vocal Trance / Chant Leader", "Cheerleading Chant Leader", "Auctioneer Chant Artist", "Rhythmic Recitation Artist",
  ],
  "Infant, Toddler & Youth Sound Bytes": [
    "Infant Crying Sound Provider", "Infant Cooing & Gurgling", "Toddler Babbling", "Toddler Giggle & Laughter", "Baby First Words", "Child Playground Ambience Voice", "Child Laughter Provider", "Child Screaming / Tantrum FX", "Teen Crowd & Reaction Voices", "School Assembly / Classroom Voices",
  ],
};

const flat = (g: Record<string, string[]>) => Array.from(new Set(Object.values(g).flat()));
export const SINGING_SPECIALTIES = flat(SINGING_GROUPS);
export const VOICE_ACTING_SPECIALTIES = flat(VOICE_ACTING_GROUPS);
export const VOCAL_FX_SPECIALTIES = flat(VOCAL_FX_GROUPS);

export const ALL_VOCAL_GROUPS: Record<string, string[]> = { ...SINGING_GROUPS, ...VOICE_ACTING_GROUPS, ...VOCAL_FX_GROUPS };
