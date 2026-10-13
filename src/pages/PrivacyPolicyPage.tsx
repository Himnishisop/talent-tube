import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  Lock,
  Eye,
  Database,
  UserCheck,
  Video,
  FileText,
  Mail,
  Building2,
  Calendar,
  CheckCircle,
  HelpCircle,
  Trash2,
  Share2,
} from "lucide-react";
import { LEGAL_ENTITY, APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui";

export function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState<string>("intro");

  const lastUpdated = "October 13, 2026";
  const effectiveDate = "October 13, 2026";

  const sections = [
    { id: "intro", title: "1. Introduction & Operating Entity" },
    { id: "collection", title: "2. Information We Collect" },
    { id: "talent-submissions", title: "3. Talent & Video Submissions" },
    { id: "how-we-use", title: "4. How We Use Information" },
    { id: "protection", title: "5. How Data Is Protected" },
    { id: "third-parties", title: "6. Third-Party Integrations & YouTube" },
    { id: "user-rights", title: "7. Your Rights & Account Deletion" },
    { id: "minors", title: "8. Minors & Young Performers" },
    { id: "cookies", title: "9. Cookies & Local Data" },
    { id: "contact-desk", title: "10. Grievance Redressal & Contact" },
  ];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="mx-auto max-w-5xl py-4 sm:py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link to="/" className="hover:text-neon">Home</Link>
        <span>/</span>
        <span className="text-silver">Privacy Policy</span>
      </div>

      {/* Header Banner */}
      <div className="relative mb-10 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-panel-raised via-panel to-canvas p-6 shadow-xl sm:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-semibold text-neon">
              <Shield className="h-3.5 w-3.5" />
              <span>User Data Protection &amp; Legal Compliance</span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-silver sm:text-base">
              At <strong className="text-heading">{APP_NAME}</strong> (<a href={LEGAL_ENTITY.websiteUrl} className="text-neon hover:underline">{LEGAL_ENTITY.domain}</a>), operated by <strong className="text-heading">{LEGAL_ENTITY.businessName}</strong>, we respect your privacy, value transparency, and are firmly committed to safeguarding the personal information and media submissions of our performers, talent scouts, and visitors.
            </p>
          </div>

          <div className="shrink-0 space-y-2 rounded-xl border border-line/70 bg-panel/80 p-4 text-xs">
            <div className="flex items-center gap-2 text-muted">
              <Calendar className="h-3.5 w-3.5 text-neon" />
              <span>Effective Date: <strong>{effectiveDate}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Calendar className="h-3.5 w-3.5 text-neon" />
              <span>Last Updated: <strong>{lastUpdated}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <Building2 className="h-3.5 w-3.5 text-neon" />
              <span>Entity: <strong>{LEGAL_ENTITY.businessName}</strong></span>
            </div>
          </div>
        </div>

        {/* Quick entity verification box */}
        <div className="mt-8 rounded-xl border border-neon/20 bg-neon/5 p-4 text-xs text-silver">
          <p>
            <strong className="text-heading">Official Organization Notice:</strong> This policy applies to all web and mobile software platforms provided under the brand <strong>{APP_NAME}</strong>, owned and operated by <strong>{LEGAL_ENTITY.businessName}</strong>, registered at {LEGAL_ENTITY.registeredAddress}. This document complies with Google Play Console Developer Program policies, the Dun &amp; Bradstreet verification framework, and applicable Indian Information Technology data privacy provisions.
          </p>
        </div>
      </div>

      {/* Two Column Layout: Navigation & Policy Body */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-2xl border border-line bg-panel p-5">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-muted">
              Table of Contents
            </h2>
            <nav className="mt-4 space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${
                    activeSection === s.id
                      ? "border border-neon/30 bg-neon/15 font-bold text-neon shadow-sm"
                      : "text-silver hover:bg-panel-raised hover:text-heading"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </nav>

            <div className="mt-6 border-t border-line/60 pt-4">
              <p className="text-[11px] text-muted">Questions or need account assistance?</p>
              <a
                href={`mailto:${LEGAL_ENTITY.email}`}
                className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-neon hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>{LEGAL_ENTITY.email}</span>
              </a>
            </div>
          </div>
        </aside>

        {/* Policy Content */}
        <main className="space-y-10 text-sm leading-relaxed text-silver lg:col-span-8">
          {/* Section 1 */}
          <section id="intro" className="scroll-mt-24 rounded-2xl border border-line bg-panel p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
              <Building2 className="h-4 w-4" />
              <span>Section 1</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-heading">
              1. Introduction &amp; Operating Entity
            </h2>
            <div className="mt-4 space-y-3">
              <p>
                Welcome to <strong>{APP_NAME}</strong> (hosted at <a href={LEGAL_ENTITY.websiteUrl} className="text-neon hover:underline">{LEGAL_ENTITY.domain}</a>). {APP_NAME} is an online talent hunt, discovery, and artist showcase platform designed to connect independent creative professionals (singers, musicians, dancers, DJs, photographers, magicians, emcees, and entertainers) directly with event organizers, wedding planners, casting directors, and clients with zero middleman commissions.
              </p>
              <p>
                This Privacy Policy is issued by and legally binds:
              </p>
              <div className="rounded-xl border border-line/70 bg-panel-raised p-4 text-xs">
                <p className="font-bold text-heading">{LEGAL_ENTITY.businessName}</p>
                <p className="mt-1 text-silver"><strong>Corporate Address:</strong> {LEGAL_ENTITY.registeredAddress}</p>
                <p className="mt-0.5 text-silver"><strong>Official Email:</strong> {LEGAL_ENTITY.email}</p>
                <p className="mt-0.5 text-silver"><strong>Registration:</strong> {LEGAL_ENTITY.certificateType}</p>
              </div>
              <p>
                Throughout this policy, references to &quot;we&quot;, &quot;our&quot;, &quot;us&quot;, or &quot;the Platform&quot; refer to <strong>{LEGAL_ENTITY.businessName}</strong> and <strong>{APP_NAME}</strong>. By accessing our website, creating a talent profile, submitting talent clips, or browsing the directory, you acknowledge that you have read, understood, and agreed to this Privacy Policy.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="collection" className="scroll-mt-24 rounded-2xl border border-line bg-panel p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
              <Database className="h-4 w-4" />
              <span>Section 2</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-heading">
              2. Information We Collect
            </h2>
            <div className="mt-4 space-y-4">
              <p>
                To provide our talent showcase, direct client contact features, and account security, we collect information that you directly provide to us as well as limited technical data required for website operation:
              </p>

              <div className="space-y-3">
                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <h3 className="font-display text-sm font-bold text-heading">
                    A. Artist &amp; Performer Registration Details
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-silver">
                    <li><strong>Personal Identity:</strong> Full legal name, artist or stage name, and profile biography.</li>
                    <li><strong>Contact Information:</strong> Valid email address, mobile phone number, and direct WhatsApp contact number (used solely for direct booking inquiries from clients).</li>
                    <li><strong>Creative Categorization:</strong> Performing discipline (e.g. Singer, Guitarist, Dancer, DJ), specific sub-specialties, regional musical traditions, and performance styles.</li>
                    <li><strong>Location &amp; Experience:</strong> City, state, primary operating region, and approximate years of active industry experience.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <h3 className="font-display text-sm font-bold text-heading">
                    B. Authentication &amp; Account Data
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-silver">
                    <li>Securely hashed account passwords or Google OAuth federated tokens (when choosing to &quot;Sign in with Google&quot;).</li>
                    <li>Account creation timestamps, last login timestamps, and verification audit logs.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <h3 className="font-display text-sm font-bold text-heading">
                    C. Technical &amp; Usage Information
                  </h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-silver">
                    <li>Device metadata (operating system, browser family, screen resolution).</li>
                    <li>IP address, approximate geographic city/region, and referral headers.</li>
                    <li>Performance logs and page response timings used to ensure smooth playback and low-latency browsing on all devices.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="talent-submissions" className="scroll-mt-24 rounded-2xl border border-line bg-panel p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
              <Video className="h-4 w-4" />
              <span>Section 3</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-heading">
              3. Talent &amp; Video Submissions
            </h2>
            <div className="mt-4 space-y-4">
              <p>
                {APP_NAME} is specifically built to highlight talent through performance videos and portfolio showcases. We handle creative submissions with care:
              </p>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <h3 className="font-display text-sm font-bold text-heading">
                    Performance Videos via YouTube Integration
                  </h3>
                  <p className="mt-1 text-silver">
                    Performers link their live stage sets, singing recordings, auditions, or demo reels via YouTube video links or channel authorization. We store only the public YouTube Video ID, title, and thumbnail reference. Video playback is rendered via official YouTube embedded players, adhering strictly to the YouTube Developer Terms of Service and Google Privacy Policy.
                  </p>
                </div>

                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <h3 className="font-display text-sm font-bold text-heading">
                    Profile Photos, Headshots &amp; Automated Optimization
                  </h3>
                  <p className="mt-1 text-silver">
                    When performers upload profile pictures or headshots, images are client-side downscaled and compressed to web-standard resolutions before being safely stored on enterprise-grade <strong>Cloudflare R2 Object Storage</strong>. This protects performer bandwidth, saves storage, and prevents unauthorized downloading of raw high-resolution master photographs.
                  </p>
                </div>

                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <h3 className="font-display text-sm font-bold text-heading">
                    Public Visibility by Design
                  </h3>
                  <p className="mt-1 text-silver">
                    Because {APP_NAME} is a talent hunt and discovery portal, profiles designated as &quot;Published&quot; are publicly viewable by prospective clients, talent scouts, and recruiters. You can toggle your profile to unlisted, draft, or delete it at any time directly in your Creator Studio.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="how-we-use" className="scroll-mt-24 rounded-2xl border border-line bg-panel p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
              <Eye className="h-4 w-4" />
              <span>Section 4</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-heading">
              4. How We Use Your Information
            </h2>
            <div className="mt-4 space-y-3">
              <p>
                We use the collected information exclusively for legitimate purposes connected to the operation of the talent hunt service:
              </p>
              <ul className="list-inside list-disc space-y-2 text-xs text-silver">
                <li><strong>Enabling Talent Discovery:</strong> To index, search, and showcase creative professionals by discipline, skill level, and location in our public directory.</li>
                <li><strong>Direct Client Communication:</strong> To power the direct &quot;Call&quot; and &quot;WhatsApp&quot; contact buttons on your profile, enabling recruiters to reach you directly with 0% platform commissions.</li>
                <li><strong>Creator Studio Management:</strong> To provide you with self-service controls to upload, update, edit, or delete your video links, photos, bios, and rates.</li>
                <li><strong>Account Security &amp; Fraud Prevention:</strong> To prevent duplicate, fraudulent, or impersonation profiles, combat spam, and enforce our Community Standards.</li>
                <li><strong>Compliance &amp; Verification:</strong> To fulfill the verification standards required for Google Play Console Organization Accounts, Dun &amp; Bradstreet verification audits, and legal record-keeping.</li>
              </ul>
              <p className="font-medium text-heading">
                We do NOT sell, rent, monetize, or trade your personal data to data brokers or third-party marketing companies.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="protection" className="scroll-mt-24 rounded-2xl border border-line bg-panel p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
              <Lock className="h-4 w-4" />
              <span>Section 5</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-heading">
              5. How Data Is Protected
            </h2>
            <div className="mt-4 space-y-4">
              <p>
                {LEGAL_ENTITY.businessName} implements comprehensive technical, administrative, and physical safeguards to protect user data from unauthorized access, accidental loss, alteration, or disclosure:
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <div className="flex items-center gap-2 text-neon">
                    <Shield className="h-4 w-4" />
                    <span className="font-bold">Encryption in Transit</span>
                  </div>
                  <p className="mt-2 text-silver">
                    All network traffic between your device and our servers is encrypted using modern TLS 1.3 / HTTPS encryption.
                  </p>
                </div>

                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <div className="flex items-center gap-2 text-neon">
                    <Database className="h-4 w-4" />
                    <span className="font-bold">Encrypted Cloud Storage</span>
                  </div>
                  <p className="mt-2 text-silver">
                    Artist photos are stored on secure Cloudflare R2 object storage with granular API authentication and access tokens.
                  </p>
                </div>

                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <div className="flex items-center gap-2 text-neon">
                    <Lock className="h-4 w-4" />
                    <span className="font-bold">Role-Based Access Control</span>
                  </div>
                  <p className="mt-2 text-silver">
                    Backend databases and administrative functions are protected by strict role-based access controls and salted password hashing.
                  </p>
                </div>

                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <div className="flex items-center gap-2 text-neon">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-bold">Zero Financial Storage</span>
                  </div>
                  <p className="mt-2 text-silver">
                    We never store raw credit card numbers, CVVs, or bank account credentials. All subscription transactions are processed by certified PCI-DSS payment gateways.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="third-parties" className="scroll-mt-24 rounded-2xl border border-line bg-panel p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
              <Share2 className="h-4 w-4" />
              <span>Section 6</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-heading">
              6. Third-Party Integrations &amp; YouTube API Services
            </h2>
            <div className="mt-4 space-y-3">
              <p>
                To provide audio-visual playback and secure account verification, {APP_NAME} interacts with trusted industry services:
              </p>
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <p className="font-bold text-heading">YouTube API Client &amp; Player</p>
                  <p className="mt-1 text-silver">
                    {APP_NAME} utilizes YouTube API Services to allow artists to select, showcase, and embed their performance videos. By using {APP_NAME}, users also agree to be bound by the{" "}
                    <a
                      href="https://www.youtube.com/t/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neon hover:underline"
                    >
                      YouTube Terms of Service
                    </a>{" "}
                    and the{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neon hover:underline"
                    >
                      Google Privacy Policy
                    </a>. We do not access private user YouTube data without explicit authorization.
                  </p>
                </div>

                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <p className="font-bold text-heading">Google OAuth &amp; Sign-In</p>
                  <p className="mt-1 text-silver">
                    When you use Google Sign-In, Google securely verifies your email and provides us with your verified email and name to create your account. We never receive or store your Google password.
                  </p>
                </div>

                <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
                  <p className="font-bold text-heading">Cloudflare R2 &amp; CDN</p>
                  <p className="mt-1 text-silver">
                    We use Cloudflare R2 infrastructure for fast, global, encrypted media asset hosting and DDoS mitigation.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="user-rights" className="scroll-mt-24 rounded-2xl border border-line bg-panel p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
              <UserCheck className="h-4 w-4" />
              <span>Section 7</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-heading">
              7. Your Rights &amp; Permanent Account Deletion
            </h2>
            <div className="mt-4 space-y-4">
              <p>
                We believe you should always maintain full ownership and control over your creative portfolio and personal identity:
              </p>

              <div className="space-y-3 text-xs">
                <div className="flex items-start gap-3 rounded-xl border border-line/60 bg-panel-raised p-4">
                  <Eye className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
                  <div>
                    <h4 className="font-bold text-heading">Right to Access &amp; Portability</h4>
                    <p className="mt-1 text-silver">You can view your complete profile, bio, submitted videos, and performance information anytime in your Creator Studio.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-line/60 bg-panel-raised p-4">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-neon" />
                  <div>
                    <h4 className="font-bold text-heading">Right to Rectification &amp; Edits</h4>
                    <p className="mt-1 text-silver">You can modify, update, or replace any uploaded photo, YouTube video, contact number, or text whenever you wish.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4">
                  <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <div>
                    <h4 className="font-bold text-heading">Right to Erasure &amp; Complete Profile Deletion</h4>
                    <p className="mt-1 text-silver">
                      Under Google Play policy and data privacy laws, you have the right to request permanent deletion of your profile, all submitted videos, uploaded images, and personal data. You can delete your profile directly in Creator Studio or write to{" "}
                      <a href={`mailto:${LEGAL_ENTITY.email}`} className="text-neon hover:underline font-bold">
                        {LEGAL_ENTITY.email}
                      </a>{" "}
                      with the subject &quot;Request Account Deletion&quot;. All records will be permanently purged within 7 business days.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section id="minors" className="scroll-mt-24 rounded-2xl border border-line bg-panel p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
              <HelpCircle className="h-4 w-4" />
              <span>Section 8</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-heading">
              8. Minors &amp; Young Performers
            </h2>
            <div className="mt-4 space-y-3">
              <p>
                {APP_NAME} celebrates young prodigies and budding talents (such as junior singers, dancers, and instrumentalists). However, protecting children&apos;s privacy is of paramount importance:
              </p>
              <ul className="list-inside list-disc space-y-2 text-xs text-silver">
                <li>Performers under 18 years of age must create and maintain profiles only with the verifiable consent and active management of a parent or legal guardian.</li>
                <li>Direct contact phone numbers and WhatsApp links on profiles of minors must belong to the parent, guardian, or official talent agency representing the performer.</li>
                <li>If we learn that personal data of a minor was submitted without appropriate parental authorization, we will promptly delete the data upon notification at <a href={`mailto:${LEGAL_ENTITY.email}`} className="text-neon hover:underline">{LEGAL_ENTITY.email}</a>.</li>
              </ul>
            </div>
          </section>

          {/* Section 9 */}
          <section id="cookies" className="scroll-mt-24 rounded-2xl border border-line bg-panel p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
              <Database className="h-4 w-4" />
              <span>Section 9</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-heading">
              9. Cookies &amp; Local Storage
            </h2>
            <div className="mt-4 space-y-3">
              <p>
                We use strictly functional browser storage mechanisms:
              </p>
              <ul className="list-inside list-disc space-y-2 text-xs text-silver">
                <li><strong>Authentication Tokens:</strong> Secure tokens stored locally to keep you logged in to your Creator Studio.</li>
                <li><strong>UI Preferences:</strong> User preferences such as selected language (English, Hindi, etc.) and player state.</li>
                <li><strong>No Invasive Advertising Trackers:</strong> We do not employ third-party tracking beacons that stalk users across unrelated websites.</li>
              </ul>
            </div>
          </section>

          {/* Section 10 */}
          <section id="contact-desk" className="scroll-mt-24 rounded-2xl border border-line bg-panel p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
              <Building2 className="h-4 w-4" />
              <span>Section 10</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-heading">
              10. Grievance Redressal &amp; Official Contact
            </h2>
            <div className="mt-4 space-y-4">
              <p>
                If you have any questions, feedback, grievance, or verification queries concerning this Privacy Policy or our data practices, please contact our designated Grievance &amp; Compliance Desk:
              </p>

              <div className="rounded-xl border border-neon/30 bg-panel-raised p-6 text-xs space-y-2">
                <p className="font-bold text-base text-heading">{LEGAL_ENTITY.businessName}</p>
                <p className="text-silver"><strong>Brand / Service:</strong> {LEGAL_ENTITY.brandName} (<a href={LEGAL_ENTITY.websiteUrl} className="text-neon hover:underline">{LEGAL_ENTITY.domain}</a>)</p>
                <p className="text-silver"><strong>Corporate Address:</strong> {LEGAL_ENTITY.registeredAddress}</p>
                <p className="text-silver"><strong>Jurisdiction:</strong> Palghar, Maharashtra, India - 401208</p>
                <p className="text-silver"><strong>Compliance Desk:</strong> {LEGAL_ENTITY.grievanceOfficer}</p>
                <p className="text-silver">
                  <strong>Official Contact Email:</strong>{" "}
                  <a href={`mailto:${LEGAL_ENTITY.email}`} className="font-bold text-neon hover:underline">
                    {LEGAL_ENTITY.email}
                  </a>
                </p>
                <p className="text-muted pt-2 border-t border-line/60">
                  We acknowledge all formal inquiries within 24 hours and resolve grievance requests within 15 business days under applicable regulations.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/contact">
                  <Button variant="primary" size="sm">
                    Go to Contact Us Page
                  </Button>
                </Link>
                <a href={`mailto:${LEGAL_ENTITY.email}`}>
                  <Button variant="secondary" size="sm" icon={<Mail className="h-4 w-4" />}>
                    Email Compliance Team
                  </Button>
                </a>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
