import { EmailAgentApp } from "@/modules/email-agent";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 pb-4 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <span className="p-1.5 bg-blue-600 text-white rounded-lg text-sm">🤖</span>
                Autonomous AI Email Marketing Agent
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Multi-week Sequence Planning, Behavioral Branching & Intelligent Copywriting Engine
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                ● Autonomous System v2.0
              </span>
            </div>
          </div>
        </header>

        <EmailAgentApp />
      </div>
    </main>
  );
}
