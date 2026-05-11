"use client";

import { useEffect, useState } from "react";
import { trackHelpEvent } from "@/lib/help/analytics";

interface HelpfulWidgetProps {
  articleId: string;
}

type Vote = "yes" | "no" | null;

const STORAGE_KEY = "aparte.help.votes";

function readVotes(): Record<string, "yes" | "no"> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeVote(articleId: string, vote: "yes" | "no") {
  if (typeof window === "undefined") return;
  const all = readVotes();
  all[articleId] = vote;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function HelpfulWidget({ articleId }: HelpfulWidgetProps) {
  const [vote, setVote] = useState<Vote>(null);

  useEffect(() => {
    const all = readVotes();
    setVote(all[articleId] ?? null);
  }, [articleId]);

  function castVote(next: "yes" | "no") {
    setVote(next);
    writeVote(articleId, next);
    trackHelpEvent("help_helpful_voted", { article_id: articleId, vote: next });
  }

  if (vote) {
    return (
      <div className="mt-8 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-700">
        Thanks for your feedback.
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg bg-gray-50 border border-gray-200 p-4">
      <p className="text-sm font-semibold text-ink mb-3">Was this helpful?</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => castVote("yes")}
          className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-800 hover:border-teal hover:text-teal"
        >
          👍 Yes
        </button>
        <button
          type="button"
          onClick={() => castVote("no")}
          className="px-3 py-1.5 rounded-full text-sm font-semibold bg-white border border-gray-200 text-gray-800 hover:border-teal hover:text-teal"
        >
          👎 No
        </button>
      </div>
    </div>
  );
}
