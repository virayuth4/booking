'use client';
import { Children, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { todaysHours } from "@/lib/constants";

// image_rows may arrive as an array or as a JSON string, depending on the DB driver
function parseRows(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function allImages(rows) {
  return rows.flatMap((row) => row?.image_paths ?? []);
}

function Arrow({ dir, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Previous image" : "Next image"}
      className={`absolute top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-sm text-[#141414] shadow transition hover:bg-white group-hover:flex ${
        dir === "prev" ? "left-2" : "right-2"
      }`}
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );
}

function ImageCarousel({ images, alt }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [index, setIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback((api) => {
    setIndex(api.selectedScrollSnap());
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    sync(emblaApi);
    emblaApi.on("select", sync).on("reInit", sync);
    return () => {
      emblaApi.off("select", sync).off("reInit", sync);
    };
  }, [emblaApi, sync]);

  if (images.length === 0) {
    return <div className="aspect-[4/3] w-full bg-black/5" />;
  }

  return (
    <div className="group relative">
      <div ref={emblaRef} data-inner-carousel className="overflow-hidden bg-black/5">
        <div className="flex">
          {images.map((src, i) => (
            <div key={src} className="aspect-[4/3] min-w-0 flex-[0_0_100%]">
              <img
                src={src}
                alt={i === 0 ? alt : ""}
                loading="lazy"
                draggable={false}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <>
          {canPrev && <Arrow dir="prev" onClick={() => emblaApi?.scrollPrev()} />}
          {canNext && <Arrow dir="next" onClick={() => emblaApi?.scrollNext()} />}

          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function firstImage(rows) {
  return rows.flatMap((row) => row?.image_paths ?? [])[0] ?? null;
}

function MerchantCard({ page }) {
  const image = firstImage(parseRows(page.image_rows));
  const hours = todaysHours(page.opening_hours);

  const content = (
    <>
     <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
  {image && (
    <Image
      src={image}
      alt={page.name}
      fill
      sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 85vw"
      draggable={false}
      className="object-cover"
    />
  )}
</div>
      <div className="p-4">
        <h3 className="text-lg font-medium">{page.name}</h3>
        {page.category && (
          <p className="mt-1 font-mono text-[11px] uppercase tracking-wide text-black/40">
            {page.category}
          </p>
        )}
        {hours && <p className="mt-2 text-sm text-black/60">{hours}</p>}
      </div>
    </>
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-black/10 bg-white transition hover:border-black/25">
      {page.slug ? <Link href={`/${page.slug}`} className="block">{content}</Link> : content}
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-black/10">
      <div className="aspect-[4/3] bg-black/5" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 rounded bg-black/5" />
        <div className="h-3 w-1/3 rounded bg-black/5" />
        <div className="h-3 w-1/2 rounded bg-black/5" />
      </div>
    </div>
  );
}

const SLIDE = "min-w-0 flex-[0_0_85%] pl-6 sm:flex-[0_0_50%] lg:flex-[0_0_33.3333%]";

// Space between the screen edge and the first/last card, so the row lines up with
// the page container (max-w-6xl = 72rem, px-6 = 1.5rem). The slide's own pl-6 supplies
// the 1.5rem, so this only adds the extra space on screens wider than the container.
const EDGE = "max(0rem, calc((100vw - 72rem) / 2))";

function MerchantCarousel({ children }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
    // Let the inner image carousels handle their own swipes
    watchDrag: (_api, evt) => !evt.target.closest?.("[data-inner-carousel]"),
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const sync = useCallback((api) => {
    setCanPrev(api.canScrollPrev());
    setCanNext(api.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    sync(emblaApi);
    emblaApi.on("select", sync).on("reInit", sync);
    return () => {
      emblaApi.off("select", sync).off("reInit", sync);
    };
  }, [emblaApi, sync]);

  const slides = Children.toArray(children);

  return (
    // Break out of the page container so the row spans the full screen width
    <div className="relative left-1/2 w-screen -translate-x-1/2">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {slides.map((child, i) => (
            <div
              key={child.key ?? i}
              className={SLIDE}
              style={{
                marginLeft: i === 0 ? EDGE : undefined,
                // last card: trailing gutter so it can scroll fully into view with padding
                marginRight: i === slides.length - 1 ? `calc(${EDGE} + 1.5rem)` : undefined,
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {(canPrev || canNext) && (
        <div className="mx-auto mt-6 flex max-w-6xl justify-end gap-2 px-6">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            aria-label="Previous businesses"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-lg transition hover:border-black/40 disabled:opacity-30 disabled:hover:border-black/15"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            aria-label="Next businesses"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-lg transition hover:border-black/40 disabled:opacity-30 disabled:hover:border-black/15"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default function MerchantCards() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND}/api/booking-link/merchants`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const data = await res.json();
        setPages(Array.isArray(data) ? data : data.merchants ?? []);
      } catch (err) {
        if (err.name !== "AbortError") setError(err.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  if (error) {
    return <p className="text-sm text-black/50">Couldn't load merchants.</p>;
  }

  if (!loading && pages.length === 0) return null;

  return (
    <MerchantCarousel key={loading ? "loading" : "ready"}>
      {loading
        ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        : pages.map((page) => (
            <MerchantCard key={page.id ?? page.slug ?? page.name} page={page} />
          ))}
    </MerchantCarousel>
  );
}