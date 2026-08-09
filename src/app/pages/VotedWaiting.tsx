import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Avatar, Panel, Screen } from "../components/kit";
import { hasSupabaseConfig, supabase } from "../supabase/client";
import { updateLocalSessionStatus } from "../utils/localSessionStore";
import { avatarColor, initials, sessionParticipants } from "../utils/session";
import { useLiveSession } from "./SessionGate";

export function VotedWaiting({ userId }: { userId: string }) {
  const session = useLiveSession();
  const revealStartedRef = useRef(false);
  const optionIds = useMemo(() => new Set(session.options.map((option) => option.id)), [session.options]);
  const participants = sessionParticipants(session).map((participant) => {
    const votedOptionIds = new Set(session.votes.filter((vote) => vote.userId === participant.id).map((vote) => vote.optionId));
    const hasVotedOnEveryOption = optionIds.size > 0 && [...optionIds].every((optionId) => votedOptionIds.has(optionId));
    return {
      ...participant,
      hasVoted: participant.hasVoted || hasVotedOnEveryOption,
    };
  });
  const votedCount = participants.filter((participant) => participant.hasVoted).length;
  const totalCount = participants.length;
  const isCreator = session.createdBy === userId;

  useEffect(() => {
    if (revealStartedRef.current || totalCount === 0 || votedCount !== totalCount || session.status !== "voting") return;
    if (hasSupabaseConfig && !isCreator) return;

    revealStartedRef.current = true;

    if (!hasSupabaseConfig) {
      updateLocalSessionStatus(session.id, "reveal");
      return;
    }

    if (isCreator) {
      void supabase
        .from("sessions")
        .update({ status: "reveal" })
        .eq("id", session.id)
        .then((result) => {
          if (result.error) {
            revealStartedRef.current = false;
            console.error("Failed to update session status", result.error);
          }
        });
    }
  }, [isCreator, session.id, session.status, totalCount, votedCount]);

  useEffect(() => {
    if (session.status !== "voting") revealStartedRef.current = false;
  }, [session.status]);

  return (
    <Screen className="flex max-w-lg flex-col items-center gap-8 py-10">
      <div className="relative grid size-28 place-items-center">
        <motion.span
          className="absolute inset-0 rounded-full border-4 border-primary/25 border-t-primary"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        />
        <Check size={44} className="text-success" strokeWidth={3} />
      </div>
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold">You&apos;re in!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {votedCount} of {totalCount} voted
        </p>
      </div>

      <Panel className="w-full">
        <ul className="flex flex-wrap gap-4">
          {participants.map((participant) => (
            <li key={participant.id} className="flex w-20 flex-col items-center gap-2 text-center">
              <div className="relative">
                <Avatar name={initials(participant.displayName)} color={avatarColor(participant.id)} dim={!participant.hasVoted} />
                {participant.hasVoted ? (
                  <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full bg-success">
                    <Check size={12} strokeWidth={4} className="text-background" />
                  </span>
                ) : (
                  <span className="absolute inset-0 animate-ping rounded-full border-2 border-primary/40" />
                )}
              </div>
              <span className="w-full truncate text-xs text-muted-foreground">{participant.displayName}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </Screen>
  );
}
