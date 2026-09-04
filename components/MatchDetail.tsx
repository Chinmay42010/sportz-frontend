import React, { useState } from 'react';
import { Commentary, ScorecardInnings } from '../types';
import { LiveFeed } from './LiveFeed';
import { MatchData } from './MatchData';

interface Props {
  commentary: Commentary[];
  scorecard: ScorecardInnings[] | null;
  isActive: boolean;
  isCommentaryLoading?: boolean;
  isScorecardLoading?: boolean;
  lastSyncedAt?: string | null;
  dataStale?: boolean;
}

function timeAgoLabel(iso?: string | null, stale?: boolean) {
  if (stale) return "Updates paused — daily limit reached";
  if (!iso) return null;
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (Number.isNaN(diff) || diff < 0) return null;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "Updated just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `Updated ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Updated ${h}h ago`;
  return `Updated ${Math.floor(h / 24)}d ago`;
}

export const MatchDetail: React.FC<Props> = ({ commentary, scorecard, isActive, isCommentaryLoading, isScorecardLoading, lastSyncedAt, dataStale }) => {
  const [tab, setTab] = useState<'data'|'commentary'>('data');
  const ago = timeAgoLabel(lastSyncedAt, dataStale);

  if (!isActive) {
    return <LiveFeed messages={[]} isActive={false} />;
  }

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black rounded-2xl overflow-hidden shadow-hard">
      {ago && <div className={`px-3 py-1.5 border-b border-black text-[11px] font-mono text-right ${dataStale ? 'bg-amber-50 text-amber-700 font-bold' : 'bg-gray-50 text-gray-600'}`} title={lastSyncedAt ?? ""}>{ago}</div>}
      <div className="flex border-b-2 border-black">
        <button onClick={() => setTab('data')} className={`flex-1 py-3 text-sm font-black border-r-2 border-black transition-all ${tab==='data' ? 'bg-brand-yellow' : 'bg-white hover:bg-gray-50'}`}>
          Match Data
        </button>
        <button onClick={() => setTab('commentary')} className={`flex-1 py-3 text-sm font-black transition-all ${tab==='commentary' ? 'bg-brand-blue' : 'bg-white hover:bg-gray-50'}`}>
          Commentary
          <span className="ml-2 text-xs font-mono bg-white border border-black rounded-full px-1.5 py-0.5">{commentary.length}</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {tab === 'data' ? (
          <div className="p-4">
            <MatchData scorecard={scorecard} isLoading={isScorecardLoading} />
          </div>
        ) : (
          // reuse LiveFeed inner without its outer wrapper
          <div className="h-full">
            <LiveFeed messages={commentary} isActive={true} isLoading={isCommentaryLoading} />
          </div>
        )}
      </div>
    </div>
  );
};
