import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface MissingStoresWarningProps {
  missingIds: string[];
}

export default function MissingStoresWarning({ missingIds }: MissingStoresWarningProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (missingIds.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 shadow-xs" id="missing-stores-banner">
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-amber-900 font-medium text-sm">
              Warning: Reference Data Mismatch ({missingIds.length} store{missingIds.length > 1 ? 's' : ''} missing)
            </h4>
            <p className="text-amber-700 text-xs mt-0.5">
              Some transaction records refer to Store IDs that do not exist in the Store Master reference file. These have been merged with default placeholder names.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2.5 py-1 text-amber-800 hover:bg-amber-100/50 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          id="toggle-missing-details-btn"
        >
          <span>{isOpen ? 'Hide Details' : 'Show Details'}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-amber-200/60" id="missing-stores-list">
          <p className="text-amber-800 text-[11px] font-semibold mb-2">Affected Store IDs:</p>
          <div className="flex flex-wrap gap-1.5">
            {missingIds.map((id) => (
              <span
                key={id}
                className="bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-mono px-2 py-0.5 rounded-md"
              >
                {id}
              </span>
            ))}
          </div>
          <p className="text-amber-600 text-[10px] mt-2">
            Tip: Standard transaction data will still be fully aggregateable, but filters based on Region and Store Format for these stores will fall into the "Unknown" category.
          </p>
        </div>
      )}
    </div>
  );
}
