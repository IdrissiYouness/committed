import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

function StatusBadge({ status }) {
    const isConnected = status === "connected";
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                isConnected
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
            }`}
        >
            <span
                className={`h-2 w-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
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
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
            {/* Header */}
            <header className="mb-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 px-6 py-10 text-center text-white shadow-lg">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                    🎓 Committed
                </h1>
                <p className="mt-3 text-lg text-white/90">
                    Code Submission &amp; Analysis Platform
                </p>
            </header>

            {/* Main Content */}
            <main className="flex-1 space-y-10">
                {/* Service Status Section */}
                <section className="rounded-xl bg-white p-6 shadow-md ring-1 ring-gray-200">
                    <h2 className="mb-4 text-2xl font-bold text-gray-800">
                        Service Status
                    </h2>

                    <button
                        onClick={testChain}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-3 text-base font-medium text-white shadow-sm transition hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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
                        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            <strong>Error:</strong> {error}
                        </div>
                    )}

                    {/* Chain Result Card */}
                    {chainStatus && (
                        <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-5 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Chain Test Result
                            </h3>

                            <div className="mt-3 space-y-1 text-sm text-gray-700">
                                <p>
                                    <span className="font-medium">Status:</span>{" "}
                                    <span
                                        className={`font-semibold ${
                                            chainStatus.status === "success"
                                                ? "text-green-600"
                                                : chainStatus.status ===
                                                    "partial"
                                                  ? "text-yellow-600"
                                                  : "text-red-600"
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
                                    <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                                        Service Chain
                                    </h4>
                                    <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                                        {Object.entries(chainStatus.chain).map(
                                            ([service, status]) => (
                                                <li
                                                    key={service}
                                                    className="flex items-center justify-between px-4 py-3"
                                                >
                                                    <span className="font-medium capitalize text-gray-700">
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
                                <p className="mt-4 text-xs text-gray-400">
                                    Timestamp: {chainStatus.timestamp}
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {/* Architecture Section */}
                <section className="rounded-xl bg-white p-6 shadow-md ring-1 ring-gray-200">
                    <h2 className="mb-6 text-2xl font-bold text-gray-800">
                        Architecture
                    </h2>

                    <div className="flex flex-col items-center gap-3">
                        {/* Nginx */}
                        <div className="w-full max-w-md rounded-lg bg-indigo-500 px-6 py-4 text-center font-medium text-white shadow">
                            Nginx (Port 80)
                        </div>

                        <span className="text-2xl text-indigo-400">↓</span>

                        {/* Gateway */}
                        <div className="w-full max-w-md rounded-lg bg-indigo-500 px-6 py-4 text-center font-medium text-white shadow">
                            Gateway — Java Spring Boot (Port 8080)
                        </div>

                        <span className="text-2xl text-indigo-400">↓</span>

                        {/* Backend Services Row */}
                        <div className="flex w-full flex-wrap justify-center gap-3">
                            <div className="rounded-lg bg-purple-600 px-4 py-3 text-center text-sm font-medium text-white shadow">
                                Core — PHP Symfony (8000)
                            </div>
                            <div className="rounded-lg bg-purple-600 px-4 py-3 text-center text-sm font-medium text-white shadow">
                                Analyzer — Python Flask (5000)
                            </div>
                            <div className="rounded-lg bg-purple-600 px-4 py-3 text-center text-sm font-medium text-white shadow">
                                Notifications — .NET Core (5001)
                            </div>
                        </div>

                        <span className="text-2xl text-indigo-400">↓</span>

                        {/* Database */}
                        <div className="w-full max-w-md rounded-lg bg-indigo-500 px-6 py-4 text-center font-medium text-white shadow">
                            Oracle Database (Port 1521)
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
                <p>Committed Platform — Educational Code Analysis System</p>
            </footer>
        </div>
    );
}

export default App;
