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
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-8 sm:px-6">
      <form onSubmit={join} className="w-full rounded-2xl border border-primary/20 bg-card/70 p-6 shadow-2xl shadow-primary/10 backdrop-blur md:p-8">
        <button onClick={() => navigate("/")} type="button" className="mb-8 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-background/35 transition hover:bg-card" aria-label="Back">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Joining</p>
          <h1 className="text-4xl font-bold tracking-normal md:text-5xl">{sessionId || "Session"}</h1>
        </div>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value.slice(0, 24))}
          placeholder="Your display name"
          className="h-14 w-full rounded-2xl border border-border bg-card px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />
        <button disabled={!sessionId || !displayName.trim() || joining} className="h-14 w-full rounded-2xl bg-primary font-bold text-primary-foreground transition hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground md:w-auto md:px-12">
          {joining ? "Joining..." : "Join Decision"}
        </button>
      </form>
    </main>
  );
}
