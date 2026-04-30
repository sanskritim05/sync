import { Option, Participant, Session } from "../types";

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function makeSessionId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function makeOptionId(index: number) {
  return `option_${index + 1}`;
}

export function sessionOptions(session: Session | null): Option[] {
  return session?.options ?? [];
}

export function sessionParticipants(session: Session | null): Participant[] {
  return [...(session?.participants ?? [])].sort((a, b) => a.joinedAt - b.joinedAt);
}

export function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function avatarColor(seed: string) {
  const colors = ["#5C6BFF", "#3DDC84", "#FF5C5C", "#FFD166", "#4ECDC4", "#B388FF"];
  let sum = 0;
  for (const char of seed) sum += char.charCodeAt(0);
  return colors[sum % colors.length];
}

export function tally(session: Session | null) {
  const options = sessionOptions(session);
  const yesVotes = options.map((option) => ({
    option,
    yes: (session?.votes ?? []).filter((vote) => vote.optionId === option.id && vote.vote).length,
    no: (session?.votes ?? []).filter((vote) => vote.optionId === option.id && !vote.vote).length,
  }));
  const max = Math.max(0, ...yesVotes.map((item) => item.yes));
  return {
    results: yesVotes.sort((a, b) => b.yes - a.yes || a.option.label.localeCompare(b.option.label)),
    winners: yesVotes.filter((item) => item.yes === max),
    max,
  };
}
