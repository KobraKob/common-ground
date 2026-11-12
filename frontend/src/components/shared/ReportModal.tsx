'use client';

import React, { useState } from 'react';
import { submitReport } from '@/lib/api';
import { AlertTriangle, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="neo-card w-full max-w-md p-6 relative bg-white dark:bg-[#151726] border border-[#CCCFFA] dark:border-[#282C47]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-red-500">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="neo-heading text-lg font-bold text-gray-900 dark:text-white">
            Report {targetType}
          </h3>
        </div>

        {targetTitle && (
          <p className="text-xs text-gray-500 font-mono mb-4 truncate">
            Target: {targetTitle}
          </p>
        )}

        {success ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded text-center text-sm font-mono">
            Report received by CommonGround safety moderators. Thank you for keeping campus safe.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Reason for report:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-sm p-2 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-gray-50 dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 font-mono focus:outline-none"
              >
                <option value="HARASSMENT">Harassment or abusive language</option>
                <option value="IMPERSONATION">Impersonation or fake college badge</option>
                <option value="SPAM">Commercial spam or unsolicited promotion</option>
                <option value="UNSAFE_MEETUP">Unsafe meetup or suspicious activity</option>
                <option value="MISINFORMATION">Misinformation or misleading exam advice</option>
                <option value="OTHER">Other violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1">
                Context / Details:
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe what occurred with relevant context..."
                rows={3}
                className="w-full text-sm p-2 rounded border border-[#CCCFFA] dark:border-[#282C47] bg-gray-50 dark:bg-[#0E0F1A] text-gray-900 dark:text-gray-100 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="neo-pill-btn bg-transparent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="neo-pill-btn neo-pill-btn-primary"
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
