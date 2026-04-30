import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { hasSupabaseConfig, supabase } from "../supabase/client";
import { Option, Participant, Session, SessionStatus, Vote } from "../types";
import { getLocalSession, onLocalSessionsChange, removeExpiredLocalSession } from "../utils/localSessionStore";

type SessionRow = {
  id: string;
  topic: string;
  status: SessionStatus;
  created_by: string;
  expires_at: string;
};

type OptionRow = {
  id: string;
  session_id: string;
  label: string;
};

type ParticipantRow = {
  session_id: string;
  user_id: string;
  display_name: string;
  has_voted: boolean;
  joined_at: string;
};

type VoteRow = {
  session_id: string;
  option_id: string;
  user_id: string;
  vote: boolean;
};

function mapSession(row: SessionRow, options: OptionRow[], participants: ParticipantRow[], votes: VoteRow[]): Session {
  return {
    id: row.id,
    topic: row.topic,
    status: row.status,
    createdBy: row.created_by,
    expiresAt: new Date(row.expires_at).getTime(),
    options: options.map<Option>((option) => ({
      id: option.id,
      sessionId: option.session_id,
      label: option.label,
    })),
    participants: participants.map<Participant>((participant) => ({
      id: participant.user_id,
      sessionId: participant.session_id,
      displayName: participant.display_name,
      hasVoted: participant.has_voted,
      joinedAt: new Date(participant.joined_at).getTime(),
    })),
    votes: votes.map<Vote>((vote) => ({
      sessionId: vote.session_id,
      optionId: vote.option_id,
      userId: vote.user_id,
      vote: vote.vote,
    })),
  };
}

export function useSession(sessionId: string | undefined) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [expired, setExpired] = useState(false);

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    if (!hasSupabaseConfig) {
      const localSession = getLocalSession(sessionId);
      if (!localSession) {
        setSession(null);
        setLoading(false);
        return;
      }

      if (localSession.expiresAt <= Date.now()) {
        setExpired(true);
        removeExpiredLocalSession(sessionId);
        setSession(null);
        setLoading(false);
        return;
      }

      setSession(localSession);
      setLoading(false);
      return;
    }

    const { data: sessionRow, error: sessionError } = await supabase
      .from("sessions")
      .select("id, topic, status, created_by, expires_at")
      .eq("id", sessionId)
      .maybeSingle<SessionRow>();

    if (sessionError || !sessionRow) {
      setSession(null);
      setLoading(false);
      return;
    }

    if (new Date(sessionRow.expires_at).getTime() <= Date.now()) {
      setExpired(true);
      await supabase.from("sessions").delete().eq("id", sessionId);
      setSession(null);
      setLoading(false);
      return;
    }

    const [optionsResponse, participantsResponse, votesResponse] = await Promise.all([
      supabase.from("options").select("id, session_id, label").eq("session_id", sessionId).order("id"),
      supabase.from("participants").select("session_id, user_id, display_name, has_voted, joined_at").eq("session_id", sessionId).order("joined_at"),
      supabase.from("votes").select("session_id, option_id, user_id, vote").eq("session_id", sessionId),
    ]);

    setSession(
      mapSession(
        sessionRow,
        (optionsResponse.data ?? []) as OptionRow[],
        (participantsResponse.data ?? []) as ParticipantRow[],
        (votesResponse.data ?? []) as VoteRow[],
      ),
    );
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!sessionId) return;

    if (!hasSupabaseConfig) {
      return onLocalSessionsChange(() => {
        void loadSession();
      });
    }

    const reload = (_payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      void loadSession();
    };

    const channel = supabase
      .channel(`sync-session-${sessionId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `id=eq.${sessionId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "options", filter: `session_id=eq.${sessionId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "participants", filter: `session_id=eq.${sessionId}` }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "votes", filter: `session_id=eq.${sessionId}` }, reload)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadSession, sessionId]);

  return { session, loading, expired };
}
