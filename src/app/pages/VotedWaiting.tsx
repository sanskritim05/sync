import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Avatar } from "../components/Avatar";
import { hasSupabaseConfig, supabase } from "../supabase/client";
import { updateLocalSessionStatus } from "../utils/localSessionStore";
import { sessionParticipants } from "../utils/session";
import { useLiveSession } from "./SessionGate";

export function VotedWaiting({ userId }: { userId: string }) {
  const session = useLiveSession();
  const participants = sessionParticipants(session);
  const votedCount = participants.filter((participant) => participant.hasVoted).length;
  const totalCount = participants.length;
  const isCreator = session.createdBy === userId;

  useEffect(() => {
    if (isCreator && totalCount > 0 && votedCount === totalCount && session.status === "voting") {
      if (!hasSupabaseConfig) {
        updateLocalSessionStatus(session.id, "reveal");
        return;
      }

      void supabase.from("sessions").update({ status: "reveal" }).eq("id", session.id).then((r) => {
        if (r.error) console.error("Failed to update session status", r.error);
      });
    }
  }, [isCreator, session.id, session.status, totalCount, votedCount]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-8 sm:px-6">
      <div className="w-full rounded-2xl border border-primary/20 bg-card/70 p-8 text-center shadow-2xl shadow-primary/10 backdrop-blur">
        <motion.div className="relative mb-8" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
          <svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="50" stroke="rgba(92, 107, 255, 0.2)" strokeWidth="8" fill="none" />
            <motion.circle cx="60" cy="60" r="50" stroke="#5C6BFF" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="314" strokeDashoffset="157" animate={{ strokeDashoffset: [157, 0, 157] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
              <Check className="h-8 w-8 text-success" />
            </div>
          </div>
        </motion.div>

        <h1 className="mb-2 text-3xl font-bold md:text-4xl">You're in!</h1>
        <p className="mb-8 text-muted-foreground">Waiting for the group...</p>

        <motion.div className="mb-8 text-5xl font-bold" key={votedCount} initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          {votedCount} <span className="text-muted-foreground">of</span> {totalCount}
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-5">
          {participants.map((participant) => (
            <motion.div key={participant.id} className="relative" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
              <Avatar participant={participant} showVote />
              {!participant.hasVoted && <motion.div className="absolute left-1 top-0 h-14 w-14 rounded-full border-2 border-primary" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />}
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}
