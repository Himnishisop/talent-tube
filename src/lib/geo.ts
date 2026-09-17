// ---------------------------------------------------------------------------
// Global geography, phone and currency reference data.
// Countries with curated region → city lists get dropdowns; every other
// country falls back to free-text region/city inputs so nobody is blocked.
// ---------------------------------------------------------------------------

export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dialCode: string; // without "+"
  currency: string; // ISO 4217
  regionLabel: string; // "State", "Province", "County"...
  regions?: Record<string, string[]>; // region → cities (curated countries only)
}

const R = (regions: Record<string, string[]>) => regions;

export const COUNTRIES: Country[] = [
  { code: "IN", name: "India", dialCode: "91", currency: "INR", regionLabel: "State", regions: R({
    "Delhi": ["New Delhi", "Dwarka", "Rohini"], "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"], "Haryana": ["Gurugram", "Faridabad"],
    "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru"], "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode"], "Madhya Pradesh": ["Bhopal", "Indore"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"], "Punjab": ["Ludhiana", "Amritsar", "Chandigarh"], "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"], "Telangana": ["Hyderabad", "Warangal"], "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Noida", "Agra"], "West Bengal": ["Kolkata", "Siliguri"],
  }) },
  { code: "US", name: "United States", dialCode: "1", currency: "USD", regionLabel: "State", regions: R({
    "California": ["Los Angeles", "San Francisco", "San Diego", "Sacramento"], "New York": ["New York City", "Buffalo", "Albany"], "Texas": ["Houston", "Austin", "Dallas", "San Antonio"],
    "Florida": ["Miami", "Orlando", "Tampa"], "Illinois": ["Chicago", "Springfield"], "Nevada": ["Las Vegas", "Reno"], "Washington": ["Seattle", "Spokane"], "Georgia": ["Atlanta", "Savannah"], "Tennessee": ["Nashville", "Memphis"],
  }) },
  { code: "GB", name: "United Kingdom", dialCode: "44", currency: "GBP", regionLabel: "Region", regions: R({
    "England": ["London", "Manchester", "Birmingham", "Liverpool", "Leeds", "Bristol"], "Scotland": ["Edinburgh", "Glasgow", "Aberdeen"], "Wales": ["Cardiff", "Swansea"], "Northern Ireland": ["Belfast", "Derry"],
  }) },
  { code: "CA", name: "Canada", dialCode: "1", currency: "CAD", regionLabel: "Province", regions: R({
    "Ontario": ["Toronto", "Ottawa", "Mississauga"], "Quebec": ["Montreal", "Quebec City"], "British Columbia": ["Vancouver", "Victoria"], "Alberta": ["Calgary", "Edmonton"],
  }) },
  { code: "AU", name: "Australia", dialCode: "61", currency: "AUD", regionLabel: "State", regions: R({
    "New South Wales": ["Sydney", "Newcastle"], "Victoria": ["Melbourne", "Geelong"], "Queensland": ["Brisbane", "Gold Coast"], "Western Australia": ["Perth"], "South Australia": ["Adelaide"],
  }) },
  { code: "AE", name: "United Arab Emirates", dialCode: "971", currency: "AED", regionLabel: "Emirate", regions: R({
    "Dubai": ["Dubai"], "Abu Dhabi": ["Abu Dhabi", "Al Ain"], "Sharjah": ["Sharjah"], "Ajman": ["Ajman"], "Ras Al Khaimah": ["Ras Al Khaimah"],
  }) },
  { code: "SG", name: "Singapore", dialCode: "65", currency: "SGD", regionLabel: "Region", regions: R({ "Central": ["Singapore"], "East": ["Bedok", "Tampines"], "West": ["Jurong"], "North": ["Woodlands"] }) },
  { code: "DE", name: "Germany", dialCode: "49", currency: "EUR", regionLabel: "State", regions: R({ "Berlin": ["Berlin"], "Bavaria": ["Munich", "Nuremberg"], "Hamburg": ["Hamburg"], "Hesse": ["Frankfurt"], "North Rhine-Westphalia": ["Cologne", "Düsseldorf"] }) },
  { code: "FR", name: "France", dialCode: "33", currency: "EUR", regionLabel: "Region", regions: R({ "Île-de-France": ["Paris"], "Provence-Alpes-Côte d'Azur": ["Marseille", "Nice"], "Auvergne-Rhône-Alpes": ["Lyon"], "Occitanie": ["Toulouse"] }) },
  { code: "ES", name: "Spain", dialCode: "34", currency: "EUR", regionLabel: "Region", regions: R({ "Madrid": ["Madrid"], "Catalonia": ["Barcelona"], "Andalusia": ["Seville", "Málaga"], "Valencia": ["Valencia"] }) },
  { code: "IT", name: "Italy", dialCode: "39", currency: "EUR", regionLabel: "Region", regions: R({ "Lazio": ["Rome"], "Lombardy": ["Milan"], "Campania": ["Naples"], "Tuscany": ["Florence"], "Veneto": ["Venice"] }) },
  { code: "NL", name: "Netherlands", dialCode: "31", currency: "EUR", regionLabel: "Province", regions: R({ "North Holland": ["Amsterdam"], "South Holland": ["Rotterdam", "The Hague"], "Utrecht": ["Utrecht"] }) },
  { code: "BR", name: "Brazil", dialCode: "55", currency: "BRL", regionLabel: "State", regions: R({ "São Paulo": ["São Paulo", "Campinas"], "Rio de Janeiro": ["Rio de Janeiro"], "Minas Gerais": ["Belo Horizonte"], "Bahia": ["Salvador"] }) },
  { code: "MX", name: "Mexico", dialCode: "52", currency: "MXN", regionLabel: "State", regions: R({ "Mexico City": ["Mexico City"], "Jalisco": ["Guadalajara"], "Nuevo León": ["Monterrey"], "Quintana Roo": ["Cancún"] }) },
  { code: "ZA", name: "South Africa", dialCode: "27", currency: "ZAR", regionLabel: "Province", regions: R({ "Gauteng": ["Johannesburg", "Pretoria"], "Western Cape": ["Cape Town"], "KwaZulu-Natal": ["Durban"] }) },
  { code: "NG", name: "Nigeria", dialCode: "234", currency: "NGN", regionLabel: "State", regions: R({ "Lagos": ["Lagos", "Ikeja"], "FCT": ["Abuja"], "Rivers": ["Port Harcourt"], "Kano": ["Kano"] }) },
  { code: "KE", name: "Kenya", dialCode: "254", currency: "KES", regionLabel: "County", regions: R({ "Nairobi": ["Nairobi"], "Mombasa": ["Mombasa"], "Kisumu": ["Kisumu"] }) },
  { code: "JP", name: "Japan", dialCode: "81", currency: "JPY", regionLabel: "Prefecture", regions: R({ "Tokyo": ["Tokyo"], "Osaka": ["Osaka"], "Kyoto": ["Kyoto"], "Kanagawa": ["Yokohama"] }) },
  { code: "PH", name: "Philippines", dialCode: "63", currency: "PHP", regionLabel: "Region", regions: R({ "Metro Manila": ["Manila", "Quezon City", "Makati"], "Cebu": ["Cebu City"], "Davao": ["Davao City"] }) },
  { code: "PK", name: "Pakistan", dialCode: "92", currency: "PKR", regionLabel: "Province", regions: R({ "Punjab": ["Lahore", "Faisalabad", "Rawalpindi"], "Sindh": ["Karachi", "Hyderabad"], "Islamabad": ["Islamabad"] }) },
  { code: "BD", name: "Bangladesh", dialCode: "880", currency: "BDT", regionLabel: "Division", regions: R({ "Dhaka": ["Dhaka"], "Chittagong": ["Chittagong"], "Sylhet": ["Sylhet"] }) },
  { code: "LK", name: "Sri Lanka", dialCode: "94", currency: "LKR", regionLabel: "Province", regions: R({ "Western": ["Colombo", "Negombo"], "Central": ["Kandy"], "Southern": ["Galle"] }) },
  { code: "NP", name: "Nepal", dialCode: "977", currency: "NPR", regionLabel: "Province", regions: R({ "Bagmati": ["Kathmandu", "Lalitpur"], "Gandaki": ["Pokhara"] }) },
  { code: "SA", name: "Saudi Arabia", dialCode: "966", currency: "SAR", regionLabel: "Province", regions: R({ "Riyadh": ["Riyadh"], "Makkah": ["Jeddah", "Mecca"], "Eastern Province": ["Dammam", "Khobar"] }) },
  { code: "QA", name: "Qatar", dialCode: "974", currency: "QAR", regionLabel: "Municipality", regions: R({ "Doha": ["Doha"], "Al Rayyan": ["Al Rayyan"] }) },
  { code: "MY", name: "Malaysia", dialCode: "60", currency: "MYR", regionLabel: "State", regions: R({ "Kuala Lumpur": ["Kuala Lumpur"], "Selangor": ["Petaling Jaya", "Shah Alam"], "Penang": ["George Town"], "Johor": ["Johor Bahru"] }) },
  { code: "ID", name: "Indonesia", dialCode: "62", currency: "IDR", regionLabel: "Province", regions: R({ "Jakarta": ["Jakarta"], "Bali": ["Denpasar", "Ubud"], "West Java": ["Bandung"], "East Java": ["Surabaya"] }) },
  { code: "TH", name: "Thailand", dialCode: "66", currency: "THB", regionLabel: "Province", regions: R({ "Bangkok": ["Bangkok"], "Chiang Mai": ["Chiang Mai"], "Phuket": ["Phuket"] }) },
  { code: "NZ", name: "New Zealand", dialCode: "64", currency: "NZD", regionLabel: "Region", regions: R({ "Auckland": ["Auckland"], "Wellington": ["Wellington"], "Canterbury": ["Christchurch"] }) },
  { code: "IE", name: "Ireland", dialCode: "353", currency: "EUR", regionLabel: "County", regions: R({ "Dublin": ["Dublin"], "Cork": ["Cork"], "Galway": ["Galway"] }) },
  { code: "PT", name: "Portugal", dialCode: "351", currency: "EUR", regionLabel: "District", regions: R({ "Lisbon": ["Lisbon"], "Porto": ["Porto"], "Faro": ["Faro"] }) },
  { code: "TR", name: "Turkey", dialCode: "90", currency: "TRY", regionLabel: "Province", regions: R({ "Istanbul": ["Istanbul"], "Ankara": ["Ankara"], "Izmir": ["Izmir"], "Antalya": ["Antalya"] }) },
  { code: "EG", name: "Egypt", dialCode: "20", currency: "EGP", regionLabel: "Governorate", regions: R({ "Cairo": ["Cairo"], "Giza": ["Giza"], "Alexandria": ["Alexandria"] }) },
  { code: "AR", name: "Argentina", dialCode: "54", currency: "ARS", regionLabel: "Province", regions: R({ "Buenos Aires": ["Buenos Aires"], "Córdoba": ["Córdoba"], "Santa Fe": ["Rosario"] }) },
  { code: "CO", name: "Colombia", dialCode: "57", currency: "COP", regionLabel: "Department", regions: R({ "Bogotá": ["Bogotá"], "Antioquia": ["Medellín"], "Valle del Cauca": ["Cali"] }) },
  { code: "KR", name: "South Korea", dialCode: "82", currency: "KRW", regionLabel: "Province", regions: R({ "Seoul": ["Seoul"], "Busan": ["Busan"], "Incheon": ["Incheon"] }) },
  { code: "CN", name: "China", dialCode: "86", currency: "CNY", regionLabel: "Province", regions: R({ "Beijing": ["Beijing"], "Shanghai": ["Shanghai"], "Guangdong": ["Guangzhou", "Shenzhen"] }) },
  { code: "HK", name: "Hong Kong", dialCode: "852", currency: "HKD", regionLabel: "District", regions: R({ "Hong Kong Island": ["Central", "Causeway Bay"], "Kowloon": ["Tsim Sha Tsui", "Mong Kok"] }) },
  // Countries below use free-text region/city.
  { code: "AF", name: "Afghanistan", dialCode: "93", currency: "AFN", regionLabel: "Province" },
  { code: "AT", name: "Austria", dialCode: "43", currency: "EUR", regionLabel: "State" },
  { code: "BE", name: "Belgium", dialCode: "32", currency: "EUR", regionLabel: "Region" },
  { code: "BH", name: "Bahrain", dialCode: "973", currency: "BHD", regionLabel: "Governorate" },
  { code: "CH", name: "Switzerland", dialCode: "41", currency: "CHF", regionLabel: "Canton" },
  { code: "CL", name: "Chile", dialCode: "56", currency: "CLP", regionLabel: "Region" },
  { code: "CZ", name: "Czechia", dialCode: "420", currency: "CZK", regionLabel: "Region" },
  { code: "DK", name: "Denmark", dialCode: "45", currency: "DKK", regionLabel: "Region" },
  { code: "ET", name: "Ethiopia", dialCode: "251", currency: "ETB", regionLabel: "Region" },
  { code: "FI", name: "Finland", dialCode: "358", currency: "EUR", regionLabel: "Region" },
  { code: "GH", name: "Ghana", dialCode: "233", currency: "GHS", regionLabel: "Region" },
  { code: "GR", name: "Greece", dialCode: "30", currency: "EUR", regionLabel: "Region" },
  { code: "HU", name: "Hungary", dialCode: "36", currency: "HUF", regionLabel: "County" },
  { code: "IL", name: "Israel", dialCode: "972", currency: "ILS", regionLabel: "District" },
  { code: "JM", name: "Jamaica", dialCode: "1", currency: "JMD", regionLabel: "Parish" },
  { code: "JO", name: "Jordan", dialCode: "962", currency: "JOD", regionLabel: "Governorate" },
  { code: "KW", name: "Kuwait", dialCode: "965", currency: "KWD", regionLabel: "Governorate" },
  { code: "LB", name: "Lebanon", dialCode: "961", currency: "LBP", regionLabel: "Governorate" },
  { code: "MA", name: "Morocco", dialCode: "212", currency: "MAD", regionLabel: "Region" },
  { code: "MU", name: "Mauritius", dialCode: "230", currency: "MUR", regionLabel: "District" },
  { code: "MV", name: "Maldives", dialCode: "960", currency: "MVR", regionLabel: "Atoll" },
  { code: "NO", name: "Norway", dialCode: "47", currency: "NOK", regionLabel: "County" },
  { code: "OM", name: "Oman", dialCode: "968", currency: "OMR", regionLabel: "Governorate" },
  { code: "PE", name: "Peru", dialCode: "51", currency: "PEN", regionLabel: "Region" },
  { code: "PL", name: "Poland", dialCode: "48", currency: "PLN", regionLabel: "Voivodeship" },
  { code: "RO", name: "Romania", dialCode: "40", currency: "RON", regionLabel: "County" },
  { code: "RU", name: "Russia", dialCode: "7", currency: "RUB", regionLabel: "Region" },
  { code: "SE", name: "Sweden", dialCode: "46", currency: "SEK", regionLabel: "County" },
  { code: "TT", name: "Trinidad and Tobago", dialCode: "1", currency: "TTD", regionLabel: "Region" },
  { code: "TZ", name: "Tanzania", dialCode: "255", currency: "TZS", regionLabel: "Region" },
  { code: "UA", name: "Ukraine", dialCode: "380", currency: "UAH", regionLabel: "Oblast" },
  { code: "UG", name: "Uganda", dialCode: "256", currency: "UGX", regionLabel: "Region" },
  { code: "VN", name: "Vietnam", dialCode: "84", currency: "VND", regionLabel: "Province" },
  { code: "ZW", name: "Zimbabwe", dialCode: "263", currency: "ZWL", regionLabel: "Province" },
  { code: "OTHER", name: "Other country", dialCode: "", currency: "USD", regionLabel: "Region" },
].sort((a, b) => (a.code === "OTHER" ? 1 : b.code === "OTHER" ? -1 : a.name.localeCompare(b.name)));

