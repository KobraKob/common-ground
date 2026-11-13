'use client';

import React, { useState } from 'react';
import { submitReport } from '@/lib/api';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'USER' | 'POST' | 'COMMENT' | 'MESSAGE' | 'COMMUNITY' | 'EVENT' | 'PROJECT' | 'RESOURCE';
  targetId: string;
  targetTitle?: string;
}

export function ReportModal({ isOpen, onClose, targetType, targetId, targetTitle }: ReportModalProps) {
  const [reason, setReason] = useState('HARASSMENT');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitReport({
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      alert('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="celestial-card w-full max-w-md p-6 relative border border-purple-400/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#7C6FA6] hover:text-[#F8F7FF] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-display text-lg font-bold text-[#F8F7FF]">
            Report {targetType}
          </h3>
        </div>

        {targetTitle && (
          <p className="text-xs text-[#C4B5FD] font-mono mb-4 truncate bg-purple-950/40 p-2 rounded-lg border border-purple-500/20">
            Target: {targetTitle}
          </p>
        )}

        {success ? (
          <div className="p-4 bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 rounded-xl text-center text-sm font-mono flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Report received by CommonGround safety moderators. Thank you for keeping campus safe.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1.5">
                Reason for report:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="celestial-input w-full text-sm p-2.5 font-mono text-[#F8F7FF] cursor-pointer"
              >
                <option value="HARASSMENT" className="bg-[#0B0524] text-white">Harassment or abusive language</option>
                <option value="IMPERSONATION" className="bg-[#0B0524] text-white">Impersonation or fake college badge</option>
                <option value="SPAM" className="bg-[#0B0524] text-white">Commercial spam or unsolicited promotion</option>
                <option value="UNSAFE_MEETUP" className="bg-[#0B0524] text-white">Unsafe meetup or suspicious activity</option>
                <option value="MISINFORMATION" className="bg-[#0B0524] text-white">Misinformation or misleading exam advice</option>
                <option value="OTHER" className="bg-[#0B0524] text-white">Other violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#C4B5FD] mb-1.5">
                Context / Details:
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what occurred with relevant context..."
                rows={3}
                className="celestial-input w-full text-xs p-3 text-[#F8F7FF]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-mono text-[#C4B5FD] hover:text-[#F8F7FF] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-campus-amber text-xs font-mono px-5 py-2"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
