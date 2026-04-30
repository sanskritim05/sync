import { Copy, Play, Share2, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar } from "../components/Avatar";
import { supabase } from "../supabase/client";
import { sessionParticipants } from "../utils/session";
import { useLiveSession } from "./SessionGate";

export function WaitingRoom({ userId }: { userId: string }) {
  const session = useLiveSession();
  const navigate = useNavigate();
  const participants = sessionParticipants(session);
  const isCreator = session.createdBy === userId;
  const inviteUrl = `${window.location.origin}/join?sessionId=${session.id}`;
  const [startingVoting, setStartingVoting] = useState(false);

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    toast.success("Invite link copied.");
  }

  async function shareInvite() {
    if (navigator.share) {
      await navigator.share({
        title: "Join my Sync decision",
        text: `Help decide: "${session.topic}"`,
        url: inviteUrl,
      });
      return;
    }
    await copyInvite();
  }

  async function startVoting() {
    if (!isCreator || participants.length < 2 || startingVoting) return;
    setStartingVoting(true);
    const { error } = await supabase.from("sessions").update({ status: "voting" }).eq("id", session.id);
    if (error) {
      toast.error("Failed to start voting. Please try again.");
      setStartingVoting(false);
    }
  }

  function cancelSession() {
    if (startingVoting) return;
    navigate("/", { replace: true });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col bg-background px-6 py-8">
      <div className="flex-1">
        <h1 className="mb-6 px-4 text-center text-2xl font-bold">{session.topic}</h1>

        <section className="mb-8 rounded-2xl bg-primary p-6">
          <p className="mb-2 text-sm text-primary-foreground/80">Share Invite</p>
          <div className="mb-4 rounded-xl bg-white/10 p-4">
            <p className="break-all text-center text-xl font-bold text-primary-foreground sm:text-2xl">{session.id}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyInvite} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white/20 font-medium text-primary-foreground transition hover:bg-white/30">
              <Copy className="h-5 w-5" />
              Copy
            </button>
            <button onClick={shareInvite} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white/20 font-medium text-primary-foreground transition hover:bg-white/30">
              <Share2 className="h-5 w-5" />
              Share
            </button>
          </div>
        </section>

        <section>
          <p className="mb-4 text-sm text-muted-foreground">Participants</p>
          <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6">
            {participants.map((participant, index) => (
              <motion.div key={participant.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.05 }}>
                <Avatar participant={participant} />
              </motion.div>
            ))}
            {Array.from({ length: Math.max(0, 6 - participants.length) }).map((_, index) => (
              <motion.div key={`empty-${index}`} className="flex flex-col items-center gap-2" animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}>
                <div className="h-14 w-14 rounded-full border-2 border-dashed border-muted-foreground/30" />
                <span className="text-xs text-muted-foreground/50">Waiting...</span>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {isCreator ? (
        <div className="space-y-3">
          <button onClick={startVoting} disabled={participants.length < 2 || startingVoting} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground transition hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground">
            <Play className="h-5 w-5" />
            {startingVoting ? "Starting..." : "Start Voting"}
          </button>
          <button onClick={cancelSession} disabled={startingVoting} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-border font-bold text-muted-foreground transition hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50">
            <X className="h-5 w-5" />
            Cancel
          </button>
        </div>
      ) : (
        <div className="py-4 text-center">
          <motion.p className="text-muted-foreground" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
            Waiting for the host to start...
          </motion.p>
        </div>
      )}
    </main>
  );
}
