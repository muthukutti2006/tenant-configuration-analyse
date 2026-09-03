import React from "react";
import type { Conflict } from "../../types";
import { SeverityBadge, ConflictTypeBadge } from "../ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { conflictTypeLabel } from "../../lib/utils";

interface ConflictCardProps {
  conflict: Conflict;
  defaultExpanded?: boolean;
}

export function ConflictCard({ conflict, defaultExpanded = false }: ConflictCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const hasEvidence = !!conflict.evidence;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left"
        aria-expanded={expanded}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <SeverityBadge severity={conflict.severity} />
              <ConflictTypeBadge type={conflict.conflict_type} />
            </div>
            <CardTitle className="text-sm font-semibold text-slate-900 leading-snug">
              {conflict.title}
            </CardTitle>
            {conflict.tenant_name && (
              <p className="text-xs text-slate-500 mt-0.5">{conflict.tenant_name} · {conflict.tenant_id}</p>
            )}
          </div>
          <div className="flex-shrink-0 text-slate-400 mt-1">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </CardHeader>
      </button>

      {expanded && (
        <CardContent className="space-y-4 border-t border-slate-100">
          {/* Description */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Description</p>
            <p className="text-sm text-slate-700">{conflict.description}</p>
          </div>

          {/* Fields */}
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Fields Involved</p>
            <div className="flex flex-wrap gap-1">
              {conflict.fields_involved.map((f) => (
                <code key={f} className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                  {f}
                </code>
              ))}
            </div>
          </div>

          {/* Evidence Panel */}
          {hasEvidence && conflict.evidence && (
            <div className="rounded-md border border-indigo-200 bg-indigo-50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert size={15} className="text-indigo-600" />
                <p className="text-xs font-semibold text-indigo-800 uppercase tracking-wide">
                  Evidence
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Rule A */}
                <div className="bg-white rounded border border-indigo-100 p-3">
                  <p className="text-xs text-slate-500 mb-1">Rule A</p>
                  <code className="text-xs font-mono text-slate-700 block">{conflict.evidence.rule_a}</code>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {JSON.stringify(conflict.evidence.value_a)}
                  </p>
                </div>

                {/* Rule B */}
                {conflict.evidence.rule_b && (
                  <div className="bg-white rounded border border-indigo-100 p-3">
                    <p className="text-xs text-slate-500 mb-1">Rule B</p>
                    <code className="text-xs font-mono text-slate-700 block">{conflict.evidence.rule_b}</code>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      {JSON.stringify(conflict.evidence.value_b)}
                    </p>
                  </div>
                )}
              </div>

              {/* Why */}
              <div>
                <p className="text-xs font-medium text-indigo-700 mb-1">Why this is a conflict</p>
                <p className="text-sm text-slate-700">{conflict.evidence.why_conflict}</p>
              </div>

              {/* Recommendation */}
              <div className="bg-amber-50 border border-amber-200 rounded p-3">
                <p className="text-xs font-semibold text-amber-700 mb-1">⚑ Recommended Action</p>
                <p className="text-sm text-slate-700">{conflict.evidence.recommendation}</p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
