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
}

export const MatchDetail: React.FC<Props> = ({ commentary, scorecard, isActive, isCommentaryLoading, isScorecardLoading }) => {
  const [tab, setTab] = useState<'data'|'commentary'>('data');

  if (!isActive) {
    return <LiveFeed messages={[]} isActive={false} />;
  }

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black rounded-2xl overflow-hidden shadow-hard">
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
