import { Option, Session, SessionStatus, Vote } from "../types";

const STORAGE_KEY = "sync:localSessions";
const USER_ID_KEY = "sync:localUserId";
const EVENT_NAME = "sync:local-session-updated";

function readSessions(): Record<string, Session> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, Session>;
  } catch {
    return {};
  }
}

function writeSessions(sessions: Record<string, Session>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function getLocalUserId() {
  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;

  const next = crypto.randomUUID();
  localStorage.setItem(USER_ID_KEY, next);
  return next;
}

export function onLocalSessionsChange(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };

  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getLocalSession(sessionId: string) {
  return readSessions()[sessionId] ?? null;
}

export function createLocalSession(session: Session) {
  const sessions = readSessions();
  if (sessions[session.id]) return false;

  sessions[session.id] = session;
  writeSessions(sessions);
  return true;
}

export function joinLocalSession(sessionId: string, userId: string, displayName: string) {
  const sessions = readSessions();
  const session = sessions[sessionId];
  if (!session) return null;

  const existingParticipant = session.participants.find((participant) => participant.id === userId);
  if (existingParticipant) {
    existingParticipant.displayName = displayName;
  } else {
    session.participants.push({
      id: userId,
      sessionId,
      displayName,
      hasVoted: false,
      joinedAt: Date.now(),
    });
  }

  writeSessions(sessions);
  return session;
}

export function updateLocalSessionStatus(sessionId: string, status: SessionStatus) {
  const sessions = readSessions();
  const session = sessions[sessionId];
  if (!session) return false;

  session.status = status;
  writeSessions(sessions);
  return true;
}

export function addLocalVote(vote: Vote) {
  const sessions = readSessions();
  const session = sessions[vote.sessionId];
  if (!session) return false;

  session.votes = session.votes.filter((item) => !(item.userId === vote.userId && item.optionId === vote.optionId));
  session.votes.push(vote);
  writeSessions(sessions);
  return true;
}

export function markLocalParticipantVoted(sessionId: string, userId: string) {
  const sessions = readSessions();
  const session = sessions[sessionId];
  const participant = session?.participants.find((item) => item.id === userId);
  if (!session || !participant) return false;

  participant.hasVoted = true;
  writeSessions(sessions);
  return true;
}

export function removeExpiredLocalSession(sessionId: string) {
  const sessions = readSessions();
  delete sessions[sessionId];
  writeSessions(sessions);
}

export function makeLocalOptions(sessionId: string, labels: string[], makeOptionId: (index: number) => string): Option[] {
  return labels.map((label, index) => ({
    id: makeOptionId(index),
    sessionId,
    label,
  }));
}
