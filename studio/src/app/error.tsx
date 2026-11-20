"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const isDb = ["MongoDB", "ECONNREFUSED", "ServerSelection"].some((s) => error.message.includes(s));
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-semibold text-rose-700">
        {isDb ? "Can't reach the database" : "Something went wrong"}
      </h2>
      <p className="mt-2 break-words text-sm text-muted">{error.message}</p>
      {isDb && (
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm">
          <li>
            In a second terminal, in <code>studio/</code>, run <code>npm run db</code> (local
            MongoDB, no install needed).
          </li>
          <li>
            Or set <code>MONGODB_URI</code> in <code>studio/.env.local</code> to your own MongoDB
            / Atlas connection string and restart <code>npm run dev</code>.
          </li>
        </ol>
      )}
      <button
        onClick={reset}
        className="mt-5 rounded-md border border-line px-3 py-1.5 text-sm hover:bg-panel-2"
      >
        Try again
      </button>
    </div>
  );
}
