import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hubCopy } from "@/lib/kyc/hub-copy";
import {
  discoverProviders,
  recommendedProviders,
  regionFromLocale,
  type IdentityProviderEntry,
  type ProviderEngine,
  type ProviderFilter,
} from "@/lib/kyc/providers";

const FILTERS: ProviderFilter[] = ["all", "national_eid", "passport_nfc", "zero_knowledge"];

/**
 * Provider Discovery Hub: region-aware recommended row, live search and category chips over the
 * identity provider catalogue. Only providers with an active engine can be started.
 */
export function ProviderDiscoveryHub({
  active,
  busy,
  onStart,
}: {
  active: ReadonlySet<ProviderEngine>;
  busy: ProviderEngine | null;
  onStart: (engine: ProviderEngine) => void;
}) {
  const { i18n } = useTranslation();
  const c = hubCopy(i18n.language);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ProviderFilter>("all");
  const region = useMemo(() => {
    if (typeof navigator === "undefined") return null;
    for (const tag of navigator.languages ?? [navigator.language]) {
      const r = regionFromLocale(tag);
      if (r) return r;
    }
    return null;
  }, []);

  const searching = query.trim() !== "" || filter !== "all";
  const list = useMemo(() => discoverProviders({ query, filter, region, active, docLabels: c.docs }), [query, filter, region, active, c.docs]);
  const recommended = useMemo(() => recommendedProviders(region, active), [region, active]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{c.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{c.intro}</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 80))}
          placeholder={c.search}
          aria-label={c.searchLabel}
          className="min-h-11 pl-9"
        />
      </div>

      <div role="group" aria-label={c.searchLabel} className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            type="button"
            size="sm"
            variant={filter === f ? "default" : "outline"}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className="min-h-11 rounded-full"
          >
            {c.filters[f]}
          </Button>
        ))}
      </div>

      {!searching && recommended.length > 0 && (
        <section aria-label={c.recommended} className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.recommended}</h4>
          <ProviderGrid providers={recommended} active={active} busy={busy} onStart={onStart} />
        </section>
      )}

      <section aria-label={c.all} className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c.all}</h4>
        {list.length ? (
          <ProviderGrid providers={list} active={active} busy={busy} onStart={onStart} />
        ) : (
          <p role="status" className="text-sm text-muted-foreground">{c.empty}</p>
        )}
      </section>

      <p className="text-xs text-muted-foreground">{c.privacy}</p>
    </div>
  );
}

function ProviderGrid({
  providers,
  active,
  busy,
  onStart,
}: {
  providers: readonly IdentityProviderEntry[];
  active: ReadonlySet<ProviderEngine>;
  busy: ProviderEngine | null;
  onStart: (engine: ProviderEngine) => void;
}) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {providers.map((p) => (
        <li key={p.id}>
          <ProviderCard provider={p} active={active} busy={busy} onStart={onStart} />
        </li>
      ))}
    </ul>
  );
}

function ProviderCard({
  provider: p,
  active,
  busy,
  onStart,
}: {
  provider: IdentityProviderEntry;
  active: ReadonlySet<ProviderEngine>;
  busy: ProviderEngine | null;
  onStart: (engine: ProviderEngine) => void;
}) {
  const { i18n } = useTranslation();
  const c = hubCopy(i18n.language);
  const startable = p.engine !== null && active.has(p.engine);
  return (
    <article className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-3" aria-label={p.name}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary"
        >
          {p.monogram}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{p.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {p.regions.map((r) => (r === "GLOBAL" ? "🌐" : r)).join(" · ")}
          </p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-1">
        {p.ratings.map((r) => (
          <li key={r} className="rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary">
            {c.ratings[r]}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{c.documents}:</span> {p.documents.map((d) => c.docs[d]).join(", ")}
      </p>
      <div className="mt-auto">
        {startable ? (
          <Button type="button" size="sm" className="min-h-11 w-full gap-2" disabled={busy !== null} onClick={() => onStart(p.engine!)}>
            {busy === p.engine && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} {c.start}
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" className="min-h-11 w-full" disabled aria-disabled>
            {p.engine ? c.inactive : c.planned}
          </Button>
        )}
      </div>
    </article>
  );
}
