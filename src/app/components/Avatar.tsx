import { Check } from "lucide-react";
import { Participant } from "../types";
import { avatarColor, initials } from "../utils/session";

export function Avatar({ participant, showVote }: { participant: Participant; showVote?: boolean }) {
  return (
    <div className="relative flex flex-col items-center gap-2">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full font-bold text-white"
        style={{ backgroundColor: avatarColor(participant.id), opacity: showVote && !participant.hasVoted ? 0.42 : 1 }}
      >
        {initials(participant.displayName)}
      </div>
      {showVote && participant.hasVoted && (
        <div className="absolute right-1 top-9 flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-success">
          <Check className="h-4 w-4 text-white" strokeWidth={3} />
        </div>
      )}
      <span className="w-16 truncate text-center text-xs text-muted-foreground">{participant.displayName}</span>
    </div>
  );
}
