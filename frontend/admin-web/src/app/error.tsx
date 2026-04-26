"use client";

export default function Error({
    error,
    reset,
}: {
    error: Error;
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h2 className="text-xl font-semibold text-red-600">Something went wrong</h2>
            <p className="text-gray-500 text-sm">{error.message}</p>
            <button
                onClick={reset}
                className="px-4 py-2 bg-blue-600 text-slate-900 rounded text-sm"
            >
                Try again
            </button>
        </div>
    );
}