"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function GalleryCarousel({ rows, name }) {
  const [lightboxIndex, setLightboxIndex] = useState(-1); // -1 = closed

  if (!rows?.length) return null;

  // Flatten every row into one slide list, remembering where each row starts.
  const slides = [];
  const rowsWithOffset = rows.map((row) => {
    const offset = slides.length;
    row.images.forEach((src) => slides.push({ src }));
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
                {row.images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    onClick={() => setLightboxIndex(row.offset + i)}
                    className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#f2f0ea] sm:w-48"
                  >
                    <Image
                      src={src}
                      alt={`${name}${row.label ? ` ${row.label}` : ""} photo ${i + 1}`}
                      fill
                      sizes="(min-width: 640px) 192px, 144px"
                      className="object-cover transition duration-200 hover:scale-105"
                    />
                  </button>
                ))}
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
        on={{ view: ({ index }) => setLightboxIndex(index) }}
      />
    </section>
  );
}