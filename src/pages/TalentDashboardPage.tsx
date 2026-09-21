import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Pencil,
  Eye,
  Share2,
  Plus,
  Play,
  Trash2,
  Star,
  Check,
  MapPin,
  Languages,
  Briefcase,
  Phone,
  MessageCircle,
  Sparkles,
  X,
  CheckCircle2,
  Film,
  Camera,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import { useCategories } from "@/hooks/useCategories";
import { dataService } from "@/services";
import type { Talent, TalentVideo } from "@/lib/types";
import { Avatar, Button, Spinner, VerifiedBadge } from "@/components/ui";
import { COUNTRIES, getCountry } from "@/lib/geo";
import { extractYouTubeId } from "@/lib/youtube";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";

const LANGUAGE_OPTIONS = [
  "Hindi",
  "English",
  "Punjabi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Urdu",
  "Spanish",
  "French",
  "Arabic",
];

const PRESET_AVATARS = [
  "https://images.pexels.com/photos/7135121/pexels-photo-7135121.jpeg?auto=compress&cs=tinysrgb&w=300",
  "https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?auto=compress&cs=tinysrgb&w=300",
  "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=300",
  "https://images.pexels.com/photos/3772510/pexels-photo-3772510.jpeg?auto=compress&cs=tinysrgb&w=300",
  "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=300",
];

