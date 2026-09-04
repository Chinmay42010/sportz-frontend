import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMatchCommentary, fetchMatches, fetchMatchScorecard } from "../services/api";
import { Commentary, Match, WSMessage, ScorecardInnings } from "../types";
import { useWebSocket } from "./useWebSocket";

interface UseMatchData {
  matches: Match[];
  isLoading: boolean;
  error: string | null;
  commentary: Commentary[];
  isCommentaryLoading: boolean;
  scorecard: ScorecardInnings[] | null;
  isScorecardLoading: boolean;
  wsError: string | null;
  status: ReturnType<typeof useWebSocket>["status"];
  activeMatchId: string | number | null;
  newMatchesCount: number;
  dismissNewMatches: () => void;
  watchMatch: (id: string | number) => void;
  unwatchMatch: (id: string | number) => void;
  reloadMatches: () => void;
}

export const useMatchData = (): UseMatchData => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [isCommentaryLoading, setIsCommentaryLoading] = useState(false);
  const [scorecard, setScorecard] = useState<ScorecardInnings[] | null>(null);
  const [isScorecardLoading, setIsScorecardLoading] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [activeMatchId, setActiveMatchId] = useState<string | number | null>(null);
  const [newMatchesCount, setNewMatchesCount] = useState(0);
  const latestMatchIdRef = useRef<string | number | null>(null);
  const subscribedMatchIdsRef = useRef(new Set<string>());
  const hasLoadedRef = useRef(false);
  const knownMatchIdsRef = useRef(new Set<string>());
  const newMatchesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleWSMessage = useCallback((msg: WSMessage) => {
    switch (msg.type) {
      case "score_update":
        if (!subscribedMatchIdsRef.current.has(String(msg.matchId))) {
          return;
        }
        setMatches((prevMatches) =>
          prevMatches.map((m) => {
            // Loose equality check for ID (string vs number)
            // eslint-disable-next-line eqeqeq
            if (m.id == msg.matchId) {
              return {
                ...m,
                homeScore: msg.data.homeScore,
                awayScore: msg.data.awayScore,
              };
            }
            return m;
          })
        );
        break;
      case "scorecard": {
        if (latestMatchIdRef.current == null || msg.matchId != latestMatchIdRef.current) return;
        setScorecard(msg.data as unknown as ScorecardInnings[]);
        break;
      }
      case "commentary": {
        if (
          latestMatchIdRef.current == null ||
          msg.data.matchId != latestMatchIdRef.current
        ) {
          return;
        }
        const normalized = {
          ...msg.data,
          createdAt: msg.data.createdAt ?? new Date().toISOString(),
        };
        setCommentary((prev) => [normalized, ...prev]);
        break;
      }
      case "error":
        setWsError(`${msg.code}: ${msg.message}`);
        break;
      case "subscribed":
      case "unsubscribed":
      case "subscribed_all":
      case "unsubscribed_all":
      case "subscriptions":
      case "welcome":
      case "pong":
        break;
      default:
        break;
    }
  }, []);

  const {
    status,
    connectGlobal,
    subscribeMatch,
    unsubscribeMatch,
  } = useWebSocket(handleWSMessage);

  const loadMatches = useCallback(async () => {
    if (!hasLoadedRef.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await fetchMatches(100);
      const nextMatches = data.data || [];
      const nextMatchIds = new Set(nextMatches.map((match) => String(match.id)));
      setMatches((prevMatches) => {
        const prevById = new Map(
          prevMatches.map((match) => [String(match.id), match])
        );
        return nextMatches.map((match) => {
          const matchId = String(match.id);
          const prev = prevById.get(matchId);
          if (prev && !subscribedMatchIdsRef.current.has(matchId)) {
            return {
              ...match,
              homeScore: prev.homeScore,
              awayScore: prev.awayScore,
            };
          }
          return match;
        });
      });
      if (knownMatchIdsRef.current.size > 0) {
        let newCount = 0;
        nextMatchIds.forEach((matchId) => {
          if (!knownMatchIdsRef.current.has(matchId)) {
            newCount += 1;
          }
        });
        if (newCount > 0) {
          setNewMatchesCount((prev) => prev + newCount);
          if (newMatchesTimeoutRef.current) {
            clearTimeout(newMatchesTimeoutRef.current);
          }
          newMatchesTimeoutRef.current = setTimeout(() => {
            setNewMatchesCount(0);
            newMatchesTimeoutRef.current = null;
          }, 5000);
        }
      }
      knownMatchIdsRef.current = nextMatchIds;

      nextMatches.forEach((match) => {
        const matchId = String(match.id);
        if (subscribedMatchIdsRef.current.has(matchId) && match.status.toLowerCase() === "finished") {
          subscribedMatchIdsRef.current.delete(matchId);
          unsubscribeMatch(match.id);
          if (latestMatchIdRef.current == match.id) {
            setActiveMatchId(null);
            latestMatchIdRef.current = null;
            setCommentary([]);
            setIsCommentaryLoading(false);
          }
        }
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load matches";
      setError(msg);
    } finally {
      if (!hasLoadedRef.current) {
        setIsLoading(false);
        hasLoadedRef.current = true;
      }
    }
  }, [unsubscribeMatch]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadMatches();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadMatches]);

  useEffect(() => {
    connectGlobal();
  }, [connectGlobal]);

  useEffect(() => {
    latestMatchIdRef.current = activeMatchId;
  }, [activeMatchId]);

  useEffect(() => {
    return () => {
      if (newMatchesTimeoutRef.current) {
        clearTimeout(newMatchesTimeoutRef.current);
      }
    };
  }, []);

  const dismissNewMatches = useCallback(() => {
    if (newMatchesTimeoutRef.current) {
      clearTimeout(newMatchesTimeoutRef.current);
      newMatchesTimeoutRef.current = null;
    }
    setNewMatchesCount(0);
  }, []);

  const watchMatch = useCallback(
    (id: string | number) => {
      setCommentary([]);
      setScorecard(null);
      setIsCommentaryLoading(true);
      setIsScorecardLoading(true);
      setWsError(null);
      latestMatchIdRef.current = id;
      if (activeMatchId != null && activeMatchId != id) {
        const previousId = String(activeMatchId);
        subscribedMatchIdsRef.current.delete(previousId);
        unsubscribeMatch(activeMatchId);
      }
      setActiveMatchId(id);
      const matchId = String(id);
      subscribedMatchIdsRef.current.add(matchId);
      subscribeMatch(id);
      fetchMatchCommentary(id)
        .then((data) => {
          if (latestMatchIdRef.current == id) setCommentary(data.data || []);
        })
        .catch(() => {
          if (latestMatchIdRef.current == id) setCommentary([]);
        })
        .finally(() => {
          if (latestMatchIdRef.current == id) setIsCommentaryLoading(false);
        });
      fetchMatchScorecard(id)
        .then((res) => {
          if (latestMatchIdRef.current == id) {
            const sc = res.data?.scorecard;
            if (Array.isArray(sc) && sc.length) setScorecard(sc as unknown as ScorecardInnings[]);
            else if (res.data?.cricapi) {
              // fallback: make synthetic innings from cricapi score when no cricbuzz yet
              const ca = res.data.cricapi as unknown as { score?: unknown[] };
              if (Array.isArray(ca?.score) && (ca.score as unknown[]).length) {
                const s = ca.score as unknown as Array<{ r: number; w: number; o: number; inning: string }>;
                setScorecard([{
                  inningsId: 1, batTeam: "Live", score: s[0]?.r ?? 0, wickets: s[0]?.w ?? 0, overs: s[0]?.o ?? 0, runRate: null, extras: null, fow: [], batsman: [], bowler: []
                }] as unknown as ScorecardInnings[]);
              } else setScorecard(null);
            } else setScorecard(null);
          }
        })
        .catch(() => { if (latestMatchIdRef.current == id) setScorecard(null); })
        .finally(() => { if (latestMatchIdRef.current == id) setIsScorecardLoading(false); });
    },
    [activeMatchId, subscribeMatch, unsubscribeMatch]
  );

  const unwatchMatch = useCallback(
    (id: string | number) => {
      unsubscribeMatch(id);
      const matchId = String(id);
      subscribedMatchIdsRef.current.delete(matchId);
      if (activeMatchId == id) {
        setActiveMatchId(null);
        latestMatchIdRef.current = null;
        setCommentary([]);
        setIsCommentaryLoading(false);
        setScorecard(null);
        setIsScorecardLoading(false);
      }
    },
    [activeMatchId, unsubscribeMatch]
  );

  return {
    matches,
    isLoading,
    error,
    commentary,
    isCommentaryLoading,
    scorecard,
    isScorecardLoading,
    wsError,
    status,
    activeMatchId,
    newMatchesCount,
    dismissNewMatches,
    watchMatch,
    unwatchMatch,
    reloadMatches: loadMatches,
  };
};
