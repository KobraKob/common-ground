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
  AlertTriangle,
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
      const queue = await getModerationQueue();
      setReports(queue);
      setLoading(false);
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
      alert(`Action ${actionType} completed successfully.`);
    } catch {
      alert('Failed to execute moderation action');
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
      <div className="celestial-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-[#F8F7FF] flex items-center gap-2">
            <span>Pending Incident Reports ({reports.length})</span>
            <span className="text-[#FBBF24]">✦</span>
          </h2>
          <span className="neo-badge text-[9px] bg-amber-500/15 text-[#FDE68A] border-amber-400/30">
            TRIAGE QUEUE
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-[#C4B5FD] bg-purple-950/20 rounded-2xl border border-purple-500/20">
            ✓ All clean. No pending student safety reports in the queue!
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-xl border border-purple-500/25 bg-purple-950/25 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="neo-badge text-[9px] bg-rose-500/15 text-rose-300 border-rose-400/40">
                      {rep.reason}
                    </span>
                    <span className="neo-badge text-[9px] bg-purple-900/60 text-[#C4B5FD] border-purple-400/30">
                      TARGET: {rep.target_type}
                    </span>
                    <span className="text-[10px] font-mono text-[#7C6FA6]">
                      Report ID: {rep.id.slice(0, 8)} • Reported {new Date(rep.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-[#F8F7FF] mb-1">
                    Details: "{rep.details || 'No additional notes provided by reporter.'}"
                  </p>
                </div>

                {/* Moderation Actions Bar */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(rep.id, 'HIDE_CONTENT', rep.target_type, rep.target_id)}
                    className="pill-glass text-[10px] py-1 px-3 border-amber-400/40 text-amber-200 hover:border-amber-400"
                    title="Hide content from public feeds and search"
                  >
                    <EyeOff className="w-3 h-3 text-[#FBBF24]" />
                    <span>Hide Content</span>
                  </button>

                  <button
                    onClick={() => handleAction(rep.id, 'SUSPEND_USER', rep.target_type, rep.target_id)}
                    className="pill-glass text-[10px] py-1 px-3 border-rose-400/40 text-rose-300 hover:border-rose-400"
                    title="Suspend user account across all campus hubs"
                  >
                    <Ban className="w-3 h-3 text-rose-400" />
                    <span>Suspend</span>
                  </button>

                  <button
                    onClick={() => handleAction(rep.id, 'DISMISS_REPORT', rep.target_type, rep.target_id)}
                    className="pill-glass text-[10px] py-1 px-3"
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
      <div className="celestial-card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-[#FBBF24]" />
          <h2 className="font-display text-lg font-bold text-[#F8F7FF]">
            Immutable Audit Trail (moderation_actions)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-purple-500/20 text-[#7C6FA6] text-[10px] uppercase">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Actor</th>
                <th className="pb-3">Action</th>
                <th className="pb-3">Target</th>
                <th className="pb-3">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {auditLog.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#7C6FA6]">
                    No moderation actions logged in current session. All actions taken by moderators are logged here.
                  </td>
                </tr>
              ) : (
                auditLog.map((log) => (
                  <tr key={log.id} className="py-2.5">
                  <td className="py-3 text-[#7C6FA6]">{log.timestamp}</td>
                  <td className="py-3 font-semibold text-[#F8F7FF]">{log.actor}</td>
                  <td className="py-3">
                    <span className="neo-badge text-[8px] bg-purple-900/60 text-[#C4B5FD] border-purple-400/30">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="py-3 text-[#C4B5FD]">{log.target}</td>
                  <td className="py-3 text-[#7C6FA6] truncate max-w-xs">{log.notes}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
