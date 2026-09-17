// ---------------------------------------------------------------------------
// Sound & Audio Professionals taxonomy: engineers, editors and operators.
// Grouped for <optgroup> rendering; flattened + de-duplicated below.
// ---------------------------------------------------------------------------

export const AUDIO_PRO_GROUPS: Record<string, string[]> = {
  "Studio & Recording Engineers": [
    "Recording Engineer", "Studio Engineer", "Tracking Engineer", "Assistant Engineer", "Vocal Recording Engineer",
    "Dubbing Studio Engineer", "Voice-Over Recording Engineer", "Podcast Recording Engineer", "Home Studio Engineer", "Mobile Recording Engineer",
  ],
  "Mixing & Mastering": [
    "Mixing Engineer", "Mastering Engineer", "Stem Mastering Engineer", "Dolby Atmos / Spatial Audio Mixer", "Surround (5.1 / 7.1) Mixer",
    "Film Re-recording Mixer", "Music Mix Engineer (Bollywood / Regional)", "Vocal Tuning & Comping Engineer", "Loudness / Broadcast Compliance Engineer", "Vinyl / Stereo Mastering Specialist",
  ],
  "Live Sound & FOH": [
    "Live Sound Engineer", "Front of House (FOH) Engineer", "Monitor Engineer", "Broadcast Sound Mixer (Live Events)", "Concert Sound Engineer",
    "Wedding & Sangeet Sound Engineer", "Corporate Event Sound Engineer", "Theatre Sound Engineer", "House of Worship Sound Engineer", "Festival Sound Engineer", "Club / DJ Sound Engineer",
  ],
  "Sound Operators & Technicians": [
    "Sound Operator", "PA System Operator", "Audio Technician", "Sound System Technician", "Line Array Rigging Technician", "RF / Wireless Mic Technician",
    "Backline Technician", "Stage Audio Technician", "Sound Board Operator (Theatre)", "Playback Operator (Live Shows)", "Cue / QLab Operator", "AV Technician",
    "Conference Audio Operator", "Simultaneous Interpretation Audio Technician", "Sound Hire & Rental Technician", "Loudspeaker System Tuner",
  ],
  "Film, TV & OTT Sound": [
    "Production Sound Mixer (Location Sound)", "Boom Operator", "Sound Recordist", "Sync Sound Recordist", "Sound Utility / Cable Person",
    "Sound Designer (Film)", "Supervising Sound Editor", "Dialogue Editor", "ADR Mixer / Recordist", "Foley Artist", "Foley Mixer", "Foley Editor",
    "Sound Effects (SFX) Editor", "Ambience / Background Sound Editor", "Re-recording Mixer", "Music Editor (Film)", "Trailer Sound Designer", "Dubbing Mixer",
  ],
  "Audio Editors & Post-Production": [
    "Audio Editor", "Sound Editor", "Podcast Editor", "Audiobook Editor", "Radio Show Editor", "Voice-Over Cleanup Editor",
    "Noise Reduction & Audio Restoration Specialist", "Audio Forensics Specialist", "Song Editor / Arrangement Editor", "Remix & Mashup Editor", "Audio Transcription & Sync Editor",
    "Video Editor (Audio-focused)", "Reels / Short-form Audio Editor", "Audio Post Supervisor",
  ],
  "Broadcast & Radio": [
    "Broadcast Audio Engineer", "Radio Studio Engineer", "Radio Production Engineer", "OB Van Audio Engineer", "Sports Broadcast Audio Mixer",
    "News Studio Sound Operator", "Streaming / Twitch Audio Engineer", "Webcast Audio Technician",
  ],
  "Game, Interactive & Immersive Audio": [
    "Game Audio Designer", "Interactive Audio Implementer (Wwise / FMOD)", "VR / AR Audio Designer", "Immersive / Binaural Audio Specialist", "UI / UX Sound Designer", "Sonic Branding / Audio Logo Designer",
  ],
  "Music Production & Programming": [
    "Music Producer", "Beat Maker", "Music Programmer", "Music Arranger", "Sound Programmer / Synth Designer", "Sample Librarian", "Backing Track Producer", "Karaoke Track Producer", "Jingle Producer", "Ringtone Producer",
  ],
  "Acoustics, Systems & Installation": [
    "Acoustic Consultant", "Studio Acoustic Designer", "Sound System Designer", "AV System Integrator", "Home Theatre Installer", "Auditorium / Cinema Sound Installer", "Audio Calibration Specialist", "Noise Control Engineer",
  ],
  "Maintenance, Repair & Training": [
    "Audio Equipment Repair Technician", "Speaker Repair Specialist", "Microphone Technician", "Mixer & Console Technician", "Pro Audio Sales Consultant", "Sound Engineering Trainer / Instructor", "DAW Trainer (Pro Tools / Logic / Ableton / Cubase)",
  ],
};

export const AUDIO_PRO_SPECIALTIES: string[] = Array.from(new Set(Object.values(AUDIO_PRO_GROUPS).flat()));
