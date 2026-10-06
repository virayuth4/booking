"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Video from "yet-another-react-lightbox/plugins/video";
import "yet-another-react-lightbox/styles.css";

const VIDEO_URL_RE = /\.(mp4|m4v|mov|webm)(\?.*)?$/i;
const isVideoUrl = (url) => typeof url === "string" && VIDEO_URL_RE.test(url);

function videoMimeType(url) {
  const ext = url.split("?")[0].split(".").pop().toLowerCase();
  if (ext === "webm") return "video/webm";
  if (ext === "mov") return "video/quicktime";
  return "video/mp4"; // mp4, m4v
}

function toSlide(src) {
  if (isVideoUrl(src)) {
    return {
      type: "video",
      sources: [{ src, type: videoMimeType(src) }],
    };
  }
  return { src };
}

export default function GalleryCarousel({ rows, name }) {
  const [lightboxIndex, setLightboxIndex] = useState(-1); // -1 = closed

  if (!rows?.length) return null;

  // Flatten every row into one slide list, remembering where each row starts.
  const slides = [];
  const rowsWithOffset = rows.map((row) => {
    const offset = slides.length;
    row.images.forEach((src) => slides.push(toSlide(src)));
    return { ...row, offset };
  });

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-[#141414]">Gallery</h2>

      <div className="mt-4 flex flex-col gap-6">
        {rowsWithOffset.map((row, rowIndex) => (
          <div key={`${row.label}-${rowIndex}`}>
            {row.label && (
              <h3 className="mb-3 text-sm font-medium text-black/50">{row.label}</h3>
            )}

            <div
              className="-mx-5 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0
                         [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex w-max gap-3">
                {row.images.map((src, i) => {
                  const video = isVideoUrl(src);
                  return (
                    <button
                      key={`${src}-${i}`}
                      onClick={() => setLightboxIndex(row.offset + i)}
                      aria-label={`${video ? "Play video" : "View photo"} ${i + 1}${
                        row.label ? ` in ${row.label}` : ""
                      }`}
                      className="group relative aspect-square w-36 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#f2f0ea] sm:w-48"
                    >
                      {video ? (
                        <>
                          {/* #t=0.1 makes the browser render the first frame as a thumbnail */}
                          <video
                            src={`${src}#t=0.1`}
                            muted
                            playsInline
                            preload="metadata"
                            className="pointer-events-none h-full w-full object-cover transition duration-200 group-hover:scale-105"
                          />
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white shadow-md">
                              <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-current">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                          </span>
                        </>
                      ) : (
                        <Image
                          src={src}
                          alt={`${name}${row.label ? ` ${row.label}` : ""} photo ${i + 1}`}
                          fill
                          sizes="(min-width: 640px) 192px, 144px"
                          className="object-cover transition duration-200 group-hover:scale-105"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
        slides={slides}
        plugins={[Video]}
        video={{ controls: true, playsInline: true }}
        on={{ view: ({ index }) => setLightboxIndex(index) }}
      />
    </section>
  );
}