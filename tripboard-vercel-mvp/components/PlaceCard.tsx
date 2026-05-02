"use client";

import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Place, useTripStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export default function PlaceCard({ place }: { place: Place }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `place-${place.id}`,
    data: { type: "place", place }
  });
  const language = useTripStore(s => s.language);

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.6 : 1 }}
      {...listeners}
      {...attributes}
      className="cursor-grab overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
    >
      <div className="relative h-32 w-full bg-cream">
        <Image src={place.image} alt={place.name} fill className="object-cover" unoptimized />
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-cocoa">{place.name}</h3>
          <span className="rounded-full bg-cream px-2 py-1 text-xs">★ {place.rating}</span>
        </div>
        <p className="line-clamp-2 text-xs text-cocoa/65">{place.description}</p>
        <div className="flex flex-wrap gap-1 text-xs text-cocoa/60">
          <span>{t(language, "duration")}: {place.duration} {t(language, "minutes")}</span>
          <span>· {t(language, "aiRating")}</span>
        </div>
      </div>
    </article>
  );
}
