import { ArrowLeft } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
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

    const { data: session, error } = await supabase.from("sessions").select("status, expires_at").eq("id", sessionId).maybeSingle<{ status: "waiting" | "voting" | "reveal"; expires_at: string }>();
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
    await supabase
      .from("participants")
      .upsert(
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
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl items-center px-4 py-6 sm:px-6">
      <form onSubmit={join} className="grid w-full gap-6 rounded-2xl border border-primary/20 bg-card/70 p-4 shadow-2xl shadow-primary/10 backdrop-blur sm:p-6 md:grid-cols-[120px_1fr] md:gap-10 md:p-10">
        <button onClick={() => navigate("/")} type="button" className="flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-background/35 transition hover:bg-card" aria-label="Back">
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="max-w-3xl">
          <div className="mb-8 md:mb-10">
            <p className="mb-3 text-sm text-muted-foreground">Joining</p>
            <h1 className="break-all text-4xl font-bold tracking-normal sm:text-5xl md:text-6xl">{sessionId || "Session"}</h1>
          </div>
          <div className="space-y-5">
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value.slice(0, 24))}
              placeholder="Your display name"
              className="h-14 w-full rounded-2xl border border-border bg-card px-5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:h-16 sm:text-lg"
              autoFocus
            />
            <button disabled={!sessionId || !displayName.trim() || joining} className="h-14 w-full rounded-2xl bg-primary font-bold text-primary-foreground transition hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground md:w-auto md:px-12">
              {joining ? "Joining..." : "Join Decision"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
