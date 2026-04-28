"""Metrics schema definition using Pydantic."""

from typing import List, Literal

from pydantic import BaseModel, Field, field_validator


class MetricDetail(BaseModel):
    """Individual metric with score, notes, and confidence."""

    score: float = Field(..., ge=0.0, le=5.0)
    max: float = 5.0
    notes: str = ""
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class FileIssue(BaseModel):
    """An issue found at a specific line in a file."""

    line: int = 0
    severity: Literal["high", "medium", "low"] = "medium"
    message: str = ""

    @field_validator("severity", mode="before")
    @classmethod
    def normalize_severity(cls, v):
        if v == "critical":
            return "high"
        return v


class FileAnalysis(BaseModel):
    """Per-file analysis result."""

    filename: str
    lines: int = 0
    cyclomatic_complexity: float = 0.0
    duplication_pct: float = 0.0
    issues: List[FileIssue] = []


class DependencyDetail(BaseModel):
    """Individual dependency entry."""

    name: str
    current: str = ""
    status: Literal["ok", "outdated", "vulnerable", "unused"] = "ok"
    note: str = ""


class DependencyHealth(BaseModel):
    """Dependency health summary."""

    total: int = 0
    outdated: int = 0
    vulnerable: int = 0
    unused: int = 0
    details: List[DependencyDetail] = []


class CommitHygiene(BaseModel):
    """Commit hygiene metrics derived from git history."""

    score: float = Field(default=0.0, ge=0.0, le=5.0)
    total_commits: int = 0
    single_purpose_pct: float = 0.0
    message_quality_score: float = Field(default=0.0, ge=0.0, le=5.0)
    notes: str = ""


class RecommendationEvidence(BaseModel):
    """Code evidence backing a recommendation."""

    file: str = ""
    line: int = 0
    snippet: str = ""


class Recommendation(BaseModel):
    """Structured actionable recommendation."""

    title: str
    description: str
    priority: Literal["high", "medium", "low"] = "medium"
    effort: str = ""
    evidence: List[RecommendationEvidence] = []


class QuickWin(BaseModel):
    """A small, low-effort improvement."""

    title: str
    description: str
    effort: str = ""


# ── Architecture diagram models ───────────────────────────────────────────────


class ArchComponent(BaseModel):
    """A component node in the architecture diagram."""

    id: str
    label: str
    # Common types: "ui", "client", "server", "service", "model", "db", "util", "module"
    type: str = "module"


class ArchConnection(BaseModel):
    """A directed edge between two architecture components."""

    source: str
    target: str
    label: str = ""


# ── Class diagram models ──────────────────────────────────────────────────────


class ClassRelationship(BaseModel):
    """A relationship from this class to another."""

    to: str
    # Common types: "uses", "inherits", "implements", "composes", "aggregates"
    type: str = "uses"


class ClassEntry(BaseModel):
    """A class/interface entry in the class diagram."""

    name: str
    # Common types: "class", "interface", "abstract", "enum"
    type: str = "class"
    fields: List[str] = []
    methods: List[str] = []
    relationships: List[ClassRelationship] = []


# ── Project overview model ────────────────────────────────────────────────────


class ProjectOverview(BaseModel):
    """Formal structured project overview intended for academic review."""

    summary: str = ""
    contributors: List[str] = []
    technologies: List[str] = []
    implementation: str = ""
    design_decisions: str = ""
    key_features: List[str] = []
    setup_instructions: str = ""
    limitations: str = ""


# ── Main schema ───────────────────────────────────────────────────────────────


class MetricsSchema(BaseModel):
    """Complete metrics schema for a single code analysis run."""

    # Core metric scores
    solid: MetricDetail
    clean_code: MetricDetail
    oop: MetricDetail
    error_handling: MetricDetail
    testing: MetricDetail
    documentation: MetricDetail
    complexity: MetricDetail

    # Agent-generated narrative
    feedback: str = ""
    encouragement: str = ""
    project_overview: ProjectOverview = Field(default_factory=ProjectOverview)

    # Structured findings
    recommendations: List[Recommendation] = []
    per_file: List[FileAnalysis] = []
    dependencies: DependencyHealth = Field(default_factory=DependencyHealth)
    duplication_score: float = 0.0
    commit_hygiene: CommitHygiene = Field(default_factory=CommitHygiene)
    accessibility_score: float = 0.0
    performance_hints: List[str] = []
    quick_wins: List[QuickWin] = []
    positives: List[str] = []

    # Structural analysis (injected by pipeline, not from agent)
    file_tree: str = ""
    architecture_components: List[ArchComponent] = []
    architecture_connections: List[ArchConnection] = []
    class_diagram: List[ClassEntry] = []

    @field_validator("recommendations", mode="before")
    @classmethod
    def normalize_recommendations(cls, v):
        if isinstance(v, str):
            items = [r.strip() for r in v.split(",") if r.strip()]
            return [{"title": item, "description": item} for item in items]
        result = []
        for item in v:
            if isinstance(item, str):
                result.append({"title": item, "description": item, "priority": "medium", "effort": "", "evidence": []})
            elif isinstance(item, dict):
                if "title" not in item:
                    item["title"] = item.get("description", "Recommendation")
                if "description" not in item:
                    item["description"] = item.get("title", "")
                item.setdefault("priority", "medium")
                item.setdefault("effort", "")
                item.setdefault("evidence", [])
                result.append(item)
            else:
                result.append(item)
        return result

    @field_validator("quick_wins", mode="before")
    @classmethod
    def normalize_quick_wins(cls, v):
        result = []
        for item in v:
            if isinstance(item, str):
                result.append({"title": item, "description": item, "effort": ""})
            elif isinstance(item, dict):
                if "title" not in item:
                    item["title"] = item.get("description", "Quick Win")
                if "description" not in item:
                    item["description"] = item.get("title", "")
                item.setdefault("effort", "")
                result.append(item)
            else:
                result.append(item)
        return result

    @field_validator("architecture_components", mode="before")
    @classmethod
    def normalize_arch_components(cls, v):
        if not isinstance(v, list):
            return []
        result = []
        for item in v:
            if isinstance(item, dict) and "id" in item:
                item.setdefault("label", item["id"])
                item.setdefault("type", "module")
                result.append(item)
        return result

    @field_validator("architecture_connections", mode="before")
    @classmethod
    def normalize_arch_connections(cls, v):
        if not isinstance(v, list):
            return []
        result = []
        for item in v:
            if not isinstance(item, dict):
                continue
            # Accept both "from"/"to" (natural language) and "source"/"target" (schema)
            src = item.get("source") or item.get("from", "")
            tgt = item.get("target") or item.get("to", "")
            if src and tgt:
                result.append({"source": src, "target": tgt, "label": item.get("label", "")})
        return result

    @field_validator("class_diagram", mode="before")
    @classmethod
    def normalize_class_diagram(cls, v):
        if not isinstance(v, list):
            return []
        result = []
        for item in v:
            if isinstance(item, dict) and "name" in item:
                item.setdefault("type", "class")
                item.setdefault("fields", [])
                item.setdefault("methods", [])
                item.setdefault("relationships", [])
                result.append(item)
        return result
