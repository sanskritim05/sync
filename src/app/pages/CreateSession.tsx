import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button, Input, Panel, Screen } from "../components/kit";
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
        const localOptions = makeLocalOptions(sessionId, filledOptions, makeOptionId);
        created = createLocalSession({
          id: sessionId,
          topic: topic.trim(),
          status: "waiting",
          createdBy: userId,
          expiresAt: Date.now() + SESSION_TTL_MS,
          options: localOptions,
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
    <Screen className="flex max-w-2xl flex-col gap-6 py-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="size-12 px-0" onClick={() => navigate("/")} aria-label="Back">
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-display text-2xl font-bold">New Decision</h1>
      </div>

      <Panel className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-medium">Topic</label>
          <span className="text-xs text-muted-foreground">
            {topic.length}/{charLimit}
          </span>
        </div>
        <Input
          value={topic}
          maxLength={charLimit}
          placeholder="e.g., Where should we eat?"
          onChange={(event) => setTopic(event.target.value.slice(0, charLimit))}
        />
      </Panel>

      <Panel className="flex flex-col gap-3">
        <label className="text-sm font-medium">Options</label>
        <AnimatePresence initial={false}>
          {options.map((option, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2"
            >
              <Input
                value={option}
                maxLength={40}
                placeholder={`Option ${index + 1}`}
                onChange={(event) => {
                  const next = [...options];
                  next[index] = event.target.value.slice(0, 40);
                  setOptions(next);
                }}
              />
              {options.length > 2 && (
                <Button
                  variant="ghost"
                  aria-label="Remove option"
                  className="size-12 shrink-0 px-0"
                  onClick={() => setOptions(options.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <X size={18} />
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {options.length < 6 && (
          <Button variant="outline" onClick={() => setOptions([...options, ""])}>
            <Plus size={18} /> Add option
          </Button>
        )}
      </Panel>

      <Button disabled={!isValid || creating} onClick={() => void createSession()}>
        {creating ? "Creating..." : "Create & Invite"}
      </Button>
    </Screen>
  );
}
