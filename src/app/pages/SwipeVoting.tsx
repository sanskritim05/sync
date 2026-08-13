import { AnimatePresence, motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { Check, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button, Screen } from "../components/kit";
import { hasSupabaseConfig, supabase } from "../supabase/client";
import { addLocalVote, markLocalParticipantVoted } from "../utils/localSessionStore";
import { sessionOptions } from "../utils/session";
import { Option } from "../types";
import { useLiveSession } from "./SessionGate";

export function SwipeVoting({ userId }: { userId: string }) {
  const session = useLiveSession();
  const navigate = useNavigate();
  const allOptions = useMemo(() => sessionOptions(session), [session]);
  const [localVoted, setLocalVoted] = useState<Set<string>>(new Set());
  const savedVotedOptionIds = useMemo(
    () => new Set(session.votes.filter((vote) => vote.userId === userId).map((vote) => vote.optionId)),
    [session.votes, userId],
  );
  const remainingOptions = allOptions.filter((option) => !localVoted.has(option.id) && !savedVotedOptionIds.has(option.id));
  const [isVoting, setIsVoting] = useState(false);
  const [finishingVoting, setFinishingVoting] = useState(false);
  const votingRef = useRef(false);
  const currentOption = remainingOptions[0];
  const completedCount = allOptions.length - remainingOptions.length;

  async function vote(value: boolean) {
    if (!currentOption || votingRef.current) return;

    votingRef.current = true;
    setIsVoting(true);
    const optionId = currentOption.id;
    const votedOptionIds = new Set([...savedVotedOptionIds, ...localVoted, optionId]);
    const allVoted = allOptions.every((option) => votedOptionIds.has(option.id));

    if (allVoted) setFinishingVoting(true);
    setLocalVoted((prev) => new Set(prev).add(optionId));

    try {
      if (!hasSupabaseConfig) {
        const voteSaved = addLocalVote({
          sessionId: session.id,
          optionId,
          userId,
          vote: value,
        });

        if (!voteSaved) {
          toast.error("Vote failed, retrying...");
          rollbackVote(optionId);
          return;
        }

        if (allVoted) {
          const participantUpdated = markLocalParticipantVoted(session.id, userId);
          if (!participantUpdated) {
            toast.error("Failed to submit votes. Please try again.");
            rollbackVote(optionId);
            return;
          }

          sessionStorage.setItem(`sync:finishedVoting:${session.id}:${userId}`, "true");
          navigate(`/session/${session.id}/voted`);
          return;
        }

        votingRef.current = false;
        setIsVoting(false);
        return;
      }

      const { error: voteError } = await supabase.from("votes").insert([
        {
          session_id: session.id,
          option_id: optionId,
          user_id: userId,
          vote: value,
        },
      ]);

      if (voteError) {
        toast.error("Vote failed, retrying...");
        rollbackVote(optionId);
        return;
      }

      if (allVoted) {
        const { error: participantError } = await supabase
          .from("participants")
          .update({ has_voted: true })
          .eq("session_id", session.id)
          .eq("user_id", userId);

        if (participantError) {
          toast.error("Failed to submit votes. Please try again.");
          rollbackVote(optionId);
          return;
        }

        sessionStorage.setItem(`sync:finishedVoting:${session.id}:${userId}`, "true");
        navigate(`/session/${session.id}/voted`);
        return;
      }
    } catch {
      toast.error("Vote failed");
      rollbackVote(optionId);
      return;
    }

    votingRef.current = false;
    setIsVoting(false);
  }

  function rollbackVote(optionId: string) {
    setLocalVoted((prev) => {
      const updated = new Set(prev);
      updated.delete(optionId);
      return updated;
    });
    setFinishingVoting(false);
    votingRef.current = false;
    setIsVoting(false);
  }

  if (finishingVoting || !currentOption) {
    return (
      <Screen className="grid min-h-dvh place-items-center">
        <p className="text-sm text-muted-foreground">Submitting votes...</p>
      </Screen>
    );
  }

  return (
    <Screen className="flex max-w-lg flex-col gap-6 py-6">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-2xl font-bold">{session.topic}</h1>
        <p className="text-sm text-muted-foreground">
          {Math.min(completedCount + 1, allOptions.length)} of {allOptions.length} options
        </p>
        <div className="flex gap-1.5">
          {allOptions.map((option, index) => (
            <div
              key={option.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${index < completedCount ? "bg-primary" : "bg-secondary"}`}
            />
          ))}
        </div>
      </div>

      <div className="relative h-80">
        <AnimatePresence>
          {remainingOptions
            .slice(0, 3)
            .slice()
            .reverse()
            .map((option, revIndex, stack) => {
              const depth = stack.length - 1 - revIndex;
              return (
                <SwipeCard
                  key={option.id}
                  option={option}
                  depth={depth}
                  active={depth === 0 && !isVoting}
                  onAnswer={(value) => void vote(value)}
                />
              );
            })}
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <Button variant="destructive" className="h-14 flex-1" disabled={isVoting} onClick={() => void vote(false)}>
          <X size={20} /> No
        </Button>
        <Button variant="success" className="h-14 flex-1" disabled={isVoting} onClick={() => void vote(true)}>
          <Check size={20} /> Yes
        </Button>
      </div>
    </Screen>
  );
}

function SwipeCard({
  option,
  depth,
  active,
  onAnswer,
}: {
  option: Option;
  depth: number;
  active: boolean;
  onAnswer: (value: boolean) => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-14, 14]);
  const yesOpacity = useTransform(x, [20, 140], [0, 1]);
  const noOpacity = useTransform(x, [-140, -20], [1, 0]);

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > 120) onAnswer(true);
    else if (info.offset.x < -120) onAnswer(false);
  }

  return (
    <motion.div
      className="glass-card absolute inset-0 grid place-items-center overflow-hidden rounded-2xl p-8 select-none"
      style={{ x: active ? x : 0, rotate: active ? rotate : 0, zIndex: 10 - depth }}
      initial={{ scale: 0.94, y: 0 }}
      animate={{ scale: 1 - depth * 0.04, y: depth * 14, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      drag={active ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
    >
      <p className="text-center font-display text-3xl leading-tight font-bold text-balance">{option.label}</p>
      {active && (
        <>
          <motion.div style={{ opacity: yesOpacity }} className="bg-success-soft pointer-events-none absolute inset-0 grid place-items-center">
            <Check size={96} className="text-success" strokeWidth={3} />
          </motion.div>
          <motion.div style={{ opacity: noOpacity }} className="bg-destructive-soft pointer-events-none absolute inset-0 grid place-items-center">
            <X size={96} className="text-destructive" strokeWidth={3} />
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