export const COUNTRY_BY_CODE: Record<string, Country> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export const DEFAULT_COUNTRY = "IN";

export const getCountry = (code?: string): Country => COUNTRY_BY_CODE[code ?? ""] ?? COUNTRY_BY_CODE.OTHER;
export const regionNames = (code?: string): string[] => Object.keys(getCountry(code).regions ?? {});
export const citiesOf = (code?: string, region?: string): string[] => getCountry(code).regions?.[region ?? ""] ?? [];

/** Popular quick-pick cities for the home page hero. */
export const FEATURED_CITIES: { city: string; country: string }[] = [
  { city: "Mumbai", country: "IN" }, { city: "New Delhi", country: "IN" }, { city: "Bengaluru", country: "IN" },
  { city: "Dubai", country: "AE" }, { city: "London", country: "GB" }, { city: "New York City", country: "US" },
  { city: "Los Angeles", country: "US" }, { city: "Toronto", country: "CA" }, { city: "Sydney", country: "AU" },
  { city: "Singapore", country: "SG" }, { city: "Lagos", country: "NG" }, { city: "São Paulo", country: "BR" },
];

// ---------------------------------------------------------------- Phones
/** Normalise any user input to E.164 digits (no "+"). */
export function toE164Digits(input: string, dialCode: string): string {
  const raw = input.trim();
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+") || raw.startsWith("00")) return digits.replace(/^00/, "");
  digits = digits.replace(/^0+/, ""); // trunk prefix
  return dialCode && !digits.startsWith(dialCode) ? `${dialCode}${digits}` : digits;
}

/** E.164 allows 8–15 digits including the country code. */
export const isValidE164 = (digits: string) => /^\d{8,15}$/.test(digits);

export function formatPhoneDisplay(digits: string): string {
  return digits ? `+${digits}` : "";
}

// ------------------------------------------------------------- Languages
export const LANGUAGES = [
  "English", "Hindi", "Spanish", "French", "Arabic", "Portuguese", "German", "Italian", "Mandarin", "Cantonese",
  "Japanese", "Korean", "Russian", "Turkish", "Dutch", "Swahili", "Tagalog", "Malay", "Indonesian", "Thai", "Vietnamese",
  "Urdu", "Bengali", "Punjabi", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Nepali", "Sinhala", "Yoruba", "Zulu", "Hebrew", "Greek", "Polish",
];
