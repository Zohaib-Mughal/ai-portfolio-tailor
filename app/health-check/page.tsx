// Mock fetch function to simulate an API call
async function checkSystemHealth() {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return {
    status: "Healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "Connected",
      aiApi: "Ready",
    }
  };
}

export default async function HealthCheck() {
  // Server-side data fetching
  const data = await checkSystemHealth();

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4">System Health</h2>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Overall Status</span>
          <span className="text-emerald-400 font-mono">{data.status}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Database</span>
          <span className="text-emerald-400 font-mono">{data.services.database}</span>
        </div>
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-400">Gemini API</span>
          <span className="text-emerald-400 font-mono">{data.services.aiApi}</span>
        </div>
        <div className="text-xs text-slate-500 pt-2 font-mono text-center">
          Last checked: {data.timestamp}
        </div>
      </div>
    </div>
  );
}