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

function HealthBadge({ ok }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
                ok
                    ? "bg-secondary-100 text-secondary-700"
                    : "bg-red-100 text-error"
            }`}
        >
            <span
                className={`h-2 w-2 rounded-full ${
                    ok ? "bg-success" : "bg-error"
                }`}
            />
            {ok ? "Healthy" : "Unhealthy"}
        </span>
    );
}

function App() {
    const [chainStatus, setChainStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [healthData, setHealthData] = useState(null);
    const [healthLoading, setHealthLoading] = useState(false);
    const [healthError, setHealthError] = useState(null);

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

    const testCoreHealth = async () => {
        setHealthLoading(true);
        setHealthError(null);
        try {
            const response = await fetch(`${API_URL}/core/health`);

            const contentType = response.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                throw new Error(
                    `Core service is not reachable — received ${contentType || "non-JSON"} response (HTTP ${response.status}). ` +
                        "Make sure the core service is running.",
                );
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data?.database?.error ||
                        `Core returned HTTP ${response.status}`,
                );
            }

            setHealthData(data);
        } catch (err) {
            if (err.name === "TypeError" && err.message === "Failed to fetch") {
                setHealthError(
                    "Could not connect to the Core service. Make sure it is running " +
                        "(Docker: docker compose up core).",
                );
            } else {
                setHealthError(err.message);
            }
            setHealthData(null);
        } finally {
            setHealthLoading(false);
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
                {/* Core Healthcheck Section */}
                <section className="animate-slide-up rounded-xl bg-white p-6 shadow-elevated ring-1 ring-neutral-200">
                    <h2 className="mb-4 font-display text-2xl font-bold text-neutral-800">
                        Core Service Healthcheck
                    </h2>
                    <p className="mb-5 text-sm text-neutral-500">
                        Tests the Symfony Core service and its Doctrine
                        connection to PostgreSQL.
                    </p>

                    <button
                        onClick={testCoreHealth}
                        disabled={healthLoading}
                        className="inline-flex items-center gap-2 rounded-lg bg-secondary-500 px-6 py-3 text-base font-medium text-white shadow-elegant transition ease-smooth hover:bg-secondary-600 focus:outline-none focus:ring-2 focus:ring-secondary-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {healthLoading && (
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
                        {healthLoading ? "Checking…" : "Test Core + Database"}
                    </button>

                    {/* Health Error */}
                    {healthError && (
                        <div className="animate-scale-in mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-error">
                            <strong>Error:</strong> {healthError}
                        </div>
                    )}

                    {/* Health Result */}
                    {healthData && (
                        <div className="animate-scale-in mt-6 space-y-6">
                            {/* Status Overview */}
                            <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-5 shadow-elegant">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-display text-lg font-semibold text-neutral-800">
                                        Status Overview
                                    </h3>
                                    <HealthBadge
                                        ok={healthData.status === "ok"}
                                    />
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                                            Database
                                        </p>
                                        <p
                                            className={`mt-1 text-lg font-bold ${healthData.database?.connected ? "text-success" : "text-error"}`}
                                        >
                                            {healthData.database?.connected
                                                ? "Connected"
                                                : "Disconnected"}
                                        </p>
                                        <p className="mt-0.5 text-xs text-neutral-400">
                                            {healthData.database?.driver}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                                            Tables
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-primary-600">
                                            {healthData.database
                                                ?.tables_count ?? "—"}
                                        </p>
                                        <p className="mt-0.5 text-xs text-neutral-400">
                                            in public schema
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-neutral-200 bg-white p-4 text-center">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                                            Users
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-primary-600">
                                            {healthData.users?.total_count ??
                                                "—"}
                                        </p>
                                        <p className="mt-0.5 text-xs text-neutral-400">
                                            total records
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Users Table */}
                            {healthData.users?.sample?.length > 0 && (
                                <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-5 shadow-elegant">
                                    <h3 className="mb-3 font-display text-lg font-semibold text-neutral-800">
                                        Users Sample
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-neutral-200 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                                    <th className="px-3 py-2">
                                                        ID
                                                    </th>
                                                    <th className="px-3 py-2">
                                                        Full Name
                                                    </th>
                                                    <th className="px-3 py-2">
                                                        Email
                                                    </th>
                                                    <th className="px-3 py-2">
                                                        Role
                                                    </th>
                                                    <th className="px-3 py-2">
                                                        Active
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-neutral-100">
                                                {healthData.users.sample.map(
                                                    (user) => (
                                                        <tr
                                                            key={user.user_id}
                                                            className="transition ease-smooth hover:bg-white"
                                                        >
                                                            <td className="px-3 py-2.5 font-mono text-xs text-neutral-500">
                                                                {user.user_id}
                                                            </td>
                                                            <td className="px-3 py-2.5 font-medium text-neutral-800">
                                                                {user.full_name}
                                                            </td>
                                                            <td className="px-3 py-2.5 text-neutral-600">
                                                                {user.email}
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                <span
                                                                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                                        user.system_role ===
                                                                        "admin"
                                                                            ? "bg-primary-100 text-primary-700"
                                                                            : "bg-neutral-100 text-neutral-600"
                                                                    }`}
                                                                >
                                                                    {
                                                                        user.system_role
                                                                    }
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2.5">
                                                                {user.is_active ? (
                                                                    <span className="text-success">
                                                                        ✓
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-error">
                                                                        ✗
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Timestamp */}
                            {healthData.timestamp && (
                                <p className="text-right text-xs text-neutral-400">
                                    Checked at:{" "}
                                    {new Date(
                                        healthData.timestamp,
                                    ).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </section>

                {/* Service Status Section */}
                <section className="animate-slide-up rounded-xl bg-white p-6 shadow-elevated ring-1 ring-neutral-200">
                    <h2 className="mb-4 font-display text-2xl font-bold text-neutral-800">
                        Service Chain Test
                    </h2>
                    <p className="mb-5 text-sm text-neutral-500">
                        Tests the full chain: Web → Gateway → all backend
                        services.
                    </p>

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
                            🐘 PostgreSQL Database (Port 5432)
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