export function TalentDashboardPage() {
  const { user } = useAuth();
  const { t } = useLang();
  const { categories, byId } = useCategories();
  const [talent, setTalent] = useState<Talent | null | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"videos" | "about" | "bookings">("videos");
  const [editOpen, setEditOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [watchingVideo, setWatchingVideo] = useState<TalentVideo | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadTalent = () => {
    if (!user) return;
    dataService.getTalent(user.uid).then(setTalent);
  };

  useEffect(() => {
    loadTalent();
  }, [user]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const copyProfileLink = () => {
    if (!talent) return;
    const url = `${window.location.origin}${window.location.pathname}#/talent/${talent.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopied(true);
    showToast("Profile link copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  if (!user) return null;
  if (talent === undefined) return <Spinner label={t("loading")} />;

  // Welcoming onboarding view if creator has not initialized their profile yet
  if (talent === null) {
    const handleCreateInitial = async () => {
      const now = new Date().toISOString();
      const defaultCategory = categories[0] || { id: "karaoke_singer", name: "Karaoke Singer", subCategories: ["Bollywood", "Retro"] };
      const newProfile: Talent = {
        id: user.uid,
        uid: user.uid,
        fullName: user.displayName || "Artist",
        mobile: user.phone || "9876543210",
        whatsapp: user.phone || "9876543210",
        email: user.email,
        photoURL: user.photoURL || PRESET_AVATARS[0],
        country: "IN",
        state: "Maharashtra",
        city: "Mumbai",
        categoryId: defaultCategory.id,
        subCategory: defaultCategory.subCategories[0] || "General",
        experienceYears: 2,
        description: `Professional ${defaultCategory.name} based in Mumbai. Ready for stage performances, weddings, and corporate events.`,
        languages: ["Hindi", "English"],
        videos: [
          {
            videoId: "dQw4w9WgXcQ",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            title: "Live Showcase Reel",
            isBest: true,
          },
        ],
        status: "approved",
        verified: true,
        featured: false,
        subscriptionStatus: "active",
        subscriptionStartDate: now,
        subscriptionExpiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        paymentId: "membership_active",
        registrationComplete: true,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await dataService.saveTalent(newProfile);
        setTalent(newProfile);
        showToast("Profile created! You can now customize your bio and videos.");
        setEditOpen(true);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Could not create profile");
      }
    };

    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-up">
        <div className="rounded-3xl border border-line bg-panel p-6 sm:p-10 text-center shadow-xl relative overflow-hidden">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-500/10 text-brand-500 shadow-inner">
            <Sparkles className="h-10 w-10 text-neon" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-heading">
            Welcome to your Creator Studio, {user.displayName || "Artist"}!
          </h1>
          <p className="mt-3 text-sm text-muted max-w-lg mx-auto leading-relaxed">
            Create your Instagram-style artist profile in seconds. Showcase your YouTube performance videos, set your direct contact buttons, and start appearing immediately in the Discover tab.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" className="w-full sm:w-auto" onClick={handleCreateInitial} icon={<Sparkles className="h-5 w-5" />}>
              Create My Creator Profile
            </Button>
            <Link to="/search" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full">
                Browse Directory
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const category = byId(talent.categoryId);

  // Set primary video
  const handleSetPrimary = async (videoId: string) => {
    const updatedVideos = talent.videos.map((v) => ({
      ...v,
      isBest: v.videoId === videoId,
    }));
    const updated = { ...talent, videos: updatedVideos, updatedAt: new Date().toISOString() };
    await dataService.saveTalent(updated);
    setTalent(updated);
    showToast("Primary showcase video updated!");
  };

  // Delete video
  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Remove this video from your profile?")) return;
    let updatedVideos = talent.videos.filter((v) => v.videoId !== videoId);
    if (updatedVideos.length > 0 && !updatedVideos.some((v) => v.isBest)) {
      updatedVideos[0].isBest = true;
    }
    const updated = { ...talent, videos: updatedVideos, updatedAt: new Date().toISOString() };
    await dataService.saveTalent(updated);
    setTalent(updated);
    showToast("Video removed.");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up pb-20">
      {/* Success Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-2xl animate-fade-in">
          <CheckCircle2 className="h-5 w-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Profile Overview Card (Instagram Profile Archetype) */}
      <div className="overflow-hidden rounded-3xl border border-line bg-panel shadow-sm">
        {/* Decorative Top Banner */}
        <div className="h-28 bg-gradient-to-r from-brand-600/30 via-neon/20 to-brand-500/30 border-b border-line relative" />

        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          {/* Header row: Avatar + Stats */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-5">
            {/* Story-ring styled Avatar */}
            <div className="relative group">
              <div className="p-1 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md">
                <Avatar
                  src={talent.photoURL}
                  name={talent.fullName}
                  size={104}
                  className="ring-4 ring-panel object-cover"
                />
              </div>
              <button
                onClick={() => setEditOpen(true)}
                className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-heading text-canvas shadow-lg hover:scale-110 transition"
                title="Change Photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Instagram-style 4-metric Stats Row */}
            <div className="flex flex-1 items-center justify-around sm:justify-end gap-6 sm:gap-8 pt-2 sm:pt-0 border-t sm:border-t-0 border-line/60">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-black text-heading">{talent.videos.length}</div>
                <div className="text-xs text-muted font-medium">Videos</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-black text-heading">{talent.experienceYears}+</div>
                <div className="text-xs text-muted font-medium">Yrs Exp</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-black text-heading">{talent.languages.length}</div>
                <div className="text-xs text-muted font-medium">Languages</div>
              </div>
              <Link to="/search" className="text-center group" title="Click to view Discover listings">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 group-hover:bg-emerald-500/20 transition">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live in Discover
                </div>
                <div className="text-[10px] text-muted mt-0.5 group-hover:underline">Directory Listing →</div>
              </Link>
            </div>
          </div>

          {/* Name & Bio Block */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-heading">{talent.fullName}</h1>
              {talent.verified && <VerifiedBadge />}
              <span className="rounded-md bg-neon/15 px-2.5 py-0.5 text-xs font-bold text-neon border border-neon/30">
                {category?.name ?? "Artist"} · {talent.subCategory}
              </span>
            </div>

            {/* Location & Languages */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-brand-500" />
                {talent.city}, {talent.state}, {getCountry(talent.country).name}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Languages className="h-3.5 w-3.5 text-brand-500" />
                {talent.languages.join(", ")}
              </span>
            </div>

            {/* Bio Text */}
            <p className="whitespace-pre-line text-sm text-silver pt-1 leading-relaxed max-w-2xl">
              {talent.description}
            </p>
          </div>

          {/* Action Buttons Row (Instagram Style) */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5 pt-4 border-t border-line/60">
            <Button
              onClick={() => setEditOpen(true)}
              size="md"
              className="font-bold gap-2"
              icon={<Pencil className="h-4 w-4" />}
            >
              Edit Profile
            </Button>

            <Button
              onClick={() => setVideoModalOpen(true)}
              variant="outline"
              size="md"
              className="font-bold gap-2"
              icon={<Plus className="h-4 w-4 text-neon" />}
            >
              Add Video
            </Button>

            <button
              onClick={copyProfileLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/80 px-4 py-2.5 text-xs font-bold text-heading hover:bg-surface transition shadow-sm"
              title="Copy public link"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              {copied ? "Link Copied" : "Share Profile"}
            </button>

            <Link
              to={`/talent/${talent.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface/80 px-4 py-2.5 text-xs font-bold text-heading hover:bg-surface transition shadow-sm ml-auto"
            >
              <Eye className="h-4 w-4" />
              View as Recruiter
              <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
            </Link>
          </div>
        </div>
      </div>

      {/* Instagram Profile Tabs */}
      <div className="flex border-b border-line text-sm font-semibold">
        <button
          onClick={() => setActiveTab("videos")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 transition ${
            activeTab === "videos"
              ? "border-neon text-heading"
              : "border-transparent text-muted hover:text-silver"
          }`}
        >
          <Film className="h-4 w-4" />
          Showcase Videos ({talent.videos.length})
        </button>

        <button
          onClick={() => setActiveTab("about")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 transition ${
            activeTab === "about"
              ? "border-neon text-heading"
              : "border-transparent text-muted hover:text-silver"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Profile Details
        </button>

        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 transition ${
            activeTab === "bookings"
              ? "border-neon text-heading"
              : "border-transparent text-muted hover:text-silver"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Direct Inquiries (0% Cut)
        </button>
      </div>

      {/* TAB 1: VIDEOS GRID (Instagram Reels Grid Style) */}
      {activeTab === "videos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              These performance videos appear directly in search results and on your public card. Starred is your primary reel.
            </p>
            <Button
              onClick={() => setVideoModalOpen(true)}
              variant="outline"
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Add Video
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Existing Videos */}
            {talent.videos.map((v, i) => (
              <div
                key={v.videoId}
                className="group relative overflow-hidden rounded-2xl border border-line bg-panel transition hover:border-brand-500/50 hover:shadow-lg"
              >
                {/* Thumbnail + Overlay */}
                <div className="relative aspect-video w-full bg-black overflow-hidden">
                  <img
                    src={`https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`}
                    alt={v.title || `Performance Video ${i + 1}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  {/* Play Button Overlay */}
                  <button
                    onClick={() => setWatchingVideo(v)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-80 group-hover:opacity-100 group-hover:bg-black/50 transition"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neon text-canvas shadow-xl group-hover:scale-110 transition">
                      <Play className="h-6 w-6 fill-current ml-0.5" />
                    </div>
                  </button>

                  {/* Primary Badge */}
                  {v.isBest && (
                    <span className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-md bg-neon px-2.5 py-1 text-[11px] font-extrabold text-canvas shadow">
                      <Star className="h-3 w-3 fill-current" /> Primary Showcase
                    </span>
                  )}
                </div>

                {/* Video Info & Controls */}
                <div className="p-3.5 space-y-2">
                  <h3 className="font-bold text-sm text-heading truncate">
                    {v.title || `Performance Showcase #${i + 1}`}
                  </h3>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-line/60">
                    {!v.isBest ? (
                      <button
                        onClick={() => handleSetPrimary(v.videoId)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-neon transition"
                      >
                        <Star className="h-3.5 w-3.5" /> Set as Primary
                      </button>
                    ) : (
                      <span className="text-[11px] font-bold text-neon">★ Featured First</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setWatchingVideo(v)}
                        className="p-1 text-muted hover:text-heading transition"
                        title="Watch Preview"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVideo(v.videoId)}
                        className="p-1 text-muted hover:text-rose-500 transition"
                        title="Remove Video"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* "+ Add Video" Empty Slot Card */}
            {talent.videos.length < 10 && (
              <button
                onClick={() => setVideoModalOpen(true)}
                className="flex aspect-video flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line p-4 text-center hover:border-neon hover:bg-surface/50 transition group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface group-hover:bg-neon/15 group-hover:text-neon text-muted transition">
                  <Plus className="h-6 w-6" />
                </div>
                <div className="font-bold text-sm text-heading group-hover:text-neon transition">
                  Add Showcase Video
                </div>
                <div className="text-xs text-muted">Paste any YouTube URL</div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE DETAILS */}
      {activeTab === "about" && (
        <div className="rounded-3xl border border-line bg-panel p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-heading">Full Artist Information</h2>
            <Button size="sm" onClick={() => setEditOpen(true)} icon={<Pencil className="h-3.5 w-3.5" />}>
              Edit Details
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface/50 p-4 space-y-1">
              <div className="text-xs font-bold text-brand-500">CATEGORY & SPECIALTY</div>
              <div className="text-base font-bold text-heading">{category?.name}</div>
              <div className="text-xs text-muted">Subcategory: {talent.subCategory}</div>
            </div>

            <div className="rounded-2xl border border-line bg-surface/50 p-4 space-y-1">
              <div className="text-xs font-bold text-brand-500">EXPERIENCE</div>
              <div className="text-base font-bold text-heading">{talent.experienceYears} Years Performing</div>
              <div className="text-xs text-muted">Languages: {talent.languages.join(", ")}</div>
            </div>

            <div className="rounded-2xl border border-line bg-surface/50 p-4 space-y-1">
              <div className="text-xs font-bold text-brand-500">LOCATION</div>
              <div className="text-base font-bold text-heading">{talent.city}, {talent.state}</div>
              <div className="text-xs text-muted">{getCountry(talent.country).name}</div>
            </div>

            <div className="rounded-2xl border border-line bg-surface/50 p-4 space-y-1">
              <div className="text-xs font-bold text-brand-500">PUBLIC VISIBILITY</div>
              <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Active on Discover Tab
              </div>
              <div className="text-xs text-muted">Status: {talent.status} · Subscription: {talent.subscriptionStatus}</div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-line">
            <div className="text-xs font-bold text-brand-500">ABOUT / BIO</div>
            <p className="whitespace-pre-line text-sm text-silver leading-relaxed bg-surface/40 p-4 rounded-2xl border border-line">
              {talent.description}
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: DIRECT INQUIRIES PREVIEW */}
      {activeTab === "bookings" && (
        <div className="rounded-3xl border border-line bg-panel p-6 sm:p-8 space-y-6">
          <div className="max-w-xl space-y-2">
            <h2 className="text-lg font-bold text-heading">Direct Client Connections</h2>
            <p className="text-sm text-muted">
              Talent Tube charges 0% booking commission. Clients, wedding planners, and casting directors contact you directly through these buttons.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface/50 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-heading">WhatsApp Booking Button</div>
                  <div className="text-xs text-muted">+{talent.whatsapp}</div>
                </div>
              </div>
              <a
                href={`https://wa.me/${talent.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500 transition"
              >
                <MessageCircle className="h-4 w-4" />
                Test Your WhatsApp Button
              </a>
            </div>

            <div className="rounded-2xl border border-line bg-surface/50 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-heading">Direct Call Button</div>
                  <div className="text-xs text-muted">+{talent.mobile}</div>
                </div>
              </div>
              <a
                href={`tel:+${talent.mobile}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-surface border border-line px-4 py-2.5 text-xs font-bold text-heading hover:bg-surface/80 transition"
              >
                <Phone className="h-4 w-4" />
                Test Your Call Button
              </a>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL (Instagram Edit Profile Experience) */}
      {editOpen && (
        <EditProfileModal
          talent={talent}
          categories={categories}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setTalent(updated);
            setEditOpen(false);
            showToast("Profile saved successfully & updated on Discover!");
          }}
        />
      )}

      {/* ADD VIDEO MODAL */}
      {videoModalOpen && (
        <AddVideoModal
          talent={talent}
          onClose={() => setVideoModalOpen(false)}
          onSaved={(updated) => {
            setTalent(updated);
            setVideoModalOpen(false);
            showToast("Showcase video added to your profile!");
          }}
        />
      )}

      {/* WATCH VIDEO PREVIEW MODAL */}
      {watchingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl">
            <div className="flex items-center justify-between border-b border-line p-4">
              <h3 className="font-bold text-sm text-heading truncate">{watchingVideo.title || "Video Preview"}</h3>
              <button onClick={() => setWatchingVideo(null)} className="p-1 text-muted hover:text-heading">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <YouTubeEmbed videoId={watchingVideo.videoId} title={watchingVideo.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// INSTAGRAM-STYLE EDIT PROFILE MODAL
// ---------------------------------------------------------------------------
function EditProfileModal({
  talent,
  categories,
  onClose,
  onSaved,
}: {
  talent: Talent;
  categories: Array<{ id: string; name: string; subCategories: string[] }>;
  onClose: () => void;
  onSaved: (t: Talent) => void;
}) {
  const [fullName, setFullName] = useState(talent.fullName);
  const [photoURL, setPhotoURL] = useState(talent.photoURL || "");
  const [categoryId, setCategoryId] = useState(talent.categoryId);
  const [subCategory, setSubCategory] = useState(talent.subCategory);
  const [country, setCountry] = useState(talent.country || "IN");
  const [state, setState] = useState(talent.state || "Maharashtra");
  const [city, setCity] = useState(talent.city || "Mumbai");
  const [experienceYears, setExperienceYears] = useState(String(talent.experienceYears || 1));
  const [description, setDescription] = useState(talent.description || "");
  const [languages, setLanguages] = useState<string[]>(talent.languages || ["English"]);
  const [mobile, setMobile] = useState(talent.mobile || "");
  const [whatsapp, setWhatsapp] = useState(talent.whatsapp || "");
  const [sameWhatsapp, setSameWhatsapp] = useState(talent.whatsapp === talent.mobile);
  const [saving, setSaving] = useState(false);
  const [avatarPresetOpen, setAvatarPresetOpen] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId) || categories[0];
  const countryObj = getCountry(country);

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      if (languages.length > 1) setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return alert("Full Name is required");
    if (!city.trim()) return alert("City is required");

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const cleanMobile = mobile.replace(/\D/g, "");
      const cleanWhatsapp = sameWhatsapp ? cleanMobile : whatsapp.replace(/\D/g, "");

      const updated: Talent = {
        ...talent,
        fullName: fullName.trim(),
        photoURL: photoURL.trim() || undefined,
        categoryId,
        subCategory: subCategory.trim() || selectedCategory?.subCategories[0] || "General",
        country,
        state: state.trim(),
        city: city.trim(),
        experienceYears: Number(experienceYears) || 1,
        description: description.trim(),
        languages,
        mobile: cleanMobile || talent.mobile,
        whatsapp: cleanWhatsapp || talent.whatsapp,
        status: "approved",
        subscriptionStatus: "active",
        registrationComplete: true,
        updatedAt: now,
      };

      await dataService.saveTalent(updated);
      onSaved(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-line bg-panel p-5 sm:p-7 shadow-2xl space-y-5 animate-fade-in my-auto">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-xl font-black text-heading">Edit Creator Profile</h2>
          <button onClick={onClose} className="rounded-xl p-1.5 text-muted hover:text-heading hover:bg-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Photo Section */}
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-surface/50 border border-line">
            <Avatar src={photoURL} name={fullName} size={64} className="ring-2 ring-neon" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-heading">Profile Photo</div>
              <p className="text-[11px] text-muted">Paste an image link or choose an artist avatar</p>
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setAvatarPresetOpen(!avatarPresetOpen)}
                  className="text-xs font-bold text-neon hover:underline"
                >
                  {avatarPresetOpen ? "Hide Presets" : "Choose Preset Avatar"}
                </button>
              </div>
            </div>
          </div>

          {avatarPresetOpen && (
            <div className="flex gap-3 p-3 rounded-2xl bg-surface border border-line overflow-x-auto">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPhotoURL(url);
                    setAvatarPresetOpen(false);
                  }}
                  className={`relative rounded-full p-0.5 shrink-0 ${
                    photoURL === url ? "ring-2 ring-neon" : "opacity-75 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt="Preset" className="h-12 w-12 rounded-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-heading mb-1">Custom Photo URL (optional)</label>
            <input
              type="url"
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-heading placeholder:text-muted focus:border-neon focus:outline-none"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-heading mb-1">Full Name / Stage Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-heading focus:border-neon focus:outline-none"
            />
          </div>

          {/* Category & SubCategory */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-heading mb-1">Talent Category</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  const found = categories.find((c) => c.id === e.target.value);
                  if (found) setSubCategory(found.subCategories[0] || "General");
                }}
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-heading focus:border-neon focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-heading mb-1">Specialty / Subcategory</label>
              <input
                type="text"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
                placeholder="e.g. Retro Bollywood, Standup"
                className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-heading focus:border-neon focus:outline-none"
              />
            </div>
          </div>

          {/* Location */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold text-heading mb-1">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-heading focus:border-neon focus:outline-none"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-heading mb-1">{countryObj.regionLabel || "State"}</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Maharashtra"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-heading focus:border-neon focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-heading mb-1">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-heading focus:border-neon focus:outline-none"
              />
            </div>
          </div>

          {/* Experience Years */}
          <div>
            <label className="block text-xs font-bold text-heading mb-1">Years of Experience</label>
            <input
              type="number"
              min={0}
              max={60}
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-heading focus:border-neon focus:outline-none"
            />
          </div>

          {/* Bio Description */}
          <div>
            <label className="block text-xs font-bold text-heading mb-1">Bio / Profile Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell casting directors and clients about your repertoire, stage experience, and style..."
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-heading focus:border-neon focus:outline-none"
            />
          </div>

          {/* Languages spoken */}
          <div>
            <label className="block text-xs font-bold text-heading mb-1">Languages Spoken</label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {LANGUAGE_OPTIONS.map((lang) => {
                const active = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      active
                        ? "bg-neon text-canvas font-bold shadow-sm"
                        : "bg-surface border border-line text-muted hover:text-heading"
                    }`}
                  >
                    {lang} {active && "✓"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Booking Contacts */}
          <div className="space-y-3 pt-2 border-t border-line">
            <div className="text-xs font-bold text-brand-500">DIRECT BOOKING CONTACTS (0% COMMISSION)</div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Phone Number (with country code)</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 919876543210"
                  className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-heading focus:border-neon focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  disabled={sameWhatsapp}
                  value={sameWhatsapp ? mobile : whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="e.g. 919876543210"
                  className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-sm text-heading disabled:opacity-50 focus:border-neon focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={sameWhatsapp}
                onChange={(e) => setSameWhatsapp(e.target.checked)}
                className="rounded border-line"
              />
              WhatsApp number is the same as Phone Number
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-line">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving Changes..." : "Save & Update Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ADD VIDEO MODAL
// ---------------------------------------------------------------------------
function AddVideoModal({
  talent,
  onClose,
  onSaved,
}: {
  talent: Talent;
  onClose: () => void;
  onSaved: (t: Talent) => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isBest, setIsBest] = useState(talent.videos.length === 0);
  const [saving, setSaving] = useState(false);

  const videoId = extractYouTubeId(url);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoId) return alert("Please enter a valid YouTube video link");

    setSaving(true);
    try {
      const newVideo: TalentVideo = {
        videoId,
        url: url.trim(),
        title: title.trim() || undefined,
        isBest,
      };

      let updatedVideos = isBest
        ? talent.videos.map((v) => ({ ...v, isBest: false }))
        : [...talent.videos];

      updatedVideos = [newVideo, ...updatedVideos];

      const updated: Talent = {
        ...talent,
        videos: updatedVideos,
        status: "approved",
        subscriptionStatus: "active",
        updatedAt: new Date().toISOString(),
      };

      await dataService.saveTalent(updated);
      onSaved(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not add video");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-panel p-6 shadow-2xl space-y-4 animate-fade-in">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-lg font-black text-heading">Add Performance Video</h2>
          <button onClick={onClose} className="p-1 text-muted hover:text-heading">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-heading mb-1">YouTube Video Link *</label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-heading placeholder:text-muted focus:border-neon focus:outline-none"
            />
          </div>

          {videoId && (
            <div className="space-y-2 rounded-2xl border border-line bg-surface/50 p-3">
              <div className="text-xs font-bold text-neon">✓ Valid YouTube Video Detected</div>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <img
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt="Video Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-heading mb-1">Performance Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Retro Hindi Melodies Live, Standup Comedy Clip"
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-heading focus:border-neon focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-heading font-medium cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isBest}
              onChange={(e) => setIsBest(e.target.checked)}
              className="rounded border-line"
            />
            Make this my Primary Showcase Reel (featured first to recruiters)
          </label>

          <div className="flex justify-end gap-3 pt-3 border-t border-line">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!videoId || saving}>
              {saving ? "Adding..." : "Add to Profile Grid"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
