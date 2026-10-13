import { Link } from "react-router-dom";
import { Scale } from "lucide-react";
import { LEGAL_ENTITY, APP_NAME } from "@/lib/constants";

export function TermsPage() {
  return (
    <div className="mx-auto max-w-5xl py-4 sm:py-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link to="/" className="hover:text-neon">Home</Link>
        <span>/</span>
        <span className="text-silver">Terms of Service</span>
      </div>

      <div className="mb-10 overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-panel-raised via-panel to-canvas p-6 shadow-xl sm:p-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-semibold text-neon">
          <Scale className="h-3.5 w-3.5" />
          <span>Platform Terms &amp; Conditions</span>
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-silver sm:text-base">
          These Terms of Service govern your access to and use of <strong className="text-heading">{APP_NAME}</strong>, operated by <strong className="text-heading">{LEGAL_ENTITY.businessName}</strong>.
        </p>
      </div>

      <div className="space-y-8 rounded-2xl border border-line bg-panel p-6 sm:p-10 text-sm leading-relaxed text-silver">
        <section>
          <h2 className="font-display text-xl font-bold text-heading">1. Legal Entity &amp; Platform Scope</h2>
          <p className="mt-2">
            The platform {APP_NAME} (<a href={LEGAL_ENTITY.websiteUrl} className="text-neon hover:underline">{LEGAL_ENTITY.domain}</a>) is owned and operated by <strong>{LEGAL_ENTITY.businessName}</strong>, located at <strong>{LEGAL_ENTITY.registeredAddress}</strong>.
          </p>
          <p className="mt-2">
            {APP_NAME} provides an online showcase enabling creative talents to create public profiles displaying their performance clips, headshots, and direct contact details, and enabling recruiters and clients to discover and book performers without platform commission.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-heading">2. Direct Contact &amp; Zero Commission Model</h2>
          <p className="mt-2">
            {APP_NAME} does not act as an employment agency, middleman, or booking broker. We do not deduct commission from artists or fees paid between clients and performers. Any performance contracts, gig agreements, and payment schedules are concluded directly between the client and the artist.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-heading">3. Performer Responsibilities &amp; Content Guidelines</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-silver">
            <li>Performers must only submit video content, audio tracks, and imagery that they own or have the full legal right to display.</li>
            <li>Content that is defamatory, obscene, harassing, infringing on copyright, or violating local laws will be removed immediately.</li>
            <li>Performers are responsible for maintaining accurate contact details (phone, WhatsApp, and email).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-heading">4. Intellectual Property</h2>
          <p className="mt-2 text-xs">
            Artists retain full ownership of their artistic recordings and videos. By creating a published profile on {APP_NAME}, you grant {LEGAL_ENTITY.businessName} a non-exclusive license to display your submitted portfolio on the platform for public discovery and promotional features.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-heading">5. Governing Law &amp; Jurisdiction</h2>
          <p className="mt-2 text-xs">
            These terms are governed by the laws of India. Any disputes arising out of the use of this website shall be subject to the exclusive jurisdiction of the competent courts in Palghar / Maharashtra, India.
          </p>
        </section>

        <section className="rounded-xl border border-line/60 bg-panel-raised p-5 text-xs space-y-2">
          <p className="font-bold text-heading">Official Business Contact:</p>
          <p className="text-silver"><strong>Entity Name:</strong> {LEGAL_ENTITY.businessName}</p>
          <p className="text-silver"><strong>Registered Address:</strong> {LEGAL_ENTITY.registeredAddress}</p>
          <p className="text-silver">
            <strong>Email:</strong>{" "}
            <a href={`mailto:${LEGAL_ENTITY.email}`} className="text-neon hover:underline font-bold">
              {LEGAL_ENTITY.email}
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
