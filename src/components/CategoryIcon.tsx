import {
  Mic2, PersonStanding, Guitar, Headphones, Flower2, Paintbrush,
  Camera, Clapperboard, Speech, Laugh, WandSparkles, Martini,
  ChefHat, Palette, Dumbbell, Drama, Gem, Sparkles, MicVocal, Headset, AudioLines, SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

const icons: Record<string, LucideIcon> = {
  singer: Mic2,
  "sound-audio-pro": SlidersHorizontal,
  "voice-actor": Headset,
  "vocal-fx": AudioLines,
  "karaoke-singer": MicVocal,
  dancer: PersonStanding,
  musician: Guitar,
  dj: Headphones,
  "mehendi-artist": Flower2,
  "makeup-artist": Paintbrush,
  photographer: Camera,
  videographer: Clapperboard,
  "anchor-emcee": Speech,
  comedian: Laugh,
  magician: WandSparkles,
  bartender: Martini,
  chef: ChefHat,
  painter: Palette,
  "fitness-trainer": Dumbbell,
  "event-performer": Drama,
  "wedding-artist": Gem,
};

export const CATEGORY_ICON_KEYS = Object.keys(icons);

export function CategoryIcon({ id, iconKey, className = "h-6 w-6" }: { id: string; iconKey?: string; className?: string }) {
  const Icon = icons[iconKey ?? ""] ?? icons[id] ?? Sparkles;
  return <Icon className={className} strokeWidth={1.6} aria-hidden="true" />;
}