import React, { useState } from 'react';
import { Share2, Copy, Check, MessageSquare, Printer, Download, Upload, FileText, Sparkles } from 'lucide-react';
import { EventPlan } from '../../types';
import { generateInvitationText, generateWhatsAppLink, encodePlanToUrl, triggerPrint, InvitationTone } from '../../lib/sharing';
import { exportPlansToJSON, importPlansFromJSON } from '../../lib/storage';

interface InvitationsTabProps {
  plan: EventPlan;
  onImportComplete?: () => void;
  onShowToast: (msg: string) => void;
}

export const InvitationsTab: React.FC<InvitationsTabProps> = ({
  plan,
  onImportComplete,
  onShowToast,
}) => {
  const [tone, setTone] = useState<InvitationTone>('formal');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');

  const invitationText = generateInvitationText(plan, tone);
  const whatsappUrl = generateWhatsAppLink(invitationText);

  const handleGenerateShareLink = () => {
    const url = encodePlanToUrl(plan);
    setShareUrl(url);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    onShowToast('Compressed read-only link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(invitationText);
    setCopiedInvite(true);
    onShowToast('Invitation message copied!');
    setTimeout(() => setCopiedInvite(false), 3000);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(exportPlansToJSON());
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `CelebrAI-${plan.input.name.replace(/\s+/g, '_')}-backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('Backup JSON file exported successfully.');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importPlansFromJSON(content);
      if (result.success) {
        onShowToast(`Imported ${result.count} event(s) successfully!`);
        if (onImportComplete) onImportComplete();
      } else {
        onShowToast(`Import failed: ${result.error}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Invitation Generator */}
      <div className="bg-white rounded-3xl border border-ivory-300 shadow-soft p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-coral-100 flex items-center justify-center text-coral-700">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-plum-950">AI Invitation Generator</h3>
              <p className="text-xs text-stone-700">Generate formatted invites in 4 distinct tones with 1-click sharing</p>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-ivory-200 rounded-xl">
            {(['formal', 'casual', 'poetic', 'funky'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  tone === t
                    ? 'bg-plum-900 text-white shadow-2xs'
                    : 'text-stone-700 hover:text-plum-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Card */}
        <div className="p-6 rounded-2xl bg-ivory-100/90 border border-ivory-300 relative group">
          <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-stone-800 leading-relaxed">
            {invitationText}
          </pre>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyInvite}
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-plum-900 hover:bg-plum-950 transition-colors shadow-soft"
          >
            {copiedInvite ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-coral-300" />}
            <span>{copiedInvite ? 'Copied to Clipboard!' : 'Copy Invitation Text'}</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-soft"
          >
            <Share2 className="w-4 h-4 text-emerald-100" />
            <span>Share via WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Zero-Backend Compressed URL Sharing */}
      <div className="bg-white rounded-3xl border border-ivory-300 shadow-soft p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-plum-100 flex items-center justify-center text-plum-900">
            <Share2 className="w-5 h-5 text-plum-800" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-plum-950">Shareable Read-Only URL</h3>
            <p className="text-xs text-stone-700">
              Encodes the whole event plan into a compressed browser URL hash. Zero database or login needed.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleGenerateShareLink}
            type="button"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-plum-900 to-coral-700 hover:from-plum-950 hover:to-coral-800 transition-all shrink-0"
          >
            {copiedLink ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-coral-200" />}
            <span>{copiedLink ? 'Link Copied!' : 'Generate & Copy Share Link'}</span>
          </button>

          {shareUrl && (
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-ivory-300 bg-ivory-100 text-stone-700 focus:outline-hidden"
            />
          )}
        </div>
      </div>

      {/* Backup & Print Utilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Print / PDF */}
        <div className="p-6 rounded-3xl bg-white border border-ivory-300 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-stone-700" />
            <h4 className="font-serif font-bold text-lg text-plum-950">Print-Friendly Summary</h4>
          </div>
          <p className="text-xs text-stone-700">
            Formatted clean layout for paper printing or saving as a PDF document for offline coordinator use.
          </p>
          <button
            onClick={triggerPrint}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-stone-800 bg-ivory-200 hover:bg-ivory-300 border border-ivory-400 transition-colors"
          >
            <Printer className="w-4 h-4 text-stone-600" />
            <span>Launch Print / PDF View</span>
          </button>
        </div>

        {/* JSON Export & Import */}
        <div className="p-6 rounded-3xl bg-white border border-ivory-300 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-stone-700" />
            <h4 className="font-serif font-bold text-lg text-plum-950">JSON Backup Export & Import</h4>
          </div>
          <p className="text-xs text-stone-700">
            Full event archive backup. Easily migrate plans across devices or browsers.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportJSON}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-800 bg-ivory-200 hover:bg-ivory-300 border border-ivory-400 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-800 bg-ivory-200 hover:bg-ivory-300 border border-ivory-400 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
