"use client";

type Provider = "loom" | "youtube" | "mp4";

function detectProvider(url: string): Provider {
  if (/loom\.com/i.test(url)) return "loom";
  if (/(youtube\.com|youtu\.be)/i.test(url)) return "youtube";
  return "mp4";
}

function toLoomEmbed(url: string): string {
  // Accept both https://www.loom.com/share/{id} and /embed/{id}
  const m = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9-]+)/);
  return m ? `https://www.loom.com/embed/${m[1]}` : url;
}

function toYouTubeEmbed(url: string): string {
  const watch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  return url;
}

interface VideoEmbedProps {
  url: string;
  title?: string;
}

export function VideoEmbed({ url, title = "Walkthrough video" }: VideoEmbedProps) {
  const provider = detectProvider(url);

  if (provider === "mp4") {
    return (
      <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-black">
        <video
          src={url}
          controls
          preload="metadata"
          className="w-full h-auto aspect-video"
          aria-label={title}
        />
      </div>
    );
  }

  const src = provider === "loom" ? toLoomEmbed(url) : toYouTubeEmbed(url);

  return (
    <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg border border-gray-200 bg-black">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
