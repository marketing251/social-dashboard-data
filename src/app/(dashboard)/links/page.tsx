export const dynamic = "force-dynamic";
import { loadPlatformAccounts } from '@/lib/kpi/load';
import { PLATFORM_META } from '@/lib/kpi/types';

export default async function LinksPage() {
  const accounts = await loadPlatformAccounts();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-3xl font-bold text-center mb-1">Follow @PropAccount</h2>
      <p className="text-center text-text-muted mb-10">
        Connect with us on all platforms
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {accounts.map((acc) => {
          const meta = PLATFORM_META[acc.platform];
          return (
            <a
              key={acc.id}
              href={acc.profile_url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-8 flex flex-col items-center gap-3 hover:border-accent hover:-translate-y-1 transition-all"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: meta.color }}
              >
                <span className="text-white font-bold text-sm">
                  {meta.label[0]}
                </span>
              </div>
              <span className="font-semibold text-sm">{meta.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
