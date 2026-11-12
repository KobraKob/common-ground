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
  AlertTriangle 
} from 'lucide-react';
import { getModerationQueue, executeModerationAction } from '@/lib/api';
import { ReportItem } from '@/types';

export default function ModerationPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [auditLog, setAuditLog] = useState<any[]>([
    {
      id: 'act-1',
      actor: 'CommonGround Safety Bot',
      action_type: 'VERIFY_AFFILIATION',
      target: 'RVCE CSE 2026 Space',
      notes: 'Verified representative credentials via institutional domain check.',
      timestamp: '2 hours ago',
    },
    {
      id: 'act-2',
      actor: 'Mod Aarav',
      action_type: 'HIDE_CONTENT',
      target: 'Commercial spam post #4812',
      notes: 'Violated non-commercial student commons guideline.',
      timestamp: '1 day ago',
    },
  ]);
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
      {/* Moderation Queue Header */}
      <div className="neo-card p-6 bg-white dark:bg-[#151726] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-[#C5E17A]" />

        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h1 className="neo-heading text-2xl font-bold text-gray-900 dark:text-white">
              Platform Safety & <em>Moderation</em> Queue
            </h1>
            <p className="text-xs font-mono text-gray-500">
              Bengaluru Cross-Campus Community Governance Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Reports Queue */}
      <div className="neo-card p-6 bg-white dark:bg-[#151726]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="neo-heading text-lg font-bold text-gray-900 dark:text-white">
            Pending Reports ({reports.length})
          </h2>
          <span className="neo-badge text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
            TRIAGE QUEUE
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center text-xs font-mono text-gray-400">
            ✓ All clean. No pending student safety reports in the queue!
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-[#F5F6FD]/50 dark:bg-[#0E0F1A]/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="neo-badge text-[9px] bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40">
                      {rep.reason}
                    </span>
                    <span className="neo-badge text-[9px] bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      TARGET: {rep.target_type}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      Report ID: {rep.id.slice(0, 8)} • Reported {new Date(rep.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 mb-1">
                    Details: "{rep.details || 'No additional notes provided by reporter.'}"
                  </p>
                </div>

                {/* Moderation Actions Bar */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(rep.id, 'HIDE_CONTENT', rep.target_type, rep.target_id)}
                    className="neo-pill-btn text-[10px] py-1 px-3 border-amber-500/40 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    title="Hide content from public feeds and search"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Hide Content</span>
                  </button>

                  <button
                    onClick={() => handleAction(rep.id, 'SUSPEND_USER', rep.target_type, rep.target_id)}
                    className="neo-pill-btn text-[10px] py-1 px-3 border-red-500/40 hover:bg-red-500/10 text-red-600 dark:text-red-400"
                    title="Suspend user account across all campus hubs"
                  >
                    <Ban className="w-3 h-3" />
                    <span>Suspend</span>
                  </button>

                  <button
                    onClick={() => handleAction(rep.id, 'DISMISS_REPORT', rep.target_type, rep.target_id)}
                    className="neo-pill-btn text-[10px] py-1 px-3"
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

      {/* Immutable Moderation Audit Log (Section 4.2.9) */}
      <div className="neo-card p-6 bg-white dark:bg-[#151726]">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-[#6366F1] dark:text-[#C5E17A]" />
          <h2 className="neo-heading text-lg font-bold text-gray-900 dark:text-white">
            Immutable Audit Trail (moderation_actions)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#CCCFFA] dark:border-[#282C47] text-gray-400 text-[10px] uppercase">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Actor</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Target</th>
                <th className="pb-2">Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {auditLog.map((log) => (
                <tr key={log.id} className="py-2.5">
                  <td className="py-2 text-gray-500">{log.timestamp}</td>
                  <td className="py-2 font-semibold text-gray-800 dark:text-gray-200">{log.actor}</td>
                  <td className="py-2">
                    <span className="neo-badge text-[8px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-300">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{log.target}</td>
                  <td className="py-2 text-gray-500 truncate max-w-xs">{log.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
