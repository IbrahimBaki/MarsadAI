"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { monogram } from "@/lib/format";
import { useLocale } from "../LocaleProvider";
import { useApp } from "../AppContext";
import { useItemActions } from "../useItemActions";
import { CodeBox, Empty, PriceChip, Skeleton, secStyle } from "../bits";
import { BackIcon, BookmarkIcon, CheckIcon, ExternalIcon, ShareIcon } from "../icons";

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { feed, byId, user } = useApp();
  const { t, f, tx } = useLocale();
  const d = t.detail;
  const { onSeen, onFav, onShare } = useItemActions();

  if (!feed) return <div className="pt-4"><Skeleton /></div>;
  const item = byId.get(id);
  if (!item)
    return (
      <div className="pt-6">
        <Empty title={d.notFound} body={d.notFoundBody} action={<Link href="/" className="rounded-xl bg-ink px-4 py-2 text-[14.5px] font-semibold text-ground">{d.home}</Link>} />
      </div>
    );

  const section = tx.SECTION_BY_ID[item.section];
  const stats = item.repo ? feed.stats[item.repo] : undefined;
  const seen = user.seen.has(item.id);
  const fav = user.fav.has(item.id);
  const paragraphs = (item.about ?? "").split(/\n\s*\n/).filter(Boolean);
  const isTool = !["article", "release"].includes(item.kind);
  const back = () => (window.history.length > 1 ? router.back() : router.push(item.essential ? "/library" : "/"));

  const statBoxes: { label: string; value: string }[] = [];
  if (stats) {
    statBoxes.push({ label: d.stars, value: f.count(stats.stars) });
    if (stats.release) statBoxes.push({ label: d.release, value: stats.release.tag });
    if (stats.license) statBoxes.push({ label: d.license, value: stats.license });
    if (stats.language) statBoxes.push({ label: d.language, value: stats.language });
    statBoxes.push({ label: d.updated, value: f.ago(stats.pushedAt) });
  }

  return (
    <article style={secStyle(item.section)} className="mx-auto flex max-w-[860px] flex-col gap-4 pt-1">
      <div className="flex items-center gap-2">
        <button type="button" onClick={back} aria-label={d.back} className="card grid size-11 place-items-center !rounded-[14px]">
          <BackIcon />
        </button>
        <span className="flex-1" />
        <button type="button" onClick={() => onShare(item)} aria-label={t.card.share} className="grid size-11 place-items-center rounded-[14px] hover:bg-sunken">
          <ShareIcon />
        </button>
        <button
          type="button"
          onClick={() => onFav(item.id, !fav)}
          aria-pressed={fav}
          aria-label={fav ? t.card.removeFav : t.card.addFav}
          className={`grid size-11 place-items-center rounded-[14px] hover:bg-sunken ${fav ? "text-star" : ""}`}
        >
          <BookmarkIcon filled={fav} />
        </button>
      </div>

      <header className="flex flex-col gap-3.5 px-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[12.5px]">
          <Link href={`${item.essential ? "/library" : "/"}?s=${item.section}`} className="sec-soft sec-fg rounded-full px-2.5 py-1 font-semibold">
            {section?.name}
          </Link>
          <span className="card rounded-full !rounded-full px-2.5 py-1 text-ink-2">{tx.KIND_LABEL[item.kind] ?? item.kind}</span>
          <PriceChip pricing={item.pricing} size="md" />
          {item.importance === 3 && (
            <span className="rounded-full bg-star-soft px-2.5 py-1 font-semibold text-star-ink">{item.essential ? t.card.startHere : t.card.mustSee}</span>
          )}
        </div>
        <div className="flex items-center gap-3.5">
          <span className="sec-solid grid size-14 shrink-0 place-items-center rounded-2xl font-mono text-[18px] font-medium" aria-hidden>
            {monogram(item.repo ?? item.title)}
          </span>
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold leading-[34px] sm:text-[28px] sm:leading-[38px]">{item.title}</h1>
            {item.repo && <div className="ltr text-start font-mono text-[13px] text-muted">{item.repo}</div>}
          </div>
        </div>
        <p className="text-[16.5px] leading-[28px] text-ink-2">{item.summary}</p>
        {!item.essential && item.date && (
          <p className="text-[13px] text-faint">{d.inDigest(f.day(item.date).main, item.source)}</p>
        )}

        {statBoxes.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {statBoxes.map((b) => (
              <div key={b.label} className="card !rounded-2xl px-3.5 py-2.5">
                <div className="text-[12px] text-faint">{b.label}</div>
                <div className="ltr truncate text-start text-[15px] font-semibold">{b.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSeen(item.id, true)}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-ink text-[15px] font-semibold text-ground"
          >
            {item.repo ? d.openGithub : d.openSource(item.source)}
            <ExternalIcon width={17} height={17} className="rtl:-scale-x-100" />
          </a>
          <button
            type="button"
            onClick={() => onSeen(item.id, !seen)}
            aria-pressed={seen}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold ${
              seen ? "bg-ok text-ok-ink" : "card !rounded-2xl"
            }`}
          >
            <CheckIcon width={18} height={18} />
            {seen ? (isTool ? t.card.tried : t.card.seen) : isTool ? t.card.markTried : t.card.markSeen}
          </button>
        </div>
      </header>

      {paragraphs.length > 0 && (
        <Block title={d.whatIs}>
          <div className="prose text-[15.5px] leading-[28px] text-ink-2">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-line">{p}</p>
            ))}
          </div>
        </Block>
      )}

      <section className="sec-soft rounded-[20px] p-5">
        <h2 className="sec-fg mb-1.5 text-[17px] font-bold">{d.why}</h2>
        <p className="text-[15.5px] leading-[27px]">{item.why}</p>
      </section>

      {item.install && item.install.length > 0 && (
        <Block title={d.install}>
          <div className="flex flex-col gap-3">
            {item.install.map((s, i) => (
              <CodeBox key={i} label={s.label} cmd={s.cmd} />
            ))}
          </div>
          {item.requirements && item.requirements.length > 0 && (
            <p className="mt-3 text-[14px] text-muted">{d.needs}{item.requirements.join(d.listSep)}</p>
          )}
        </Block>
      )}

      {item.features && item.features.length > 0 && (
        <Block title={d.features}>
          <ul className="flex flex-col gap-2">
            {item.features.map((f, i) => (
              <li key={i} className="flex gap-2.5 text-[15px] leading-[26px] text-ink-2">
                <span className="sec-bg mt-[10px] size-1.5 shrink-0 rounded-full" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {item.usage && item.usage.length > 0 && (
        <Block title={d.tryAsking}>
          <div className="flex flex-col gap-2">
            {item.usage.map((u, i) => (
              <p key={i} dir="auto" className="rounded-xl bg-sunken px-3.5 py-2.5 text-[14.5px] leading-[24px]">
                {u}
              </p>
            ))}
          </div>
        </Block>
      )}

      {!item.install?.length && item.requirements && item.requirements.length > 0 && (
        <Block title={d.requirements}>
          <ul className="list-disc ps-5 text-[15px] leading-[26px] text-ink-2">
            {item.requirements.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </Block>
      )}

      {item.pricing && (
        <Block title={d.price}>
          <div className="flex flex-wrap items-center gap-2.5">
            <PriceChip pricing={item.pricing} size="md" />
            <span className="text-[14.5px] text-ink-2">
              {item.pricing.note ??
                (item.pricing.model === "oss"
                  ? d.ossNote
                  : tx.PRICING_LABEL[item.pricing.model])}
            </span>
          </div>
        </Block>
      )}

      {item.alternatives && item.alternatives.length > 0 && (
        <Block title={d.alternatives}>
          <div className="flex flex-wrap gap-2">
            {item.alternatives.map((a) => {
              const alt = byId.get(a);
              return alt ? (
                <Link key={a} href={`/item/${a}`} className="rounded-xl bg-sunken px-3 py-2 text-[14px] hover:bg-line">
                  {alt.title.split(":")[0]}
                </Link>
              ) : (
                <span key={a} className="rounded-xl bg-sunken px-3 py-2 text-[14px]">{a}</span>
              );
            })}
          </div>
        </Block>
      )}

      <section className="px-2 pb-6 pt-1">
        <h2 className="mb-2 text-[14.5px] font-bold text-muted">{d.sources}</h2>
        <div className="flex flex-col gap-1.5 text-[14.5px]">
          {(item.links?.length ? item.links : [{ label: item.source, url: item.url }]).map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {l.label}
            </a>
          ))}
        </div>
        {item.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <Link key={t} href={`${item.essential ? "/library" : "/"}?${item.essential ? "" : "v=all&"}q=${encodeURIComponent(t)}`} dir="auto" className="rounded-lg bg-sunken px-2.5 py-1 text-[12.5px] text-muted hover:text-ink">
                #{t}
              </Link>
            ))}
          </div>
        )}
        {stats && <p className="mt-4 text-[12px] text-faint">{d.statsFrom(f.short(feed.statsUpdated ?? stats.pushedAt))}</p>}
      </section>
    </article>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-3 text-[17px] font-bold">{title}</h2>
      {children}
    </section>
  );
}
