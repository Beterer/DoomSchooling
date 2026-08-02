import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import type { BulbBookingEntry, BulbExtra, BurntBulbCount } from '@doomschooling/shared';
import { fetchBulbBookings } from '@/lib/api';

const BURNT_LABELS: Record<BurntBulbCount, string> = {
  '1': 'Unul',
  '2': 'Două',
  '3': 'Trei',
  many: 'Am pierdut șirul',
  all: 'Toate, e beznă',
};

const EXTRA_LABELS: Record<BulbExtra, string> = {
  ladder: 'scara',
  screwdriver: 'șurubelnița',
  snacks: 'gustări',
  'spare-bulbs': 'becuri de rezervă',
  hug: 'o îmbrățișare',
  flashlight: 'lanternă',
};

function formatReceivedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

function formatBookingDate(value: string): string {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}

export default function BecuriAdminPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const query = useQuery<BulbBookingEntry[], Error>({
    queryKey: ['becuri-bookings', token],
    queryFn: () => fetchBulbBookings(token),
    enabled: token.length > 0,
    retry: false,
  });

  return (
    <div className="min-h-dvh bg-feed-bg px-4 py-10 text-feed-text sm:px-8">
      <div className="mx-auto max-w-[760px]">
        <p className="font-utility text-[10px] font-bold uppercase tracking-[0.18em] text-feed-accent">
          Becuri · panou privat
        </p>
        <h1 className="mt-2 font-display text-4xl font-black tracking-[-0.04em]">Programări</h1>

        {token.length === 0 && (
          <p className="mt-6 rounded-2xl border border-feed-border bg-white px-5 py-4 text-sm text-feed-text-secondary shadow-sm">
            Lipsește tokenul. Deschide pagina cu <code>?token=...</code> în adresă.
          </p>
        )}

        {query.isLoading && (
          <p className="mt-6 text-sm text-feed-text-muted">Se încarcă...</p>
        )}

        {query.isError && (
          <p className="mt-6 rounded-2xl border border-feed-signal/40 bg-white px-5 py-4 text-sm font-bold text-feed-signal shadow-sm">
            {query.error.message}
          </p>
        )}

        {query.data && query.data.length === 0 && (
          <p className="mt-6 rounded-2xl border border-feed-border bg-white px-5 py-4 text-sm text-feed-text-secondary shadow-sm">
            Niciun răspuns încă. Becurile sunt tot arse.
          </p>
        )}

        {query.data && query.data.length > 0 && (
          <>
            <p className="mt-2 text-sm text-feed-text-muted">
              {query.data.length}{' '}
              {query.data.length === 1 ? 'răspuns' : 'răspunsuri'}, cel mai nou primul.
            </p>
            <ul className="mt-6 space-y-4">
              {query.data.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-2xl border border-feed-border bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-xl font-black tracking-[-0.03em]">
                      {formatBookingDate(entry.date)}, ora {entry.time}
                    </h2>
                    <span className="font-utility text-[11px] text-feed-text-muted">
                      trimis {formatReceivedAt(entry.receivedAt)}
                    </span>
                  </div>

                  <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                    <Row label="Becuri arse" value={BURNT_LABELS[entry.burntBulbs]} />
                    <Row label="Refuzuri" value={String(entry.refusals)} />
                    <Row
                      label="Vrea să aduc"
                      value={
                        entry.extras.length > 0
                          ? entry.extras.map((extra) => EXTRA_LABELS[extra]).join(', ')
                          : 'nimic'
                      }
                    />
                  </dl>

                  {entry.message && (
                    <p className="mt-4 border-l-2 border-feed-accent bg-feed-card-hover px-4 py-3 text-sm leading-6 text-feed-text-secondary">
                      „{entry.message}"
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-utility text-[11px] uppercase tracking-wide text-feed-text-muted">
        {label}
      </dt>
      <dd className="font-bold text-feed-text">{value}</dd>
    </div>
  );
}
