import { Check, LoaderCircle, X } from "lucide-react";
import { motion, PanInfo, useMotionValue, useTransform } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../supabase/client";
import { sessionOptions } from "../utils/session";
import { useLiveSession } from "./SessionGate";

export function SwipeVoting({ userId }: { userId: string }) {
  const session = useLiveSession();
  const navigate = useNavigate();
  const allOptions = useMemo(() => sessionOptions(session), [session]);
  const [localVoted, setLocalVoted] = useState<Set<string>>(new Set());
  const savedVotedOptionIds = useMemo(() => new Set(session.votes.filter((vote) => vote.userId === userId).map((vote) => vote.optionId)), [session.votes, userId]);
  const remainingOptions = allOptions.filter((option) => !localVoted.has(option.id) && !savedVotedOptionIds.has(option.id));
  const [isVoting, setIsVoting] = useState(false);
  const [finishingVoting, setFinishingVoting] = useState(false);
  const votingRef = useRef(false);
  
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-220, -100, 0, 100, 220], [0, 1, 1, 1, 0]);
  const greenOpacity = useTransform(x, [0, 150], [0, 1]);
  const redOpacity = useTransform(x, [-150, 0], [1, 0]);
  const currentOption = remainingOptions[0];
  const completedCount = allOptions.length - remainingOptions.length;

  async function vote(value: boolean) {
    if (!currentOption || votingRef.current) return;

    votingRef.current = true;
    setIsVoting(true);
    const optionId = currentOption.id;
    const votedOptionIds = new Set([...savedVotedOptionIds, ...localVoted, optionId]);
    const allVoted = allOptions.every((option) => votedOptionIds.has(option.id));

    x.set(0);
    if (allVoted) {
      setFinishingVoting(true);
    }
    setLocalVoted((prev) => new Set(prev).add(optionId));

    const voteData = {
      session_id: session.id,
      option_id: optionId,
      user_id: userId,
      vote: value,
    };

    console.log(`[${userId.slice(0, 8)}...] Recording vote:`, voteData);

    try {
      const { error: voteError } = await supabase.from("votes").insert([voteData]);

      console.log(`[${userId.slice(0, 8)}...] Vote recorded for ${optionId}`);

      if (voteError) {
        console.error(`[${userId.slice(0, 8)}...] Vote failed:`, voteError);
        toast.error("Vote failed, retrying...");
        setLocalVoted((prev) => {
          const updated = new Set(prev);
          updated.delete(optionId);
          return updated;
        });
        setFinishingVoting(false);
        votingRef.current = false;
        setIsVoting(false);
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
          setLocalVoted((prev) => {
            const updated = new Set(prev);
            updated.delete(optionId);
            return updated;
          });
          setFinishingVoting(false);
          votingRef.current = false;
          setIsVoting(false);
          return;
        }

        navigate(`/session/${session.id}/voted`);
      }
    } catch (error) {
      console.error("Vote error:", error);
      toast.error("Vote failed");
      setLocalVoted((prev) => {
        const updated = new Set(prev);
        updated.delete(optionId);
        return updated;
      });
      setFinishingVoting(false);
    }

    votingRef.current = false;
    setIsVoting(false);
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > 100) void vote(info.offset.x > 0);
  }

  if (finishingVoting || !currentOption) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center bg-background px-6 text-center">
        <LoaderCircle className="mb-4 h-10 w-10 animate-spin text-primary" />
        <h1 className="mb-2 text-2xl font-bold">Submitting votes...</h1>
        <p className="text-muted-foreground">Getting the decision ready.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col bg-background">
      <div className="px-6 pb-4 pt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{Math.min(completedCount + 1, allOptions.length)} of {allOptions.length} options</span>
          <span className="text-xs text-muted-foreground/60">{userId.slice(0, 8)}...</span>
        </div>
        <div className="grid h-1 grid-cols-[repeat(var(--segments),1fr)] gap-1" style={{ "--segments": allOptions.length } as React.CSSProperties}>
          {allOptions.map((option, index) => (
            <div key={option.id} className={`rounded-full ${index < completedCount ? "bg-primary" : "bg-[#2A2D3E]"}`} />
          ))}
        </div>
      </div>

      <section className="relative flex flex-1 items-center justify-center px-6">
        <div className="relative h-64 w-full max-w-md">
          {remainingOptions.slice(0, 3).map((option, stackIndex) => (
            <motion.div key={option.id} className="absolute inset-0" style={{ zIndex: 3 - stackIndex, scale: 1 - stackIndex * 0.05, y: stackIndex * 8 }} initial={false}>
              {stackIndex === 0 ? (
                <motion.div 
                  className="relative flex h-full w-full cursor-grab items-center justify-center overflow-hidden rounded-[20px] bg-card shadow-lg active:cursor-grabbing transition-opacity" 
                  style={{ x, rotate, opacity }} 
                  drag={!isVoting ? "x" : false} 
                  dragConstraints={{ left: 0, right: 0 }} 
                  onDragEnd={handleDragEnd} 
                  whileDrag={{ scale: 1.05 }}
                >
                  <motion.div className="absolute inset-0 flex items-center justify-center bg-success" style={{ opacity: greenOpacity }}>
                    <Check className="h-20 w-20 text-white" strokeWidth={3} />
                  </motion.div>
                  <motion.div className="absolute inset-0 flex items-center justify-center bg-destructive" style={{ opacity: redOpacity }}>
                    <X className="h-20 w-20 text-white" strokeWidth={3} />
                  </motion.div>
                  <h1 className="relative z-10 px-8 text-center text-[28px] font-bold">{option.label}</h1>
                </motion.div>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-[20px] bg-card opacity-30">
                  <h2 className="px-8 text-center text-[28px] font-bold">{option.label}</h2>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-center gap-12 px-6 pb-8">
        <button 
          onClick={() => void vote(false)} 
          disabled={isVoting} 
          className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive shadow-lg transition hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" 
          aria-label="No"
        >
          <X className="h-8 w-8 text-white" strokeWidth={3} />
        </button>
        <button 
          onClick={() => void vote(true)} 
          disabled={isVoting} 
          className="flex h-16 w-16 items-center justify-center rounded-full bg-success shadow-lg transition hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" 
          aria-label="Yes"
        >
          <Check className="h-8 w-8 text-white" strokeWidth={3} />
        </button>
      </div>
    </main>
  );
}
