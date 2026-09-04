import React, { useState } from 'react';
import { ScorecardInnings } from '../types';

// ponytail: one component, two tables per innings, minimal
export const MatchData: React.FC<{ scorecard: ScorecardInnings[] | null; isLoading?: boolean }> = ({ scorecard, isLoading }) => {
  const [active, setActive] = useState(0);
  if (isLoading) return <div className="text-center py-10 text-gray-400 italic">Loading match data...</div>;
  if (!scorecard || scorecard.length === 0) return <div className="text-center py-10 text-gray-400 italic">Waiting for scorecard... <br/><span className="text-xs">Live overs, runs, wickets will appear here.</span></div>;

  const inn = scorecard[Math.min(active, scorecard.length - 1)];
  const hasBatsman = Array.isArray(inn.batsman) && inn.batsman.length > 0;
  const hasBowler = Array.isArray(inn.bowler) && inn.bowler.length > 0;

  return (
    <div className="space-y-4">
      {scorecard.length > 1 && (
        <div className="flex gap-2">
          {scorecard.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 border-black transition-all ${active===i?'bg-brand-yellow':'bg-white hover:bg-gray-50'}`}>
              Innings {i+1}
            </button>
          ))}
        </div>
      )}
      <div className="bg-brand-yellow border-2 border-black rounded-xl px-4 py-3">
        <div className="flex justify-between items-center">
          <span className="font-black text-sm">{inn.batTeam || `Innings ${inn.inningsId}`}</span>
          <span className="font-mono text-sm bg-white border-2 border-black rounded-full px-3 py-1 font-bold">{inn.score}/{inn.wickets} ({String(inn.overs)})</span>
        </div>
        {inn.runRate && <div className="text-xs font-medium mt-1">Run rate: {String(inn.runRate)}</div>}
      </div>

      {hasBatsman ? (
        <div className="border-2 border-black rounded-xl overflow-hidden">
          <div className="bg-black text-white text-xs font-bold px-3 py-2 flex justify-between"><span>Batting</span><span className="font-mono font-normal">{inn.batsman.length} players</span></div>
          <div className="divide-y divide-gray-200 max-h-[220px] overflow-auto custom-scrollbar">
            {inn.batsman.map((b) => (
              <div key={`${b.name}-${b.id}`} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-xs">
                <div>
                  <div className="font-bold flex gap-1 items-center">
                    {b.name}
                    {b.isCaptain && <span className="text-[9px] bg-black text-white rounded px-1">C</span>}
                    {b.isKeeper && <span className="text-[9px] bg-gray-200 border rounded px-1">Wk</span>}
                    {(!b.out || b.out === 'not out') && <span className="w-2 h-2 bg-green-500 rounded-full border border-black" title="not out"></span>}
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">{b.out || 'not out'}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="font-bold">{b.runs} <span className="text-gray-400">({b.balls})</span></div>
                  <div className="text-[11px] text-gray-500">{b.fours ?? 0}×4 {b.sixes ?? 0}×6 • {b.sr ?? '-'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {hasBowler ? (
        <div className="border-2 border-black rounded-xl overflow-hidden">
          <div className="bg-gray-900 text-white text-xs font-bold px-3 py-2">Bowling</div>
          <div className="divide-y divide-gray-200">
            {inn.bowler.map((b) => (
              <div key={`${b.name}-${b.id}`} className="grid grid-cols-[1fr_auto] gap-2 px-3 py-2 text-xs font-mono">
                <span className="font-bold truncate">{b.name}</span>
                <span className="text-right">{b.overs}-{b.maidens ?? 0}-{b.runs}-{b.wickets} <span className="text-gray-500">({b.economy})</span></span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {inn.extras && typeof inn.extras === 'object' && Object.keys(inn.extras as Record<string, unknown>).length > 0 && (
        <div className="text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          Extras: {JSON.stringify(inn.extras).slice(1,-1)}
        </div>
      )}
      {Array.isArray(inn.fow) && inn.fow.length > 0 && (
        <div className="text-[11px] font-mono bg-white border-2 border-black rounded-xl px-3 py-2">
          <div className="font-bold mb-1">Fall of wickets</div>
          <div className="flex flex-wrap gap-1">
            {(inn.fow as unknown as Array<{ overnbr?: number; runs?: number; batsmanname?: string }>).slice(0,8).map((f,i)=>(
              <span key={i} className="bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">{f.runs ?? '-'} <span className="text-gray-400">({f.overnbr ?? '-'})</span></span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
