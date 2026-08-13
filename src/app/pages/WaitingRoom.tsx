import { AnimatePresence, motion } from "framer-motion";
import { Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, Button, Panel, Screen } from "../components/kit";
import { hasSupabaseConfig, supabase } from "../supabase/client";
import { updateLocalSessionStatus } from "../utils/localSessionStore";
import { avatarColor, initials, sessionParticipants } from "../utils/session";
import { useLiveSession } from "./SessionGate";

export function WaitingRoom({ userId }: { userId: string }) {
  const session = useLiveSession();
  const navigate = useNavigate();
  const participants = sessionParticipants(session);
  const isCreator = session.createdBy === userId;
  const inviteUrl = `${window.location.origin}/?sessionId=${encodeURIComponent(session.id)}`;
  const [startingVoting, setStartingVoting] = useState(false);
  const emptySlots = Math.max(0, 3 - participants.length);

  async function copyText(text: string, successMessage: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        copyTextFallback(text);
      }
      toast.success(successMessage);
    } catch {
      try {
        copyTextFallback(text);
        toast.success(successMessage);
      } catch {
        toast.error("Copy failed. Please copy it manually.");
      }
    }
  }

  async function shareInvite() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join my Sync decision",
          text: `Help decide: "${session.topic}"`,
          url: inviteUrl,
        });
        return;
      }
      await copyText(inviteUrl, "Invite link copied");
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        toast.error("Sharing failed. Please try again.");
      }
    }
  }

  async function startVoting() {
    if (!isCreator || participants.length < 2 || startingVoting) return;
    setStartingVoting(true);
    if (!hasSupabaseConfig) {
      updateLocalSessionStatus(session.id, "voting");
      return;
    }

    const { error } = await supabase.from("sessions").update({ status: "voting" }).eq("id", session.id);
    if (error) {
      toast.error("Failed to start voting. Please try again.");
      setStartingVoting(false);
    }
  }

  return (
    <Screen className="flex flex-col gap-6 py-6">
      <h1 className="font-display text-3xl font-bold">{session.topic}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Session code</p>
          <p className="font-display text-5xl font-bold tracking-[0.15em] text-primary">{session.id}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={() => void copyText(session.id, "Code copied")}>
              <Copy size={18} /> Copy Code
            </Button>
            <Button className="flex-1" onClick={() => void shareInvite()}>
              <Share2 size={18} /> Share
            </Button>
          </div>
          {isCreator ? (
            <div className="flex flex-col gap-2">
              <Button disabled={participants.length < 2 || startingVoting} onClick={() => void startVoting()}>
                {startingVoting ? "Starting..." : "Start Voting"}
              </Button>
              {participants.length < 2 && (
                <p className="text-center text-xs text-muted-foreground">Need at least 2 participants</p>
              )}
              <Button variant="destructive" disabled={startingVoting} onClick={() => navigate("/", { replace: true })}>
                Cancel
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Waiting for the host to start...</p>
          )}
        </Panel>

        <Panel className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {participants.length} {participants.length === 1 ? "person" : "people"} in the room
          </p>
          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {participants.map((participant) => (
                <motion.li
                  key={participant.id}
                  layout
                  initial={{ opacity: 0, x: -12, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className="flex items-center gap-3"
                >
                  <Avatar name={initials(participant.displayName)} color={avatarColor(participant.id)} />
                  <span className="truncate font-medium">{participant.displayName}</span>
                  {participant.id === session.createdBy && (
                    <span className="bg-primary-soft rounded-full px-2 py-0.5 text-xs text-primary">Host</span>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
            {Array.from({ length: emptySlots }).map((_, index) => (
              <li key={`slot-${index}`} className="flex animate-pulse items-center gap-3">
                <div className="size-11 rounded-full border border-dashed border-border" />
                <span className="text-sm text-muted-foreground">Waiting...</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Screen>
  );
}

function copyTextFallback(text: string) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textArea);

  if (!copied) throw new Error("Copy command failed");
}
