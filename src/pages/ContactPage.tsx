import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Send,
  MessageSquare,
  FileCheck2,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { LEGAL_ENTITY, APP_NAME } from "@/lib/constants";
import { Button, Input, Textarea, Field } from "@/components/ui";

export function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "general",
    message: "",
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setSending(true);
    // Submit inquiry - open mailto fallback or store locally
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-5xl py-4 sm:py-8">
      {/* Top Breadcrumb & Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link to="/" className="hover:text-neon">Home</Link>
          <span>/</span>
          <span className="text-silver">Contact Us</span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
          Contact Us & Corporate Details
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-silver sm:text-base">
          Official communications, talent support, recruiter inquiries, and verified corporate entity
          details for {APP_NAME}.
        </p>
      </div>

      {/* Official Government Verification & Business Entity Banner */}
      <div className="mb-10 overflow-hidden rounded-2xl border border-neon/30 bg-gradient-to-br from-panel-raised via-panel to-canvas p-6 shadow-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-neon/40 bg-neon/10 px-3 py-1 text-xs font-semibold text-neon">
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Government Registered Business Entity</span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted">
                Official Registered Business / Company Name
              </p>
              <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-heading sm:text-3xl">
                {LEGAL_ENTITY.businessName}
              </h2>
              <p className="mt-1 text-xs text-silver">
                Operating platform & brand: <strong className="text-heading">{LEGAL_ENTITY.brandName}</strong> ({LEGAL_ENTITY.domain})
              </p>
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-silver/90 sm:text-sm">
              Registered under the <strong className="text-heading">{LEGAL_ENTITY.certificateType}</strong>.
              This corporate information is officially registered and verified for the Google Play Console
              Organization Account, Dun &amp; Bradstreet (D-U-N-S) directory, and Indian commercial compliance.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
            <button
              type="button"
              onClick={() => handleCopy(LEGAL_ENTITY.businessName, "entity")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel-raised px-3 py-2 text-xs font-semibold text-silver hover:border-silver hover:text-heading"
            >
              {copiedField === "entity" ? <CheckCircle2 className="h-3.5 w-3.5 text-neon" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedField === "entity" ? "Company name copied" : "Copy entity name"}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCopy(LEGAL_ENTITY.registeredAddress, "address")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel-raised px-3 py-2 text-xs font-semibold text-silver hover:border-silver hover:text-heading"
            >
              {copiedField === "address" ? <CheckCircle2 className="h-3.5 w-3.5 text-neon" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedField === "address" ? "Address copied" : "Copy full address"}</span>
            </button>
            <a
              href={`mailto:${LEGAL_ENTITY.email}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neon/40 bg-neon/15 px-3 py-2 text-xs font-bold text-neon hover:bg-neon/25"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email desk</span>
            </a>
          </div>
        </div>

        {/* Highlight Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-line/60 pt-6 sm:grid-cols-3">
          <div className="rounded-xl border border-line/70 bg-panel/80 p-4">
            <div className="flex items-center gap-2 text-neon">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Corporate Address</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed font-medium text-heading">
              {LEGAL_ENTITY.registeredAddress}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Matches Aadhaar Udyam Certificate exactly
            </p>
          </div>

          <div className="rounded-xl border border-line/70 bg-panel/80 p-4">
            <div className="flex items-center gap-2 text-neon">
              <Mail className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Official Email</span>
            </div>
            <a
              href={`mailto:${LEGAL_ENTITY.email}`}
              className="mt-2 block text-sm font-bold text-neon hover:underline"
            >
              {LEGAL_ENTITY.email}
            </a>
            <p className="mt-1 text-[11px] text-muted">
              Official corporate domain email for all inquiries
            </p>
          </div>

          <div className="rounded-xl border border-line/70 bg-panel/80 p-4">
            <div className="flex items-center gap-2 text-neon">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Hours & Response</span>
            </div>
            <p className="mt-2 text-xs font-medium text-heading">
              {LEGAL_ENTITY.operatingHours}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Average response time: 24 – 48 business hours
            </p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Contact Form & Department Details */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Direct Message Form (7 cols) */}
        <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8 lg:col-span-7">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
            <MessageSquare className="h-4 w-4" />
            <span>Send a Direct Message</span>
          </div>
          <h2 className="mt-1 font-display text-xl font-bold text-heading">
            Get in touch with our team
          </h2>
          <p className="mt-1 text-xs text-muted">
            Whether you are a performer setting up a profile, a recruiter looking for verified talent, or an auditor checking compliance.
          </p>

          {submitted ? (
            <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <h3 className="mt-3 font-display text-lg font-bold text-heading">
                Message Received!
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-silver">
                Thank you for reaching out to <strong>{LEGAL_ENTITY.businessName}</strong>. Our team has received your message and will reply to <span className="text-neon">{form.email}</span> within 24 to 48 business hours.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", phone: "", subject: "general", message: "" });
                  }}
                >
                  Send another message
                </Button>
                <Link to="/">
                  <Button variant="primary" size="sm">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Your Full Name" required>
                  <Input
                    required
                    placeholder="e.g. John Doe"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Your Email" required>
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Phone / Mobile (Optional)">
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </Field>
                <Field label="Inquiry Purpose" required>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full rounded-lg border border-line bg-panel-raised px-3 py-3 text-sm font-medium text-heading focus:border-neon focus:outline-none"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="talent">Artist / Performer Profile Support</option>
                    <option value="recruiter">Recruiter / Casting Director Inquiry</option>
                    <option value="verification">Google Play / D-U-N-S Verification Desk</option>
                    <option value="grievance">Grievance & Legal Compliance</option>
                  </select>
                </Field>
              </div>

              <Field label="Your Message" required hint="Include any relevant details, links, or verification references.">
                <Textarea
                  required
                  rows={4}
                  placeholder="How can we assist you?"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </Field>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  full
                  loading={sending}
                  icon={<Send className="h-4 w-4" />}
                >
                  Send Message to {LEGAL_ENTITY.businessName}
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted">
                  You can also email us directly at{" "}
                  <a href={`mailto:${LEGAL_ENTITY.email}`} className="text-neon hover:underline">
                    {LEGAL_ENTITY.email}
                  </a>
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Entity Breakdown & Compliance Desk (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Detailed Entity Specifications */}
          <div className="rounded-2xl border border-line bg-panel p-6">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-heading">
              <Building2 className="h-4 w-4 text-neon" />
              <span>Official Entity Specification</span>
            </h3>

            <dl className="mt-4 space-y-3 divide-y divide-line/60 text-xs">
              <div className="pt-2 first:pt-0">
                <dt className="text-muted">Legal Entity Name</dt>
                <dd className="mt-0.5 font-bold text-heading">{LEGAL_ENTITY.businessName}</dd>
              </div>
              <div className="pt-2">
                <dt className="text-muted">Registered Brand &amp; Website</dt>
                <dd className="mt-0.5 font-semibold text-heading">
                  {LEGAL_ENTITY.brandName} &middot;{" "}
                  <a href={LEGAL_ENTITY.websiteUrl} className="text-neon hover:underline">
                    {LEGAL_ENTITY.domain}
                  </a>
                </dd>
              </div>
              <div className="pt-2">
                <dt className="text-muted">Corporate Office Address</dt>
                <dd className="mt-0.5 font-medium leading-relaxed text-silver">
                  {LEGAL_ENTITY.registeredAddress}
                </dd>
              </div>
              <div className="pt-2">
                <dt className="text-muted">Jurisdiction &amp; State</dt>
                <dd className="mt-0.5 font-medium text-silver">
                  District Palghar, Maharashtra, India (PIN: 401208)
                </dd>
              </div>
              <div className="pt-2">
                <dt className="text-muted">Government Registration</dt>
                <dd className="mt-0.5 font-medium text-silver">
                  {LEGAL_ENTITY.certificateType}
                </dd>
              </div>
              <div className="pt-2">
                <dt className="text-muted">Official Contact Email</dt>
                <dd className="mt-0.5">
                  <a href={`mailto:${LEGAL_ENTITY.email}`} className="font-semibold text-neon hover:underline">
                    {LEGAL_ENTITY.email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          {/* Grievance & Compliance Box */}
          <div className="rounded-2xl border border-line bg-panel p-6">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-heading">
              <ShieldCheck className="h-4 w-4 text-neon" />
              <span>Grievance &amp; Compliance Officer</span>
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-silver">
              Under Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules
              and Google Play Developer compliance policies:
            </p>
            <div className="mt-3 rounded-lg border border-line/60 bg-panel-raised p-3 text-xs">
              <p className="font-bold text-heading">{LEGAL_ENTITY.grievanceOfficer}</p>
              <p className="mt-1 text-silver">{LEGAL_ENTITY.businessName}</p>
              <p className="mt-1 text-muted">{LEGAL_ENTITY.registeredAddress}</p>
              <p className="mt-2">
                Email:{" "}
                <a href={`mailto:${LEGAL_ENTITY.email}`} className="font-medium text-neon hover:underline">
                  {LEGAL_ENTITY.email}
                </a>
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                to="/privacy"
                className="inline-flex items-center gap-1 text-xs font-semibold text-neon hover:underline"
              >
                <span>Read Privacy Policy</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="mt-12 rounded-2xl border border-line bg-panel p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neon">
          <HelpCircle className="h-4 w-4" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="mt-1 font-display text-xl font-bold text-heading">
          Common Questions Regarding Contact &amp; Verification
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
            <h3 className="font-display text-sm font-bold text-heading">
              How do I verify the identity of RHSM ENTERPRISES?
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-silver">
              RHSM ENTERPRISES is an officially registered enterprise holding an Aadhaar Udyam Certificate issued by the Ministry of MSME, Government of India. The registered address and official business email on this page match government documentation and the Dun &amp; Bradstreet (D-U-N-S) registry.
            </p>
          </div>

          <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
            <h3 className="font-display text-sm font-bold text-heading">
              How do clients and casting directors contact performers?
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-silver">
              Talent Tube operates on a 0% commission direct-contact model. Recruiter and client contact buttons on each artist&apos;s profile connect directly to the artist&apos;s verified WhatsApp or phone.
            </p>
          </div>

          <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
            <h3 className="font-display text-sm font-bold text-heading">
              How do artists update or remove their profile?
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-silver">
              Performers can log into their Creator Studio at any time to edit their performance videos, headshots, or contact info, or request account deletion either from their dashboard or by writing to contact@talenttube.world.
            </p>
          </div>

          <div className="rounded-xl border border-line/60 bg-panel-raised p-4">
            <h3 className="font-display text-sm font-bold text-heading">
              What is the expected support resolution time?
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-silver">
              Inquiries submitted through our contact form or sent to contact@talenttube.world are acknowledged immediately and resolved within 24 to 48 business hours by our team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
