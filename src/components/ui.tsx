import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Loader2, BadgeCheck, Star, Search } from "lucide-react";
import { cn } from "@/utils/cn";
import type { ProfileStatus, SubscriptionStatus } from "@/lib/types";

// ------------------------------------------------------------------ Button
type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "whatsapp";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
  icon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: "button-primary",
  secondary: "border border-silver/40 bg-panel-raised text-heading hover:border-silver/70",
  outline: "border border-line bg-panel text-silver hover:border-silver/60 hover:bg-panel-raised",
  ghost: "text-silver hover:bg-panel-raised",
  danger: "border border-rose-400/30 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25",
  success: "border border-neon/25 bg-neon/10 text-neon hover:bg-neon/20",
  whatsapp: "border border-neon/40 bg-neon/10 text-neon hover:bg-neon/20",
};
const sizeClass: Record<Size, string> = {
  sm: "min-h-10 px-3 text-xs rounded-md gap-1.5",
  md: "min-h-12 px-5 text-sm rounded-lg gap-2",
  lg: "min-h-14 px-6 text-sm rounded-lg gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, full, icon, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 select-none",
        variantClass[variant],
        sizeClass[size],
        full && "w-full",
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      {children}
    </button>
  )
);
Button.displayName = "Button";

// ------------------------------------------------------------------- Field
export function Field({ label, hint, error, required, children }: { label?: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-semibold text-silver">
          {label} {required && <span className="text-neon">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rose-300">{error}</span>}
    </label>
  );
}

const inputBase =
  "h-12 w-full rounded-lg border border-line bg-field px-4 text-base sm:text-sm text-heading placeholder:text-muted outline-none transition focus:border-neon focus:ring-4 focus:ring-neon/10 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>(
  ({ className, error, ...rest }, ref) => (
    <input ref={ref} className={cn(inputBase, error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15", className)} {...rest} />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }>(
  ({ className, error, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(inputBase, "h-auto min-h-[120px] py-3 leading-relaxed", error && "border-rose-400", className)}
      {...rest}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }>(
  ({ className, error, children, style, ...rest }, ref) => (
    <select
      ref={ref}
      className={cn(
        inputBase,
        "appearance-none bg-no-repeat pr-10",
        error && "border-rose-400",
        className
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%239aa9bf' stroke-width='2'><path d='m6 9 6 6 6-6'/></svg>\")",
        backgroundPosition: "right 12px center",
        backgroundSize: "20px",
        ...style,
      }}
      {...rest}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

// ------------------------------------------------------------------- Badge
export function Badge({ children, tone = "slate", className }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "rose" | "blue" | "brand"; className?: string }) {
  const tones = {
    slate: "border border-line bg-panel-raised text-silver",
    green: "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    amber: "border border-amber-300/20 bg-amber-300/10 text-amber-200",
    rose: "border border-rose-400/20 bg-rose-400/10 text-rose-300",
    blue: "border border-silver/20 bg-silver/10 text-silver",
    brand: "border border-neon/20 bg-neon/10 text-neon",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}

export function VerifiedBadge({ small }: { small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 font-semibold text-silver", small ? "text-[11px]" : "text-xs")} title="Verified by Talent Tube">
      <BadgeCheck className={small ? "h-3.5 w-3.5" : "h-4 w-4"} /> Verified
    </span>
  );
}

export function FeaturedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-neon px-2 py-1 text-[10px] font-bold text-canvas">
      <Star className="h-3 w-3 fill-current" /> Featured
    </span>
  );
}

export function StatusBadge({ status }: { status: ProfileStatus }) {
  const map: Record<ProfileStatus, { tone: "green" | "amber" | "rose" | "slate"; label: string }> = {
    approved: { tone: "green", label: "Approved" },
    pending: { tone: "amber", label: "Pending" },
    rejected: { tone: "rose", label: "Rejected" },
    suspended: { tone: "rose", label: "Suspended" },
    expired: { tone: "slate", label: "Expired" },
  };
  return <Badge tone={map[status].tone}>{map[status].label}</Badge>;
}

export function SubBadge({ status }: { status: SubscriptionStatus }) {
  const map: Record<SubscriptionStatus, { tone: "green" | "amber" | "rose" | "slate"; label: string }> = {
    active: { tone: "green", label: "Active" },
    pending: { tone: "amber", label: "Payment Pending" },
    expired: { tone: "rose", label: "Expired" },
    cancelled: { tone: "slate", label: "Cancelled" },
  };
  return <Badge tone={map[status].tone}>{map[status].label}</Badge>;
}

// ------------------------------------------------------------------ Avatar
export function Avatar({ src, name, size = 56, className }: { src?: string; name: string; size?: number; className?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={cn("relative shrink-0 overflow-hidden rounded-full bg-panel-raised text-neon", className)}
      style={{ width: size, height: size }}
    >
      <span className="absolute inset-0 flex items-center justify-center font-bold" style={{ fontSize: size / 2.6 }}>
        {initials}
      </span>
      {src && (
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------- Spinner
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
      <Loader2 className="h-8 w-8 animate-spin text-neon" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

// ------------------------------------------------------------------- Empty
export function Empty({ icon, title, sub, action }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 text-neon">{icon ?? <Search className="h-9 w-9" />}</div>
      <p className="font-semibold text-heading">{title}</p>
      {sub && <p className="mt-1 max-w-xs text-sm text-muted">{sub}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ------------------------------------------------------------- SectionHead
export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold tracking-tight text-heading sm:text-xl">{title}</h2>
      {action}
    </div>
  );
}
