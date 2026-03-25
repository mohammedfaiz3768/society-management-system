import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h2 className="text-xl font-semibold">Page not found</h2>
            <Link href="/dashboard" className="text-blue-600 text-sm underline">
                Back to dashboard
            </Link>
        </div>
    );
}