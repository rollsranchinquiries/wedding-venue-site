"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

interface GalleryImage {
  src: string;
  width: number;
  height: number;
  alt: string;
}

// Placeholder slots — swap `src` for real photos later. width/height must
// match each image's real intrinsic size so the lightbox and grid can
// reserve layout space up front (no layout shift on load).
const GALLERY_IMAGES: GalleryImage[] = [
  { src: "/gallery/barn-exterior.svg", width: 1600, height: 1067, alt: "Barn exterior" },
  { src: "/gallery/ceremony-arch.svg", width: 1600, height: 2000, alt: "Ceremony arch" },
  { src: "/gallery/reception-hall.svg", width: 1600, height: 1067, alt: "Reception hall" },
  { src: "/gallery/pasture-sunset.svg", width: 1600, height: 1067, alt: "Pasture at sunset" },
  { src: "/gallery/string-lights.svg", width: 1600, height: 2000, alt: "String lights" },
  { src: "/gallery/farm-table.svg", width: 1600, height: 1067, alt: "Farm tables" },
  { src: "/gallery/horses.svg", width: 1600, height: 1067, alt: "Horses in field" },
  { src: "/gallery/fire-pit.svg", width: 1600, height: 2000, alt: "Fire pit gathering" },
];

export default function Gallery() {
  const [index, setIndex] = useState(-1);

  return (
    <section className="px-6 py-20 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="font-display text-sm uppercase tracking-[0.2em] text-terracotta">
            The Grounds
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-walnut sm:text-4xl">
            Gallery
          </h2>
        </div>

        <div className="columns-2 gap-3 sm:columns-3 sm:gap-4">
          {GALLERY_IMAGES.map((image, i) => (
            <button
              key={image.src}
              type="button"
              onClick={() => setIndex(i)}
              className="group mb-3 block w-full overflow-hidden rounded-xl bg-walnut/5 sm:mb-4"
              aria-label={`Open photo: ${image.alt}`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                loading="lazy"
                sizes="(min-width: 640px) 33vw, 50vw"
                className="h-auto w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        slides={GALLERY_IMAGES}
        plugins={[Thumbnails, Zoom]}
        animation={{ fade: 250, swipe: 250 }}
        carousel={{ finite: false, preload: 2 }}
      />
    </section>
  );
}
