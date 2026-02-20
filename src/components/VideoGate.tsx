"use client";
import { useState } from "react";
import { YouTubePlayer } from "./YouTubePlayer";
import Link from "next/link";
import { PlayCircle, CheckCircle2, Lock, AlertCircle } from "lucide-react";

export default function VideoGate({ videoId, moduleId }: { videoId: string; moduleId: string }) {
  const [watched, setWatched] = useState(false);
  
  return (
    <div>
      {/* Video Player */}
      <YouTubePlayer videoId={videoId} onEnded={() => setWatched(true)} />
      
      {/* Action Section */}
      <div className="p-5 bg-gradient-to-br from-white to-[var(--color-cream)]">
        {/* Status Message */}
        {!watched ? (
          <div className="flex items-start gap-3 mb-4 p-3 rounded-[var(--radius)] bg-[var(--color-accent-50)] border border-[var(--color-accent)]/20">
            <AlertCircle className="w-5 h-5 text-[var(--color-accent)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-accent)] mb-1">
                Complete the Video
              </p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Watch the entire video to unlock the quiz. The quiz button will activate once you reach the end.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 mb-4 p-3 rounded-[var(--radius)] bg-[var(--color-brand-50)] border border-[var(--color-brand)]/20">
            <CheckCircle2 className="w-5 h-5 text-[var(--color-brand)] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-brand)] mb-1">
                Video Completed!
              </p>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Great job! You can now proceed to the quiz. Test your knowledge and earn your certificate.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link 
            href={`/quiz/${moduleId}`}
            className={`flex-1 btn ${watched ? 'btn-brand' : 'btn-disabled'} flex items-center justify-center gap-2 shadow-sm`}
            onClick={(e) => {
              if (!watched) {
                e.preventDefault();
              }
            }}
          >
            {watched ? (
              <>
                <PlayCircle className="w-4 h-4" />
                Start Quiz
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Quiz Locked
              </>
            )}
          </Link>

          {/* Dev Helper (only in development) */}
          {process.env.NODE_ENV === 'development' && !watched && (
            <button 
              onClick={() => setWatched(true)} 
              className="px-3 py-2 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-brand)] transition-colors rounded-[var(--radius)] border border-[var(--color-border)] hover:border-[var(--color-brand)] bg-white"
              title="Development only: Mark as watched"
            >
              Skip
            </button>
          )}
        </div>

        {/* Watch Status Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className={`w-2 h-2 rounded-full ${watched ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border)]'}`} />
          <span className="text-xs text-[var(--color-text-muted)]">
            {watched ? 'Video watched' : 'Watching video...'}
          </span>
        </div>
      </div>
    </div>
  );
}
