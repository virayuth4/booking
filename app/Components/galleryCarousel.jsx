"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function GalleryCarousel({ images, name }) {
  const [lightboxIndex, setLightboxIndex] = useState(-1); // -1 = closed

  if (!images.length) return null;

  const half = Math.ceil(images.length / 2);
  const row1 = images.slice(0, half);
  const row2 = images.slice(half);

  const slides = images.map((src) => ({ src }));

  return (
    <section>
      <h2 className="text-xl font-semibold tracking-tight text-[#141414]">Gallery</h2>

      <div
        className="mt-4 -mx-5 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0
                   [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max flex-col gap-3">
          {/* Row 1 */}
          <div className="flex gap-3">
            {row1.map((src, i) => (
              <button
                key={src}
                onClick={() => setLightboxIndex(i)}
                className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#f2f0ea] sm:w-48"
              >
                <Image
                  src={src}
                  alt={`${name} photo ${i + 1}`}
                  fill
                  sizes="(min-width: 640px) 192px, 144px"
                  className="object-cover transition duration-200 hover:scale-105"
                />
              </button>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex gap-3">
            {row2.map((src, i) => {
              const actualIndex = half + i;
              return (
                <button
                  key={src}
                  onClick={() => setLightboxIndex(actualIndex)}
                  className="relative aspect-square w-36 shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#f2f0ea] sm:w-48"
                >
                  <Image
                    src={src}
                    alt={`${name} photo ${actualIndex + 1}`}
                    fill
                    sizes="(min-width: 640px) 192px, 144px"
                    className="object-cover transition duration-200 hover:scale-105"
                  />
                </button>
              );
            })}
          </div>
        </div>
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