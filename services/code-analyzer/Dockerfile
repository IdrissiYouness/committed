FROM python:3.11-slim

ARG TYPST_VERSION=0.11.0
ARG NODE_VERSION=20
ARG KILO_VERSION=7.1.20

# ── System dependencies: git + Node.js + Typst ────────────────────────────────
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git wget xz-utils curl gnupg ca-certificates && \
    # Node.js (required by the Kilo Code CLI)
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    # Typst — PDF compiler for report generation
    wget -qO /tmp/typst.tar.xz \
        "https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-x86_64-unknown-linux-musl.tar.xz" && \
    tar -xJf /tmp/typst.tar.xz -C /tmp && \
    mv /tmp/typst-x86_64-unknown-linux-musl/typst /usr/local/bin/typst && \
    chmod +x /usr/local/bin/typst && \
    rm -rf /tmp/typst* /var/lib/apt/lists/*

# ── Kilo Code CLI ─────────────────────────────────────────────────────────────
RUN npm install -g @kilocode/cli@${KILO_VERSION} --omit=dev

WORKDIR /app

# ── Python dependencies ────────────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Kilo project-level plugin ─────────────────────────────────────────────────
# Install @kilocode/plugin before copying full source so this layer is cached
# independently of application code changes.
COPY .kilo/package.json .kilo/package.json
RUN cd .kilo && npm install --omit=dev && npm cache clean --force

# ── Application code ───────────────────────────────────────────────────────────
COPY . .

# ── Kilo global configuration (model + permissions — no auth secrets) ──────────
# auth.json (OAuth tokens) is NEVER baked in; it must be mounted at runtime.
RUN mkdir -p /root/.config/kilo /root/.local/share/kilo /tmp/code-analysis /tmp/reports
COPY kilo.jsonc /root/.config/kilo/kilo.jsonc

# ── Entrypoint: writes auth.json from KILO_AUTH_JSON_B64 env var ──────────────
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# ── Runtime defaults ──────────────────────────────────────────────────────────
ENV TYPST_BIN=/usr/local/bin/typst \
    AGENT_CLI=kilo \
    AGENT_RUNNER=kilo \
    TEMP_DIR=/tmp/code-analysis \
    REPORTS_DIR=/tmp/reports \
    PORT=5000 \
    FLASK_DEBUG=false

EXPOSE 5000

ENTRYPOINT ["/entrypoint.sh"]
# Gunicorn: 2 workers, timeout > AGENT_TIMEOUT (300 s) to avoid premature kills.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "360", "app:app"]
