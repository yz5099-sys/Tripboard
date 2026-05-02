import { NextResponse } from "next/server";

const sampleImages = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517760444937-f6397edcbbcd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80"
];

const types = ["Museum", "Old Town", "Local Market", "City Park", "Landmark", "Hidden Cafe", "Riverside Walk", "Night View", "Gallery", "Food Street", "Botanical Garden", "Historic Site"];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const destination = [body?.country, body?.region, body?.city].filter(Boolean).join(", ") || "your destination";

  const suggestions = types.map((type, index) => ({
    id: `place-${index + 1}`,
    name: `${destination} ${type}`,
    image: sampleImages[index % sampleImages.length],
    description: `A recommended ${type.toLowerCase()} for this trip. This is MVP mock AI data and can be replaced by a real API later.`,
    duration: [60, 90, 120, 150, 180][index % 5],
    rating: Number((4.2 + (index % 7) * 0.1).toFixed(1)),
    tags: index % 2 === 0 ? ["popular", "photo"] : ["local", "relaxed"]
  }));

  return NextResponse.json({ suggestions });
}
