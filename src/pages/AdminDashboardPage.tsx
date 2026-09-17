import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Users, CreditCard, Flag, LayoutGrid, Search, BadgeCheck, Star, Trash2, Eye, Plus, Pencil, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/useCategories";
import { dataService } from "@/services";
import type { Category, Payment, ProfileStatus, Report, Talent } from "@/lib/types";
import { Avatar, Badge, Button, Empty, Field, Input, Select, Spinner, StatusBadge, SubBadge, Textarea } from "@/components/ui";
import { cn } from "@/utils/cn";
import { CategoryIcon, CATEGORY_ICON_KEYS } from "@/components/CategoryIcon";
import { formatDate, formatMoney } from "@/lib/pricing";
import { COUNTRIES, getCountry } from "@/lib/geo";

type Tab = "talents" | "subscriptions" | "payments" | "reports" | "categories";
const fmt = (iso?: string) => formatDate(iso, { day: "2-digit", month: "short", year: "numeric" });

export function AdminDashboardPage() {
  const { user } = useAuth();
  const { allCategories, invalidate } = useCategories();
  const [tab, setTab] = useState<Tab>("talents");
  const [talents, setTalents] = useState<Talent[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>(allCategories);

  const load = useCallback(async () => {
    const [t, p, r, c] = await Promise.all([dataService.listAllTalents(), dataService.listPayments(), dataService.listReports(), dataService.listCategories()]);
    setTalents(t);
    setPayments(p);
    setReports(r);
    setCategories(c);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const all = talents ?? [];
    return {
      total: all.length,
      pending: all.filter((t) => t.status === "pending").length,
      approved: all.filter((t) => t.status === "approved").length,
      activeSubs: all.filter((t) => t.subscriptionStatus === "active").length,
      revenueByCurrency: payments
        .filter((p) => p.status === "success")
        .reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.currency]: (acc[p.currency] ?? 0) + p.amount }), {}),
      countries: new Set(all.map((t) => t.country ?? "IN")).size,
      openReports: reports.filter((r) => r.status === "open").length,
    };
  }, [talents, payments, reports]);
  const revenueLabel = Object.entries(stats.revenueByCurrency).map(([cur, amt]) => formatMoney(amt, cur)).join(" · ") || formatMoney(0, "USD");

  const tabs: { id: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { id: "talents", label: "Talents", icon: Users, count: stats.pending },
    { id: "subscriptions", label: "Subscriptions", icon: RefreshCw },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "reports", label: "Reports", icon: Flag, count: stats.openReports },
    { id: "categories", label: "Categories", icon: LayoutGrid },
  ];

  if (!user) return null;

  return (
    <div className="animate-fade-up">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Signed in as {user.email}</p>
        </div>
        <Button variant="outline" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={load}>Refresh</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
        <Stat label="Total talents" value={stats.total} />
        <Stat label="Countries" value={stats.countries} />
        <Stat label="Pending review" value={stats.pending} tone="amber" />
        <Stat label="Approved" value={stats.approved} tone="green" />
        <Stat label="Active subs" value={stats.activeSubs} tone="green" />
        <Stat label="Revenue" value={revenueLabel} small />
        <Stat label="Open reports" value={stats.openReports} tone={stats.openReports ? "rose" : "slate"} />
      </div>

      {/* Tabs */}
      <div className="no-scrollbar mt-4 flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={cn("relative flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition", tab === tb.id ? "bg-neon text-canvas" : "text-muted hover:bg-panel-raised")}
          >
            <tb.icon className="h-4 w-4" /> {tb.label}
            {!!tb.count && <span className="ml-1 rounded-full bg-canvas px-1.5 text-[10px] text-neon">{tb.count}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {talents === null ? (
          <Spinner label="Loading admin data…" />
        ) : tab === "talents" ? (
          <TalentsTab talents={talents} categories={categories} onChange={load} />
        ) : tab === "subscriptions" ? (
          <SubscriptionsTab talents={talents} />
        ) : tab === "payments" ? (
          <PaymentsTab payments={payments} talents={talents} />
        ) : tab === "reports" ? (
          <ReportsTab reports={reports} onChange={load} />
        ) : (
          <CategoriesTab categories={categories} onChange={async () => { invalidate(); await load(); }} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "slate", small }: { label: string; value: string | number; tone?: "slate" | "green" | "amber" | "rose"; small?: boolean }) {
  const tones = { slate: "text-slate-900", green: "text-emerald-700", amber: "text-amber-700", rose: "text-rose-700" };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-1 font-extrabold", small ? "text-sm leading-snug" : "text-xl", tones[tone])}>{value}</p>
    </div>
  );
}

// ------------------------------------------------------------------ Talents
function TalentsTab({ talents, categories, onChange }: { talents: Talent[]; categories: Category[]; onChange: () => Promise<void> }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProfileStatus | "">("");
  const [cat, setCat] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<Talent | null>(null);
  const [reason, setReason] = useState("");

  const presentCountries = COUNTRIES.filter((c) => talents.some((t) => (t.country ?? "IN") === c.code));

  const list = talents.filter((t) => {
    if (status && t.status !== status) return false;
    if (cat && t.categoryId !== cat) return false;
    if (countryFilter && (t.country ?? "IN") !== countryFilter) return false;
    if (q) {
      const s = q.toLowerCase();
      if (![t.fullName, t.city, t.state, getCountry(t.country).name, t.mobile, t.email ?? "", t.subCategory].join(" ").toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const act = async (t: Talent, patch: Partial<Talent>) => {
    setBusyId(t.id);
    await dataService.updateTalent(t.id, patch);
    await onChange();
    setBusyId(null);
  };
  const remove = async (t: Talent) => {
    if (!confirm(`Delete ${t.fullName}'s profile permanently?`)) return;
    setBusyId(t.id);
    await dataService.deleteTalent(t.id);
    await onChange();
    setBusyId(null);
  };

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, city, country, phone…" className="pl-9" />
        </div>
        <Select value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} aria-label="Filter by country">
          <option value="">All countries</option>
          {presentCountries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value as ProfileStatus | "")}>
          <option value="">All statuses</option>
          {(["pending", "approved", "rejected", "suspended", "expired"] as ProfileStatus[]).map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <p className="mt-3 text-sm text-slate-500">{list.length} talents</p>

      <div className="mt-2 space-y-3">
        {list.length === 0 && <Empty title="No talents match" />}
        {list.map((t) => {
          const c = categories.find((x) => x.id === t.categoryId);
          const busy = busyId === t.id;
          return (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex gap-3">
                <Avatar src={t.photoURL} name={t.fullName} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{t.fullName}</p>
                    <StatusBadge status={t.status} />
                    <SubBadge status={t.subscriptionStatus} />
                    {t.verified && <Badge tone="blue"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Badge>}
                    {t.featured && <Badge tone="amber"><Star className="h-3.5 w-3.5" /> Featured</Badge>}
                  </div>
                  <p className="text-sm text-slate-600">{c?.name} · {t.subCategory} · {t.experienceYears} yrs</p>
                  <p className="text-xs text-slate-500">{t.city}, {t.state}, {getCountry(t.country).name} · Phone: +{t.mobile} · {t.videos.length} videos · joined {fmt(t.createdAt)}</p>
                  {t.subscriptionExpiryDate && <p className="text-xs text-slate-500">Subscription till {fmt(t.subscriptionExpiryDate)} · {t.paymentId}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {t.status !== "approved" && <Button size="sm" variant="success" loading={busy} onClick={() => act(t, { status: "approved", rejectionReason: undefined })}>Approve</Button>}
                {t.status !== "rejected" && <Button size="sm" variant="outline" disabled={busy} onClick={() => { setRejecting(t); setReason(""); }}>Reject</Button>}
                {t.status !== "suspended" && <Button size="sm" variant="danger" loading={busy} onClick={() => act(t, { status: "suspended" })}>Suspend</Button>}
                <Button size="sm" variant="outline" loading={busy} icon={<BadgeCheck className="h-4 w-4" />} onClick={() => act(t, { verified: !t.verified })}>{t.verified ? "Unverify" : "Verify"}</Button>
                <Button size="sm" variant="outline" loading={busy} icon={<Star className="h-4 w-4" />} onClick={() => act(t, { featured: !t.featured })}>{t.featured ? "Unfeature" : "Feature"}</Button>
                <Link to={`/talent/${t.id}`}><Button size="sm" variant="ghost" icon={<Eye className="h-4 w-4" />}>View</Button></Link>
                <Button size="sm" variant="ghost" className="ml-auto text-rose-600" loading={busy} icon={<Trash2 className="h-4 w-4" />} onClick={() => remove(t)}>Delete</Button>
              </div>
            </div>
          );
        })}
      </div>

      {rejecting && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setRejecting(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">Reject {rejecting.fullName}</h3>
            <Field label="Reason (shown to the talent)" required>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Videos are not of your own performance / Photo unclear" />
            </Field>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
              <Button variant="danger" disabled={!reason.trim()} onClick={async () => { await act(rejecting, { status: "rejected", rejectionReason: reason.trim() }); setRejecting(null); }}>Reject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------ Subscriptions
function SubscriptionsTab({ talents }: { talents: Talent[] }) {
  const [view, setView] = useState<"active" | "expired">("active");
  const now = Date.now();
  const list = talents.filter((t) => {
    const expired = t.subscriptionStatus === "expired" || (t.subscriptionExpiryDate && new Date(t.subscriptionExpiryDate).getTime() < now);
    return view === "active" ? t.subscriptionStatus === "active" && !expired : expired;
  });
  return (
    <div>
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {(["active", "expired"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={cn("min-h-11 rounded-lg px-4 py-2 text-sm font-semibold capitalize", view === v ? "bg-neon text-canvas" : "text-muted")}>{v}</button>
        ))}
      </div>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="p-3">Talent</th><th className="p-3">Start</th><th className="p-3">Expiry</th><th className="p-3">Payment ID</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="p-3 font-semibold">{t.fullName}<br /><span className="text-xs font-normal text-slate-500">{t.city}</span></td>
                <td className="p-3">{fmt(t.subscriptionStartDate)}</td>
                <td className="p-3">{fmt(t.subscriptionExpiryDate)}</td>
                <td className="p-3 font-mono text-xs">{t.paymentId ?? "—"}</td>
                <td className="p-3"><SubBadge status={view === "expired" ? "expired" : t.subscriptionStatus} /></td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Nothing here.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Payments
function PaymentsTab({ payments, talents }: { payments: Payment[]; talents: Talent[] }) {
  const name = (id: string) => talents.find((t) => t.id === id)?.fullName ?? id;
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
          <tr><th className="p-3">Date</th><th className="p-3">Talent</th><th className="p-3">Amount</th><th className="p-3">Payment ID</th><th className="p-3">Provider</th><th className="p-3">Status</th></tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-t border-slate-100">
              <td className="p-3">{fmt(p.createdAt)}</td>
              <td className="p-3 font-semibold">{name(p.talentId)}</td>
              <td className="p-3">{formatMoney(p.amount, p.currency)}</td>
              <td className="p-3 font-mono text-xs">{p.paymentId ?? p.id}</td>
              <td className="p-3"><Badge tone={p.mode === "live" ? "green" : "amber"}>{p.provider} · {p.mode}</Badge></td>
              <td className="p-3"><Badge tone={p.status === "success" ? "green" : p.status === "failed" ? "rose" : "slate"}>{p.status}</Badge></td>
            </tr>
          ))}
          {payments.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-slate-500">No payments yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ----------------------------------------------------------------- Reports
function ReportsTab({ reports, onChange }: { reports: Report[]; onChange: () => Promise<void> }) {
  return (
    <div className="space-y-3">
      {reports.length === 0 && <Empty icon={<CheckCircle2 className="h-9 w-9" />} title="No reports" />}
      {reports.map((r) => (
        <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{r.talentName}</p>
            <Badge tone={r.status === "open" ? "rose" : "green"}>{r.status}</Badge>
            <span className="ml-auto text-xs text-slate-500">{fmt(r.createdAt)}</span>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-800">{r.reason}</p>
          {r.details && <p className="text-sm text-slate-600">{r.details}</p>}
          <div className="mt-3 flex gap-2">
            <Link to={`/talent/${r.talentId}`}><Button size="sm" variant="outline" icon={<Eye className="h-4 w-4" />}>View profile</Button></Link>
            {r.status === "open" && <Button size="sm" variant="success" onClick={async () => { await dataService.updateReport(r.id, { status: "resolved" }); await onChange(); }}>Mark resolved</Button>}
          </div>
        </div>
      ))}
    </div>
  );
}

// -------------------------------------------------------------- Categories
function CategoriesTab({ categories, onChange }: { categories: Category[]; onChange: () => Promise<void> }) {
  const [editing, setEditing] = useState<Category | null>(null);

  const startNew = () =>
    setEditing({ id: "", name: "", icon: "event-performer", subCategories: [], active: true, order: categories.length + 1 });

  const save = async () => {
    if (!editing) return;
    const id = editing.id || editing.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!id || !editing.name.trim()) return alert("Name is required");
    await dataService.saveCategory({ ...editing, id, name: editing.name.trim(), subCategories: editing.subCategories.map((s) => s.trim()).filter(Boolean) });
    setEditing(null);
    await onChange();
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"? Existing talents in this category will keep the id.`)) return;
    await dataService.deleteCategory(c.id);
    await onChange();
  };

  return (
    <div>
      <Button icon={<Plus className="h-4 w-4" />} onClick={startNew}>Add category</Button>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <CategoryIcon id={c.id} iconKey={c.icon} className="h-6 w-6 shrink-0 text-neon" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">{c.name} {!c.active && <Badge tone="rose">inactive</Badge>}</p>
              <p className="truncate text-xs text-slate-500">{c.subCategories.join(", ")}</p>
            </div>
            <button onClick={() => setEditing(c)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => remove(c)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setEditing(null)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editing.id ? "Edit" : "New"} category</h3>
            <div className="mt-3 space-y-3">
              <Field label="Category name" required><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Category icon">
                <Select value={CATEGORY_ICON_KEYS.includes(editing.icon) ? editing.icon : "event-performer"} onChange={(e) => setEditing({ ...editing, icon: e.target.value })}>
                  {CATEGORY_ICON_KEYS.map((key) => <option key={key} value={key}>{key.replace(/-/g, " ")}</option>)}
                </Select>
              </Field>
              <Field label="Sub-categories (one per line)">
                <Textarea value={editing.subCategories.join("\n")} onChange={(e) => setEditing({ ...editing, subCategories: e.target.value.split("\n") })} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Order"><Input type="number" value={editing.order} onChange={(e) => setEditing({ ...editing, order: Number(e.target.value) })} /></Field>
                <label className="flex items-center gap-2 pt-7 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-brand-600" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Active</label>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
