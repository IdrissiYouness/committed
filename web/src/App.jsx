import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

function StatusBadge({ status }) {
    const isConnected = status === "connected";
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                isConnected
                    ? "bg-secondary-100 text-secondary-700"
                    : "bg-red-100 text-error"
            }`}
        >
            <span
                className={`h-2 w-2 rounded-full ${
                    isConnected ? "bg-success" : "bg-error"
                }`}
            />
            {status}
        </span>
    );
}

function App() {
    const [chainStatus, setChainStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const testChain = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/test-chain`);

            const contentType = response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                throw new Error(
                    `Gateway is not reachable — received ${contentType || "non-JSON"} response (HTTP ${response.status}). ` +
                        "Make sure the gateway service is running and the API proxy is configured correctly.",
                );
            }

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                throw new Error(
                    body.message || `Gateway returned HTTP ${response.status}`,
                );
            }

            const data = await response.json();
            setChainStatus(data);
        } catch (err) {
            if (err.name === "TypeError" && err.message === "Failed to fetch") {
                setError(
                    "Could not connect to the API. Make sure the gateway service is running " +
                        "(Docker: docker compose up gateway, Local dev: the Vite proxy expects it on localhost:8080).",
                );
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 font-body sm:px-6 lg:px-8">
            {/* Header */}
            <header className="animate-fade-in mb-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-800 px-6 py-10 text-center text-white shadow-floating">
                <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                    🎓 Committed
                </h1>
                <p className="mt-3 text-lg text-white/90">
                    Code Submission &amp; Analysis Platform
                </p>
            </header>

            {/* Main Content */}
            <main className="flex-1 space-y-10">
                {/* Service Status Section */}
                <section className="animate-slide-up rounded-xl bg-white p-6 shadow-elevated ring-1 ring-neutral-200">
                    <h2 className="mb-4 font-display text-2xl font-bold text-neutral-800">
                        Service Status
                    </h2>

                    <button
                        onClick={testChain}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-base font-medium text-white shadow-elegant transition ease-smooth hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading && (
                            <svg
                                className="h-5 w-5 animate-spin"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                />
                            </svg>
                        )}
                        {loading ? "Testing…" : "Test Service Chain"}
                    </button>

                    {/* Error Alert */}
                    {error && (
                        <div className="animate-scale-in mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-error">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Chain Result Card */}
                    {chainStatus && (
                        <div className="animate-scale-in mt-6 rounded-lg border border-neutral-100 bg-neutral-50 p-5 shadow-elegant">
                            <h3 className="font-display text-lg font-semibold text-neutral-800">
                                Chain Test Result
                            </h3>

                            <div className="mt-3 space-y-1 text-sm text-neutral-700">
                                <p>
                                    <span className="font-medium">Status:</span>{" "}
                                    <span
                                        className={`font-semibold ${
                                            chainStatus.status === "success"
                                                ? "text-success"
                                                : chainStatus.status ===
                                                    "partial"
                                                  ? "text-warning"
                                                  : "text-error"
                                        }`}
                                    >
                                        {chainStatus.status}
                                    </span>
                                </p>
                                <p>
                                    <span className="font-medium">
                                        Message:
                                    </span>{" "}
                                    {chainStatus.message}
                                </p>
                            </div>

                            {chainStatus.chain && (
                                <div className="mt-5">
                                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                                        Service Chain
                                    </h4>
                                    <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
                                        {Object.entries(chainStatus.chain).map(
                                            ([service, status]) => (
                                                <li
                                                    key={service}
                                                    className="flex items-center justify-between px-4 py-3"
                                                >
                                                    <span className="font-medium capitalize text-neutral-700">
                                                        {service}
                                                    </span>
                                                    <StatusBadge
                                                        status={status}
                                                    />
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            )}

                            {chainStatus.timestamp && (
                                <p className="mt-4 text-xs text-neutral-400">
                                    Timestamp: {chainStatus.timestamp}
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {/* Architecture Section */}
                <section className="animate-slide-up rounded-xl bg-white p-6 shadow-elevated ring-1 ring-neutral-200">
                    <h2 className="mb-6 font-display text-2xl font-bold text-neutral-800">
                        Architecture
                    </h2>

                    <div className="flex flex-col items-center gap-3">
                        {/* Nginx */}
                        <div className="w-full max-w-md rounded-lg bg-primary-500 px-6 py-4 text-center font-medium text-white shadow-elegant transition ease-smooth hover:bg-primary-600">
                            Nginx (Port 80)
                        </div>

                        <span className="text-2xl text-primary-400">↓</span>

                        {/* Gateway */}
                        <div className="w-full max-w-md rounded-lg bg-primary-500 px-6 py-4 text-center font-medium text-white shadow-elegant transition ease-smooth hover:bg-primary-600">
                            Gateway — Java Spring Boot (Port 8080)
                        </div>

                        <span className="text-2xl text-primary-400">↓</span>

                        {/* Backend Services Row */}
                        <div className="flex w-full flex-wrap justify-center gap-3">
                            <div className="rounded-lg bg-secondary-600 px-4 py-3 text-center text-sm font-medium text-white shadow-elegant transition ease-smooth hover:bg-secondary-700">
                                Core — PHP Symfony (8000)
                            </div>
                            <div className="rounded-lg bg-secondary-600 px-4 py-3 text-center text-sm font-medium text-white shadow-elegant transition ease-smooth hover:bg-secondary-700">
                                Analyzer — Python Flask (5000)
                            </div>
                            <div className="rounded-lg bg-secondary-600 px-4 py-3 text-center text-sm font-medium text-white shadow-elegant transition ease-smooth hover:bg-secondary-700">
                                Notifications — .NET Core (5001)
                            </div>
                        </div>

                        <span className="text-2xl text-primary-400">↓</span>

                        {/* Database */}
                        <div className="w-full max-w-md rounded-lg bg-primary-500 px-6 py-4 text-center font-medium text-white shadow-elegant transition ease-smooth hover:bg-primary-600">
                            Oracle Database (Port 1521)
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="mt-10 border-t border-neutral-200 pt-6 text-center text-sm text-neutral-500">
                <p>Committed Platform — Educational Code Analysis System</p>
            </footer>
        </div>
    );
}

export default App;
