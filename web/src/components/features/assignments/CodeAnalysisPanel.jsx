import { AlertTriangle, Clock, Code2, FileText, Loader2, ShieldCheck } from 'lucide-react';
import AttachmentButton from '../../common/AttachmentButton';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMetrics(metricsData) {
  if (!metricsData) return null;
  try {
    return JSON.parse(metricsData);
  } catch {
    return null;
  }
}

function normalizeAnalysisStatus(status) {
  return String(status || '').toLowerCase();
}

/**
 * Map a rubric criterion id + parsed metrics to a pass/warn/fail/unknown indicator.
 */
function getRubricIndicator(rubricId, metrics) {
  if (!metrics) return { color: 'gray', label: 'No data' };

  if (rubricId === 'code_quality') {
    const grade = String(metrics.grade || metrics.complexity || '').toUpperCase();
    if (grade === 'A' || grade === 'B') return { color: 'green', label: 'Pass' };
    if (grade === 'C') return { color: 'yellow', label: 'Warn' };
    if (grade) return { color: 'red', label: 'Fail' };
    return { color: 'gray', label: 'No data' };
  }

  if (rubricId === 'testing') {
    const raw = String(metrics.coverage || '');
    const pct = parseFloat(raw.replace('%', ''));
    if (Number.isNaN(pct)) return { color: 'gray', label: 'No data' };
    if (pct >= 80) return { color: 'green', label: 'Pass' };
    if (pct >= 60) return { color: 'yellow', label: 'Warn' };
    return { color: 'red', label: 'Fail' };
  }

  if (rubricId === 'correctness') {
    const bugs = Number(metrics.bugs ?? NaN);
    if (Number.isNaN(bugs)) return { color: 'gray', label: 'No data' };
    if (bugs === 0) return { color: 'green', label: 'Pass' };
    if (bugs <= 2) return { color: 'yellow', label: 'Warn' };
    return { color: 'red', label: 'Fail' };
  }

  // documentation — no metric mapped yet
  return { color: 'gray', label: 'Not analyzed' };
}

// ─── Dot color map ────────────────────────────────────────────────────────────

const DOT_COLOR = {
  green:  'bg-secondary-500',
  yellow: 'bg-warning-400',
  red:    'bg-error-500',
  gray:   'bg-neutral-300',
};

const LABEL_COLOR = {
  green:  'text-secondary-700',
  yellow: 'text-warning-700',
  red:    'text-error-700',
  gray:   'text-neutral-500',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const GRADE_COLOR = {
  A: 'text-secondary-600',
  B: 'text-secondary-500',
  C: 'text-warning-600',
  D: 'text-error-500',
  F: 'text-error-700',
};

function gradeColor(grade) {
  const letter = String(grade || '').charAt(0).toUpperCase();
  return GRADE_COLOR[letter] ?? 'text-neutral-900';
}

function MetricTile({ label, value, subtext, valueClassName }) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-3 text-center">
      <p className="text-xs font-medium text-neutral-500 mb-1">{label}</p>
      <p className={`text-xl font-bold tabular-nums ${valueClassName ?? 'text-neutral-900'}`}>{value ?? '—'}</p>
      {subtext && <p className="text-xs text-neutral-400 mt-0.5">{subtext}</p>}
    </div>
  );
}

function RubricHeatmapRow({ title, weight, indicator }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[indicator.color]}`}
          aria-hidden="true"
        />
        <span className="text-sm text-neutral-700 truncate">
          {title}
          <span className="ml-1 text-xs text-neutral-400">({weight}%)</span>
        </span>
      </div>
      <span className={`text-xs font-semibold shrink-0 ${LABEL_COLOR[indicator.color]}`}>
        {indicator.label}
      </span>
    </div>
  );
}

function AnalysisSpinnerCard() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary-500 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-neutral-800">Analyzing your code…</p>
        <p className="text-xs text-neutral-500 mt-0.5">
          We're scanning your repository. Results will appear here automatically.
        </p>
      </div>
    </div>
  );
}

function AnalysisErrorCard() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-50 p-4">
      <AlertTriangle className="h-5 w-5 shrink-0 text-warning-600 mt-0.5" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-warning-800">Analysis could not complete</p>
        <p className="text-xs text-warning-700 mt-0.5">
          The automated scan failed. Your instructor will review your submission manually.
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * CodeAnalysisPanel
 *
 * Renders the code analysis state for a submission. Purely presentational —
 * polling is handled by the parent page via a useEffect/setInterval.
 *
 * Props:
 *   codeAnalysis  — { status, metricsData, reportPdfUrl } from SubmissionResponse
 *   showRubric    — boolean: false for student view, true for teacher view
 *   rubricItems   — array of { id, title, weight } (teacher only)
 */
export default function CodeAnalysisPanel({ codeAnalysis, showRubric = false, rubricItems }) {
  if (!codeAnalysis) return null;

  const status = normalizeAnalysisStatus(codeAnalysis.status);
  const metrics = parseMetrics(codeAnalysis.metricsData);

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
      {/* Header */}
      <h3 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
        <Code2 className="h-4 w-4 text-neutral-400" aria-hidden="true" />
        Code Analysis
        <StatusBadge status={status} />
      </h3>

      {/* Spinner state */}
      {(status === 'pending' || status === 'analyzing') && <AnalysisSpinnerCard />}

      {/* Failed state */}
      {status === 'failed' && <AnalysisErrorCard />}

      {/* Completed state */}
      {status === 'completed' && (
        <div className="space-y-4">

          {/* Metric tiles */}
          <div className="grid grid-cols-2 gap-2">
            <MetricTile
              label="Grade"
              value={metrics?.grade ?? metrics?.complexity ?? '—'}
              subtext="overall"
              valueClassName={gradeColor(metrics?.grade ?? metrics?.complexity)}
            />
            <MetricTile
              label="Analyzed in"
              value={metrics?.analyzedIn ?? '—'}
              subtext={
                metrics?.analyzedAt
                  ? new Date(metrics.analyzedAt).toLocaleDateString()
                  : undefined
              }
            />
          </div>

          {/* Rubric heatmap — teacher only */}
          {showRubric && rubricItems && rubricItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Rubric Signals
              </p>
              <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-neutral-50 px-3">
                {rubricItems.map((item) => (
                  <RubricHeatmapRow
                    key={item.id}
                    title={item.title}
                    weight={item.weight}
                    indicator={getRubricIndicator(item.id, metrics)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* PDF report download */}
          {codeAnalysis.reportPdfUrl && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                Analysis Report
              </p>
              <AttachmentButton
                url={codeAnalysis.reportPdfUrl}
                fileName="analysis-report.pdf"
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = {
    pending:   { label: 'Pending',   cls: 'bg-neutral-100 text-neutral-600' },
    analyzing: { label: 'Analyzing', cls: 'bg-primary-50 text-primary-700' },
    completed: { label: 'Completed', cls: 'bg-secondary-50 text-secondary-700' },
    failed:    { label: 'Failed',    cls: 'bg-error-50 text-error-700' },
  }[status] ?? { label: status, cls: 'bg-neutral-100 text-neutral-500' };

  return (
    <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
