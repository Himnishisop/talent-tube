import type { Payment, Report, Talent } from "./types";
import { membershipPriceForCountry } from "./pricing";

// ---------------------------------------------------------------------------
// Realistic worldwide sample data used in DEMO MODE (no Firebase). Video IDs
// are public YouTube videos used only as placeholders. Photos are stock
// imagery – these are fictional profiles, not real people's identities.
// Phone numbers are E.164 digits (country code + number, no "+").
// ---------------------------------------------------------------------------

const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();
const daysAhead = (d: number) => new Date(Date.now() + d * 86400000).toISOString();

const v = (videoId: string, title?: string, isBest = false) => ({ videoId, url: `https://www.youtube.com/watch?v=${videoId}`, title, isBest });
const photo = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800`;

const base = (i: number) => ({ registrationComplete: true, createdAt: daysAgo(60 - i * 3), updatedAt: daysAgo(2) });
const active = (start: number, paymentId: string) => ({
  subscriptionStatus: "active" as const, subscriptionStartDate: daysAgo(start), subscriptionExpiryDate: daysAhead(365 - start), paymentId,
});

export const SAMPLE_TALENTS: Talent[] = [
  {
    id: "t_priya_sharma", uid: "t_priya_sharma", fullName: "Priya Sharma", mobile: "919876543210", whatsapp: "919876543210", email: "priya.sings@example.com",
    photoURL: photo(32491407), country: "IN", state: "Maharashtra", city: "Mumbai",
    categoryId: "singer", subCategory: "Bollywood", experienceYears: 8,
    description: "Professional playback-style singer with 8+ years of stage experience. Performed at 300+ weddings, private celebrations and corporate events. Live band available on request.",
    languages: ["Hindi", "Marathi", "English"],
    videos: [v("kJQP7kiw5Fk", "Live Wedding Set"), v("JGwWNGJdvx8", "Unplugged Session", true), v("YQHsXMglC9A", "Corporate Event Mumbai")],
    status: "approved", verified: true, featured: true, ...active(40, "pay_demo_001"), ...base(0),
  },
  {
    id: "t_marcus_reed", uid: "t_marcus_reed", fullName: "Marcus Reed", mobile: "14155550123", whatsapp: "14155550123",
    photoURL: photo(7715641), country: "US", state: "California", city: "Los Angeles",
    categoryId: "dj", subCategory: "Wedding DJ", experienceYears: 9,
    description: "Open-format DJ blending house, hip-hop and classics for weddings, brand launches and rooftop parties across Southern California. Full sound and lighting rig included.",
    languages: ["English", "Spanish"],
    videos: [v("9bZkp7q19f0", "Sunset Rooftop Mix"), v("OPf0YbXqDm0", "Wedding Highlights")],
    status: "approved", verified: true, featured: true, ...active(90, "pay_demo_002"), ...base(1),
  },
  {
    id: "t_ayesha_khan", uid: "t_ayesha_khan", fullName: "Ayesha Khan", mobile: "971501234567", whatsapp: "971501234567", email: "ayesha.henna@example.com",
    photoURL: photo(18016523), country: "AE", state: "Dubai", city: "Dubai",
    categoryId: "mehendi-artist", subCategory: "Bridal Henna", experienceYears: 10,
    description: "Award-winning bridal henna artist based in Dubai. Intricate Indian, Arabic and fusion designs using 100% organic henna. Available for destination weddings worldwide.",
    languages: ["English", "Arabic", "Urdu", "Hindi"],
    videos: [v("RgKAFK5djSk", "Bridal Henna Timelapse"), v("CevxZvSJLk8", "Arabic Design Tutorial")],
    status: "approved", verified: true, featured: true, ...active(20, "pay_demo_003"), ...base(2),
  },
  {
    id: "t_oliver_bennett", uid: "t_oliver_bennett", fullName: "Oliver Bennett", mobile: "447700900123", whatsapp: "447700900123",
    photoURL: photo(1704488), country: "GB", state: "England", city: "London",
    categoryId: "photographer", subCategory: "Wedding", experienceYears: 7,
    description: "Documentary wedding photographer based in London. Natural, unposed storytelling with a small team and drone coverage. Over 200 weddings across the UK and Europe.",
    languages: ["English", "French"],
    videos: [v("hT_nvWreIhg", "Wedding Highlights – Cotswolds"), v("fJ9rUzIMcZQ", "Engagement Film")],
    status: "approved", verified: false, featured: false, ...active(10, "pay_demo_004"), ...base(3),
  },
  {
    id: "t_sofia_martinez", uid: "t_sofia_martinez", fullName: "Sofia Martinez", mobile: "34612345678", whatsapp: "34612345678",
    photoURL: photo(1587009), country: "ES", state: "Catalonia", city: "Barcelona",
    categoryId: "dancer", subCategory: "Latin / Salsa", experienceYears: 6,
    description: "Professional Latin dancer and choreographer. Salsa, bachata and flamenco-fusion shows for weddings, festivals and corporate galas. Group and couple workshops available.",
    languages: ["Spanish", "English", "Catalan"],
    videos: [v("dQw4w9WgXcQ", "Salsa Showcase Reel")],
    status: "approved", verified: true, featured: false, ...active(5, "pay_demo_005"), ...base(4),
  },
  {
    id: "t_vikram_singh", uid: "t_vikram_singh", fullName: "Vikram Singh", mobile: "919779901234", whatsapp: "919779901234",
    photoURL: photo(2379004), country: "IN", state: "Punjab", city: "Chandigarh",
    categoryId: "anchor-emcee", subCategory: "Wedding Host", experienceYears: 12,
    description: "Trilingual host for weddings, product launches and awards nights. Known for high-energy hosting, crowd games and seamless event flow.",
    languages: ["Punjabi", "Hindi", "English"],
    videos: [v("kJQP7kiw5Fk", "Hosting Highlights"), v("OPf0YbXqDm0", "Corporate Awards Night")],
    status: "approved", verified: true, featured: false, ...active(100, "pay_demo_006"), ...base(5),
  },
  {
    id: "t_amara_okafor", uid: "t_amara_okafor", fullName: "Amara Okafor", mobile: "2348012345678", whatsapp: "2348012345678",
    photoURL: photo(3764119), country: "NG", state: "Lagos", city: "Lagos",
    categoryId: "makeup-artist", subCategory: "Bridal Makeup", experienceYears: 9,
    description: "Celebrity bridal and editorial makeup artist. Flawless HD and airbrush finishes for every skin tone, plus gele styling and hair. Trial sessions available in Lagos.",
    languages: ["English", "Yoruba"],
    videos: [v("YQHsXMglC9A", "Bridal Transformation")],
    status: "approved", verified: false, featured: false, ...active(3, "pay_demo_007"), ...base(6),
  },
  {
    id: "t_liam_walker", uid: "t_liam_walker", fullName: "Liam Walker", mobile: "61412345678", whatsapp: "61412345678",
    photoURL: photo(1222271), country: "AU", state: "New South Wales", city: "Sydney",
    categoryId: "comedian", subCategory: "Clean / Corporate", experienceYears: 4,
    description: "Stand-up comedian with clean, sharp material for corporate events, conferences and private parties. Custom sets written around your company or guest of honour.",
    languages: ["English"],
    videos: [v("9bZkp7q19f0", "Comedy Set – Sydney"), v("JGwWNGJdvx8", "Corporate Show")],
    status: "approved", verified: false, featured: false, ...active(1, "pay_demo_008"), ...base(7),
  },
  {
    id: "t_kenji_tanaka", uid: "t_kenji_tanaka", fullName: "Kenji Tanaka", mobile: "819012345678", whatsapp: "819012345678",
    photoURL: photo(1681010), country: "JP", state: "Tokyo", city: "Tokyo",
    categoryId: "musician", subCategory: "Pianist / Keyboard", experienceYears: 15,
    description: "Classically trained pianist performing jazz standards, film scores and contemporary pop for hotel lounges, weddings and private dinners across Tokyo.",
    languages: ["Japanese", "English"],
    videos: [v("RgKAFK5djSk", "Evening Lounge Set")],
    status: "approved", verified: true, featured: false, ...active(200, "pay_demo_009"), ...base(8),
  },
  {
    id: "t_isabella_costa", uid: "t_isabella_costa", fullName: "Isabella Costa", mobile: "5511912345678", whatsapp: "5511912345678",
    photoURL: photo(1130626), country: "BR", state: "São Paulo", city: "São Paulo",
    categoryId: "fitness-trainer", subCategory: "Yoga", experienceYears: 6,
    description: "Certified yoga instructor (RYT-500). Studio, online and corporate wellness sessions, plus retreats along the Brazilian coast.",
    languages: ["Portuguese", "English", "Spanish"],
    videos: [v("hT_nvWreIhg", "Morning Flow Session")],
    status: "pending", verified: false, featured: false, ...active(1, "pay_demo_010"), ...base(9),
  },
  {
    id: "t_sameer_shaikh", uid: "t_sameer_shaikh", fullName: "Sameer Shaikh", mobile: "6591234567", whatsapp: "6591234567",
    photoURL: photo(1043471), country: "SG", state: "Central", city: "Singapore",
    categoryId: "magician", subCategory: "Kids Party", experienceYears: 3,
    description: "Interactive magic shows for birthday parties, school events and family days. Balloon art and puppet segment included.",
    languages: ["English", "Malay", "Hindi"],
    videos: [v("dQw4w9WgXcQ", "Birthday Magic Show")],
    status: "pending", verified: false, featured: false, subscriptionStatus: "pending", ...base(10),
  },
  {
    id: "t_chloe_dubois", uid: "t_chloe_dubois", fullName: "Chloé Dubois", mobile: "33612345678", whatsapp: "33612345678",
    photoURL: photo(3771807), country: "FR", state: "Île-de-France", city: "Paris",
    categoryId: "chef", subCategory: "Private Chef", experienceYears: 11,
    description: "Private chef for intimate dinners, weddings and yacht charters. Seasonal French cuisine with a modern touch; menus tailored to every guest.",
    languages: ["French", "English"],
    videos: [v("fJ9rUzIMcZQ", "Tasting Menu Behind the Scenes")],
    status: "expired", verified: true, featured: false,
    subscriptionStatus: "expired", subscriptionStartDate: daysAgo(400), subscriptionExpiryDate: daysAgo(35), paymentId: "pay_demo_012", ...base(11),
  },
];

export const SAMPLE_PAYMENTS: Payment[] = SAMPLE_TALENTS.filter((t) => t.paymentId).map((t, i) => {
  const price = membershipPriceForCountry(t.country);
  return {
    id: t.paymentId!,
    talentId: t.id,
    uid: t.uid,
    amount: price.amount,
    currency: price.currency,
    status: "success",
    provider: "mock",
    mode: "test",
    orderId: `order_demo_${String(i + 1).padStart(3, "0")}`,
    paymentId: t.paymentId,
    createdAt: t.subscriptionStartDate ?? t.createdAt,
  };
});

export const SAMPLE_REPORTS: Report[] = [
  {
    id: "rep_001",
    talentId: "t_liam_walker",
    talentName: "Liam Walker",
    reason: "Wrong contact details",
    details: "Number goes to a different person.",
    status: "open",
    createdAt: daysAgo(2),
  },
];
