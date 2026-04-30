import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { createContext, useContext, useEffect } from "react";
import { useSession } from "../hooks/useSession";
import { Session } from "../types";

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
    const statusPath = session.status === "voting" && participant?.hasVoted ? "voted" : session.status === "voting" ? "vote" : session.status;
    const desiredPath = `/session/${sessionId}/${statusPath}`;
    if (location.pathname !== desiredPath) navigate(desiredPath, { replace: true });
  }, [location.pathname, navigate, session, sessionId, userId]);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading session...</div>;
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
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div className="max-w-md rounded-2xl border border-border bg-card p-6">
        <h1 className="mb-2 text-2xl font-bold">Decision unavailable</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </main>
  );
}
