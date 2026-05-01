import { ArrowLeft, Plus, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { hasSupabaseConfig, supabase } from "../supabase/client";
import { createLocalSession, makeLocalOptions } from "../utils/localSessionStore";
import { makeOptionId, makeSessionId, SESSION_TTL_MS } from "../utils/session";

export function CreateSession({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);
  const charLimit = 60;
  const filledOptions = options.map((option) => option.trim()).filter(Boolean);
  const isValid = topic.trim().length > 0 && filledOptions.length >= 2 && filledOptions.length <= 6;

  async function createSession() {
    if (!isValid || creating) return;
    setCreating(true);

    let sessionId = makeSessionId();
    const maxAttempts = 5;
    let created = false;

    if (!hasSupabaseConfig) {
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const options = makeLocalOptions(sessionId, filledOptions, makeOptionId);
        created = createLocalSession({
          id: sessionId,
          topic: topic.trim(),
          status: "waiting",
          createdBy: userId,
          expiresAt: Date.now() + SESSION_TTL_MS,
          options,
          participants: [
            {
              id: userId,
              sessionId,
              displayName: "Host",
              hasVoted: false,
              joinedAt: Date.now(),
            },
          ],
          votes: [],
        });

        if (created) break;
        sessionId = makeSessionId();
      }

      if (!created) {
        toast.error("Unable to create a unique session. Please try again.");
        setCreating(false);
        return;
      }

      navigate(`/session/${sessionId}/waiting`);
      return;
    }

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const { error: sessionError } = await supabase.from("sessions").insert({
        id: sessionId,
        topic: topic.trim(),
        status: "waiting",
        created_by: userId,
        expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      });

      if (!sessionError) {
        created = true;
        break;
      }

      const isDuplicate = sessionError.message?.toLowerCase().includes("duplicate") || sessionError.code === "23505";
      if (!isDuplicate) {
        toast.error("Failed to create session. Please try again.");
        setCreating(false);
        return;
      }

      sessionId = makeSessionId();
    }

    if (!created) {
      toast.error("Unable to create a unique session. Please try again.");
      setCreating(false);
      return;
    }

    const { error: optionsError } = await supabase.from("options").insert(
      filledOptions.map((label, index) => ({ id: makeOptionId(index), session_id: sessionId, label })),
    );
    if (optionsError) {
      toast.error("Failed to create options. Please try again.");
      setCreating(false);
      return;
    }

    const { error: participantError } = await supabase.from("participants").upsert(
      {
        session_id: sessionId,
        user_id: userId,
        display_name: "Host",
        has_voted: false,
        joined_at: new Date().toISOString(),
      },
      { onConflict: "session_id,user_id" },
    );

    if (participantError) {
      toast.error("Failed to join as host. Please try again.");
      setCreating(false);
      return;
    }

    navigate(`/session/${sessionId}/waiting`);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:px-6 lg:py-12">
      <div className="mb-8 flex items-center gap-4">
        <button onClick={() => navigate("/")} className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-card/70 transition hover:bg-card" aria-label="Back">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <p className="text-sm text-muted-foreground">Create a session</p>
          <h1 className="text-3xl font-bold md:text-4xl">New Decision</h1>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-primary/20 bg-card/70 p-6 shadow-2xl shadow-primary/10 backdrop-blur md:p-8">
        <section className="mb-8">
          <label className="mb-2 block text-sm text-muted-foreground">What are we deciding?</label>
          <input
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value.slice(0, charLimit))}
            placeholder="e.g., Where should we eat?"
            className="h-14 w-full rounded-2xl border border-border bg-card px-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={charLimit}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">{topic.length}/{charLimit}</p>
        </section>

        <section>
          <label className="mb-3 block text-sm text-muted-foreground">Options</label>
          <div className="grid gap-3 md:grid-cols-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(event) => {
                    const next = [...options];
                    next[index] = event.target.value;
                    setOptions(next);
                  }}
                  placeholder={`Option ${index + 1}`}
                  className="h-12 flex-1 rounded-xl border border-primary/40 bg-card px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={40}
                />
                {options.length > 2 && (
                  <button onClick={() => setOptions(options.filter((_, itemIndex) => itemIndex !== index))} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" aria-label="Remove option">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={() => setOptions([...options, ""])} disabled={options.length >= 6} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-40">
            <Plus className="h-5 w-5" />
            Add option
          </button>
          <p className="mt-3 text-xs text-muted-foreground">Add 2 to 6 options.</p>
        </section>

        <button onClick={createSession} disabled={!isValid || creating} className="mt-8 h-14 w-full rounded-2xl bg-primary font-bold text-primary-foreground transition hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground md:w-auto md:px-12">
          {creating ? "Creating..." : "Create & Invite"}
        </button>
      </div>
    </main>
  );
}
