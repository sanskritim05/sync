import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button, Input, Panel, Screen } from "../components/kit";
import { hasSupabaseConfig, supabase } from "../supabase/client";
import { getLocalSession, joinLocalSession } from "../utils/localSessionStore";

export function JoinSession({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = useMemo(() => searchParams.get("sessionId")?.trim().toUpperCase() ?? "", [searchParams]);
  const [displayName, setDisplayName] = useState(localStorage.getItem("sync:displayName") ?? "");
  const [joining, setJoining] = useState(false);

  async function join(event: FormEvent) {
    event.preventDefault();
    if (!sessionId || !displayName.trim()) return;
    setJoining(true);

    if (!hasSupabaseConfig) {
      const localSession = getLocalSession(sessionId);
      if (!localSession) {
        toast.error("That session does not exist in this browser.");
        setJoining(false);
        return;
      }
      if (localSession.expiresAt <= Date.now()) {
        toast.error("That session has expired.");
        setJoining(false);
        return;
      }

      localStorage.setItem("sync:displayName", displayName.trim());
      const joinedSession = joinLocalSession(sessionId, userId, displayName.trim());
      navigate(`/session/${sessionId}/${joinedSession?.status === "voting" ? "vote" : joinedSession?.status ?? "waiting"}`);
      return;
    }

    const { data: session, error } = await supabase
      .from("sessions")
      .select("status, expires_at")
      .eq("id", sessionId)
      .maybeSingle<{ status: "waiting" | "voting" | "reveal"; expires_at: string }>();
    if (error || !session) {
      toast.error("That session does not exist.");
      setJoining(false);
      return;
    }
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      toast.error("That session has expired.");
      setJoining(false);
      return;
    }
    localStorage.setItem("sync:displayName", displayName.trim());
    await supabase.from("participants").upsert(
      {
        session_id: sessionId,
        user_id: userId,
        display_name: displayName.trim(),
        has_voted: false,
        joined_at: new Date().toISOString(),
      },
      { onConflict: "session_id,user_id" },
    );
    navigate(`/session/${sessionId}/${session.status === "voting" ? "vote" : session.status}`);
  }

  return (
    <Screen className="flex max-w-lg flex-col gap-6 py-6">
      <Button variant="ghost" className="w-12 px-0" onClick={() => navigate("/")} aria-label="Back">
        <ArrowLeft size={20} />
      </Button>
      <motion.h1
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="font-display text-5xl font-bold tracking-[0.2em] break-all text-primary sm:text-6xl"
      >
        {sessionId || "Session"}
      </motion.h1>
      <form onSubmit={(event) => void join(event)}>
        <Panel className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <label className="text-sm font-medium">Your display name</label>
            <span className="text-xs text-muted-foreground">{displayName.length}/24</span>
          </div>
          <Input
            value={displayName}
            maxLength={24}
            placeholder="e.g., Alex"
            autoFocus
            onChange={(event) => setDisplayName(event.target.value.slice(0, 24))}
          />
          <Button disabled={!sessionId || !displayName.trim() || joining}>
            {joining ? "Joining..." : "Join Decision"}
          </Button>
        </Panel>
      </form>
    </Screen>
  );
}
