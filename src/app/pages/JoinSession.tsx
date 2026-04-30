import { ArrowLeft } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "../supabase/client";

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
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center bg-background px-6">
      <button onClick={() => navigate("/")} className="absolute left-6 top-6 flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-card" aria-label="Back">
        <ArrowLeft className="h-6 w-6" />
      </button>
      <form onSubmit={join} className="space-y-5">
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Joining</p>
          <h1 className="text-4xl font-bold tracking-normal">{sessionId || "Session"}</h1>
        </div>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value.slice(0, 24))}
          placeholder="Your display name"
          className="h-14 w-full rounded-2xl border border-border bg-card px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          autoFocus
        />
        <button disabled={!sessionId || !displayName.trim() || joining} className="h-14 w-full rounded-2xl bg-primary font-bold text-primary-foreground transition hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground">
          {joining ? "Joining..." : "Join Decision"}
        </button>
      </form>
    </main>
  );
}
