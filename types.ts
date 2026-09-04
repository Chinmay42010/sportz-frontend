export interface Match {
  id: string | number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  status: string; // Allow flexible status strings from API
  startTime: string;
  endTime?: string;
  homeScore: number;
  awayScore: number;
  createdAt?: string;
}

export interface MatchResponse {
  data: Match[];
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface Commentary {
  id: string | number;
  matchId: string | number;
  minute?: number;
  sequence?: number;
  period?: string;
  eventType?: string;
  actor?: string;
  team?: string;
  message: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
  createdAt?: string;
}

export interface CommentaryResponse {
  data: Commentary[];
}

export interface ScorecardBatsman {
  id?: number;
  name: string;
  runs: number;
  balls: number;
  fours?: number;
  sixes?: number;
  sr?: string;
  out?: string;
  isCaptain?: boolean;
  isKeeper?: boolean;
}

export interface ScorecardBowler {
  id?: number;
  name: string;
  overs: string;
  maidens?: number;
  wickets: number;
  runs: number;
  economy?: string;
}

export interface ScorecardInnings {
  inningsId: number;
  batTeam?: string;
  score: number;
  wickets: number;
  overs: number | string;
  runRate?: number | string | null;
  extras?: Record<string, unknown> | null;
  fow?: unknown[];
  batsman: ScorecardBatsman[];
  bowler: ScorecardBowler[];
}

export interface ScorecardResponse {
  data: { scorecard: ScorecardInnings[] | null; cricapi: unknown | null; metadata: unknown; homeScore: number; awayScore: number; status: string };
}

// WebSocket Message Types
export interface WSMessageCommentary {
  type: 'commentary';
  data: Commentary;
}

export interface WSMessageScore {
  type: 'score_update';
  matchId: string | number;
  data: {
    homeScore: number;
    awayScore: number;
  };
}

export interface WSMessageScorecard {
  type: 'scorecard';
  matchId: string | number;
  data: ScorecardInnings[];
}

export interface WSMessageWelcome {
  type: 'welcome';
  message?: string;
}

export interface WSMessagePong {
  type: 'pong';
}

export interface WSMessageError {
  type: 'error';
  code: string;
  message: string;
}

export interface WSMessageSubscribed {
  type: 'subscribed';
  matchId: string | number;
}

export interface WSMessageUnsubscribed {
  type: 'unsubscribed';
  matchId: string | number;
}

export interface WSMessageSubscriptions {
  type: 'subscriptions';
  matchIds: Array<string | number>;
}

export interface WSMessageSubscribedAll {
  type: 'subscribed_all';
}

export interface WSMessageUnsubscribedAll {
  type: 'unsubscribed_all';
}

export type WSMessage =
  | WSMessageCommentary
  | WSMessageScore
  | WSMessageScorecard
  | WSMessageWelcome
  | WSMessagePong
  | WSMessageError
  | WSMessageSubscribed
  | WSMessageUnsubscribed
  | WSMessageSubscriptions
  | WSMessageSubscribedAll
  | WSMessageUnsubscribedAll;
