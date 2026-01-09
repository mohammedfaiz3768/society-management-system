import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-50">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
                <h1 className="text-4xl font-bold text-slate-900 mb-8">Society Admin Portal</h1>
            </div>
            <Link href="/dashboard">
                <Button size="lg">Go to Dashboard</Button>
            </Link>
        </div>
    );
}
