export type SessionStatus = "waiting" | "voting" | "reveal";

export type Option = {
  id: string;
  sessionId: string;
  label: string;
};

export type Participant = {
  id: string;
  sessionId: string;
  displayName: string;
  hasVoted: boolean;
  joinedAt: number;
};

export type Vote = {
  sessionId: string;
  optionId: string;
  userId: string;
  vote: boolean;
};

export type Session = {
  id: string;
  topic: string;
  status: SessionStatus;
  createdBy: string;
  expiresAt: number;
  options: Option[];
  participants: Participant[];
  votes: Vote[];
};
