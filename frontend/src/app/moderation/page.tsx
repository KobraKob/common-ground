'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  EyeOff, 
  History, 
  Sparkles
} from 'lucide-react';
import { getModerationQueue, executeModerationAction } from '@/lib/api';
import { ReportItem } from '@/types';
import { CampusHeroBanner } from '@/components/shared/CampusHeroBanner';

export default function ModerationPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const queue = await getModerationQueue();
        setReports(queue || []);
      } catch (err) {
        console.warn('Could not load moderation queue:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAction = async (reportId: string, actionType: string, targetType: string, targetId: string) => {
    try {
      await executeModerationAction({
        report_id: reportId,
        action_type: actionType,
        target_type: targetType,
        target_id: targetId,
        notes: `Executed ${actionType} by platform moderator in response to report ${reportId}`,
      });

      // Update local state
      setReports(reports.filter((r) => r.id !== reportId));
      setAuditLog([
        {
          id: `act-${Date.now()}`,
          actor: 'Platform Moderator',
          action_type: actionType,
          target: `${targetType} (${targetId})`,
          notes: `Action taken against report ${reportId}`,
          timestamp: 'Just now',
        },
        ...auditLog,
      ]);
    } catch {
      alert('Failed to execute moderation action. Please try again.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Moderation Queue Header Banner */}
      <CampusHeroBanner
        title="Safety & Mod Queue"
        badgeText="COMMUNITY GOVERNANCE RADAR • LIVE"
        shortCode="MOD // TRIAGE"
        subtitle="Bengaluru cross-campus student safety dashboard. Protect honest affiliations, audit flagged posts, and preserve trust across all participating college spaces."
        activeCount={reports.length}
        isOfficial={true}
      />

      {/* Reports Queue */}
      <div className="celestial-card p-6 md:p-8 rounded-xl border border-white/10 bg-[#12151F] space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#F8F7FF] flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Pending Incident Reports ({reports.length})</span>
          </h2>
          <span className="neo-badge text-[9px] bg-amber-500/15 text-[#FDE68A] border-amber-400/30">
            TRIAGE QUEUE
          </span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="w-32 h-4 rounded skeleton-shimmer" />
                <div className="w-full h-8 rounded skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400 bg-white/[0.02] rounded-xl border border-white/10 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>All clean. No pending student safety reports in the queue!</span>
          </div>
        ) : (
          <div className="space-y-3.5">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="neo-badge text-[9px] bg-rose-500/15 text-rose-300 border-rose-400/40">
                      {rep.reason}
                    </span>
                    <span className="neo-badge text-[9px] bg-white/5 text-slate-300 border-white/10">
                      TARGET: {rep.target_type}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Report ID: {rep.id.slice(0, 8)} • Reported {new Date(rep.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-slate-200">
                    Details: &quot;{rep.details || 'No additional notes provided by reporter.'}&quot;
                  </p>
                </div>

                {/* Moderation Actions Bar */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(rep.id, 'HIDE_CONTENT', rep.target_type, rep.target_id)}
                    className="px-3 py-1.5 rounded-xl border border-amber-400/40 bg-amber-500/10 text-amber-200 hover:border-amber-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                    title="Hide content from public feeds and search"
                  >
                    <EyeOff className="w-3 h-3 text-[#FBBF24]" />
                    <span>Hide Content</span>
                  </button>

                  <button
                    onClick={() => handleAction(rep.id, 'SUSPEND_USER', rep.target_type, rep.target_id)}
                    className="px-3 py-1.5 rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-300 hover:border-rose-400 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                    title="Suspend user account across all campus hubs"
                  >
                    <Ban className="w-3 h-3 text-rose-400" />
                    <span>Suspend</span>
                  </button>

                  <button
                    onClick={() => handleAction(rep.id, 'DISMISS_REPORT', rep.target_type, rep.target_id)}
                    className="px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/[0.04] text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition-all"
                    title="Dismiss report as invalid"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Immutable Moderation Audit Log */}
      <div className="celestial-card p-6 md:p-8 rounded-xl border border-white/10 bg-[#12151F] space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#FBBF24]" />
          <h2 className="font-display text-lg font-bold text-[#F8F7FF]">
            Immutable Audit Trail (moderation_actions)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-500 text-[10px] uppercase">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Actor</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Target</th>
                <th className="pb-3">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {auditLog.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No moderation actions logged in current session. All actions taken by moderators are tracked here.
                  </td>
                </tr>
              ) : (
                auditLog.map((log) => (
                  <tr key={log.id} className="py-2.5">
                    <td className="py-3 text-slate-500">{log.timestamp}</td>
                    <td className="py-3 font-semibold text-[#F8F7FF]">{log.actor}</td>
                    <td className="py-3">
                      <span className="neo-badge text-[8px] bg-white/5 text-slate-300 border-white/10">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{log.target}</td>
                    <td className="py-3 text-slate-500 truncate max-w-xs">{log.notes}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
