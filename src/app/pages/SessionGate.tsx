import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { createContext, useContext, useEffect } from "react";
import { useSession } from "../hooks/useSession";
import { Session } from "../types";
import { Panel, Screen } from "../components/kit";

const SessionContext = createContext<Session | null>(null);

export function useLiveSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useLiveSession must be used inside SessionGate");
  return session;
}

export function SessionGate({ userId }: { userId: string }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, loading, expired } = useSession(sessionId);

  useEffect(() => {
    if (!session || !sessionId) return;
    const participant = session.participants.find((item) => item.id === userId);
    const votedOptionIds = new Set(session.votes.filter((vote) => vote.userId === userId).map((vote) => vote.optionId));
    const hasVotedOnEveryOption = session.options.length > 0 && session.options.every((option) => votedOptionIds.has(option.id));
    const hasFinishedVotingLocally = sessionStorage.getItem(`sync:finishedVoting:${session.id}:${userId}`) === "true";
    const hasFinishedVoting = Boolean(participant?.hasVoted || hasVotedOnEveryOption || hasFinishedVotingLocally);
    const statusPath = session.status === "voting" && hasFinishedVoting ? "voted" : session.status === "voting" ? "vote" : session.status;
    const desiredPath = `/session/${sessionId}/${statusPath}`;
    if (location.pathname !== desiredPath) navigate(desiredPath, { replace: true });
  }, [location.pathname, navigate, session, sessionId, userId]);

  if (loading) {
    return (
      <Screen className="grid min-h-dvh place-items-center">
        <p className="text-sm text-muted-foreground">Loading decision...</p>
      </Screen>
    );
  }
  if (expired) return <MissingSession message="This session expired after 24 hours." />;
  if (!session) return <MissingSession message="Session not found." />;

  return (
    <SessionContext.Provider value={session}>
      <Outlet />
    </SessionContext.Provider>
  );
}

function MissingSession({ message }: { message: string }) {
  return (
    <Screen className="grid min-h-dvh place-items-center">
      <Panel className="max-w-md text-center">
        <h1 className="font-display mb-2 text-2xl font-bold">Decision unavailable</h1>
        <p className="text-muted-foreground">{message}</p>
      </Panel>
    </Screen>
  );
}
