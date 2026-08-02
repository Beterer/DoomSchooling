import { useCallback, useEffect, useMemo, useState } from 'react';
import { Lightbulb, LightbulbOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import type {
  BulbBooking,
  BulbBookingReceipt,
  BulbExtra,
  BurntBulbCount,
} from '@doomschooling/shared';
import { bookBulbVisit } from '@/lib/api';

// Leave empty to keep the page anonymous.
const HER_NAME = '';

const TOTAL_BULBS = 5;

/** Shown after each refusal, in order. The last one repeats. */
const REFUSAL_LINES = [
  'Sigur? Becul din baie e stins de trei săptămâni.',
  'Tocmai s-a ars un bec. Nu zic că din cauza ta, dar coincidența e suspectă.',
  'Ai încercat pe vârfuri? Nu judec. Doar întreb.',
  'Scaunul de la bucătărie nu e o soluție pe termen lung. E una pe termen scurt și periculoasă.',
  'Gata, s-au stins toate. Sper că îți place ambianța.',
  'Butonul „Nu" a urcat la 2,20 m. Succes.',
  'Lanterna de la telefon nu intră la categoria „iluminat".',
  'Vecinii au început să creadă că nu mai stă nimeni aici.',
  'Îți dau un indiciu: butonul mare. Luminos. Jos. La îndemână.',
  'Butonul „Nu" e oficial în afara razei tale de acțiune. Îmi pare rău. Nu-mi pare rău.',
  'E beznă. Singurul lucru pe care îl mai vezi e butonul „Da". Ăsta e destinul, practic.',
] as const;

const STUBBORN_LINE = 'Bine. „Nu" rămâne pe loc de acum. Tot nu ajungi la el.';

/* Static class strings so Tailwind keeps them in the build. Padding sits on the
   button and the size on its inner span — see .becuri-label in index.css. */
const YES_PADDINGS = [
  'px-9 py-4',
  'px-10 py-5',
  'px-11 py-6',
  'px-12 py-7',
  'px-12 py-8',
  'px-12 py-9',
  'px-12 py-10',
] as const;

const YES_TEXT = [
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'text-5xl',
  'text-6xl',
  'text-7xl',
] as const;

const NO_PADDINGS = [
  'px-6 py-3',
  'px-5 py-2.5',
  'px-4 py-2',
  'px-3 py-1.5',
  'px-2.5 py-1',
  'px-2 py-1',
  'px-2 py-0.5',
] as const;

const NO_TEXT = [
  'text-lg',
  'text-base',
  'text-sm',
  'text-xs',
  'text-[11px]',
  'text-[10px]',
  'text-[9px]',
] as const;

const BURNT_OPTIONS: ReadonlyArray<{ value: BurntBulbCount; label: string }> = [
  { value: '1', label: 'Unul' },
  { value: '2', label: 'Două' },
  { value: '3', label: 'Trei' },
  { value: 'many', label: 'Am pierdut șirul' },
  { value: 'all', label: 'Toate. E beznă.' },
];

const EXTRA_OPTIONS: ReadonlyArray<{ value: BulbExtra; label: string }> = [
  { value: 'ladder', label: '🪜 Scara' },
  { value: 'screwdriver', label: '🪛 Șurubelnița' },
  { value: 'spare-bulbs', label: '💡 Becuri de rezervă' },
  { value: 'snacks', label: '🍫 Gustări' },
  { value: 'flashlight', label: '🔦 Lanternă pentru drum' },
  { value: 'hug', label: '🫂 O îmbrățișare' },
];

type Stage = 'asking' | 'booking' | 'sent';

interface NoPosition {
  top: number;
  left: number;
}

const INITIAL_NO_POSITION: NoPosition = { top: 40, left: 58 };

function pickNoPosition(refusals: number): NoPosition {
  // Each refusal pushes the button closer to the ceiling, where it stays. The
  // band stops at 40% so a fully grown "Da" can never swallow it.
  const top = Math.max(3, 40 - refusals * 4);
  const left = 5 + Math.random() * 70;
  return { top, left };
}

function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function nextSaturday(): string {
  const today = new Date();
  const daysAhead = (6 - today.getDay() + 7) % 7 || 7;
  const target = new Date(today);
  target.setDate(today.getDate() + daysAhead);
  return toDateInputValue(target);
}

function formatBookingDate(value: string): string {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parsed);
}

function refusalNote(refusals: number): string {
  if (refusals === 0) return 'Ai spus da din prima. Respect sincer.';
  if (refusals === 1) return 'Un singur „nu". Practic ai spus da din prima.';
  if (refusals < 6) return `Ai spus „nu" de ${refusals} ori. Se trece la dosar, dar fără consecințe.`;
  return `Ai spus „nu" de ${refusals} ori. Ai rezistat mai mult decât becurile tale.`;
}

export default function BecuriPage() {
  const [stage, setStage] = useState<Stage>('asking');
  const [refusals, setRefusals] = useState(0);
  const [noPosition, setNoPosition] = useState<NoPosition>(INITIAL_NO_POSITION);
  const [poppingBulb, setPoppingBulb] = useState<number | null>(null);

  const [date, setDate] = useState(nextSaturday);
  const [time, setTime] = useState('18:00');
  const [burntBulbs, setBurntBulbs] = useState<BurntBulbCount>('all');
  const [extras, setExtras] = useState<BulbExtra[]>(['ladder', 'spare-bulbs']);
  const [message, setMessage] = useState('');

  const mutation = useMutation<BulbBookingReceipt, Error, BulbBooking>({
    mutationFn: bookBulbVisit,
    onSuccess: () => setStage('sent'),
  });

  // Fleeing on hover would make the button unclickable on a touch screen, where
  // the tap fires the hover first.
  const canHover = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    [],
  );

  useEffect(() => {
    document.body.classList.add('becuri-body');
    return () => document.body.classList.remove('becuri-body');
  }, []);

  // Saying yes turns the lights back on — and keeps the booking form readable.
  const litBulbs = stage === 'asking' ? Math.max(0, TOTAL_BULBS - refusals) : TOTAL_BULBS;
  const roomLight = litBulbs / TOTAL_BULBS;

  const handleRefuse = useCallback(() => {
    const next = refusals + 1;
    setRefusals(next);
    if (next <= TOTAL_BULBS) setPoppingBulb(TOTAL_BULBS - next);
    setNoPosition(pickNoPosition(next));
  }, [refusals]);

  const handleNoHover = useCallback(() => {
    // A dodge she can still win, so the escalating lines stay reachable.
    if (!canHover || refusals < 5 || refusals >= 12) return;
    if (Math.random() > 0.65) return;
    setNoPosition(pickNoPosition(refusals));
  }, [canHover, refusals]);

  function toggleExtra(value: BulbExtra) {
    setExtras((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    mutation.mutate({ refusals, date, time, burntBulbs, extras, message: message.trim() });
  }

  const refusalLine =
    refusals === 0
      ? null
      : refusals >= 12
        ? STUBBORN_LINE
        : REFUSAL_LINES[Math.min(refusals - 1, REFUSAL_LINES.length - 1)];

  const sizeStep = Math.min(refusals, YES_PADDINGS.length - 1);

  const roomStyle: React.CSSProperties & Record<'--room-light', string> = {
    '--room-light': roomLight.toFixed(3),
  };

  return (
    <div className="becuri-room relative min-h-dvh overflow-hidden text-[#f6ead5]" style={roomStyle}>
      <div aria-hidden="true" className="becuri-glow pointer-events-none absolute inset-0" />

      <main className="relative mx-auto flex min-h-dvh max-w-[900px] flex-col px-5 py-6 sm:px-8 sm:py-8">
        <BulbRow litBulbs={litBulbs} poppingBulb={poppingBulb} />

        {stage === 'asking' && (
          <AskingStage
            refusals={refusals}
            refusalLine={refusalLine}
            litBulbs={litBulbs}
            sizeStep={sizeStep}
            noPosition={noPosition}
            onAccept={() => setStage('booking')}
            onRefuse={handleRefuse}
            onNoHover={handleNoHover}
          />
        )}

        {stage === 'booking' && (
          <form onSubmit={handleSubmit} className="becuri-dim flex-1 py-6">
            <p className="font-utility text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffc86a]">
              Programare confirmată de principiu
            </p>
            <h1 className="mt-3 font-display text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-6xl">
              Ai luat cea mai luminoasă decizie a săptămânii.
            </h1>
            <p className="mt-4 max-w-[52ch] text-base leading-7 text-[#d8c8ad] sm:text-lg">
              {refusalNote(refusals)} Acum spune-mi doar când vin, ce găsesc acolo și ce să pun în
              rucsac.
            </p>

            <div className="mt-9 space-y-8">
              <fieldset>
                <legend className="font-display text-xl font-black tracking-[-0.02em]">
                  Când vin?
                </legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="font-utility text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8987e]">
                      Data
                    </span>
                    <input
                      type="date"
                      required
                      value={date}
                      min={toDateInputValue(new Date())}
                      onChange={(event) => setDate(event.target.value)}
                      className="becuri-field rounded-2xl border border-[#3a332b] bg-[#151210] px-4 py-3 text-[#f6ead5] focus:border-[#ffc86a] focus:outline-none focus:ring-2 focus:ring-[#ffc86a]/40"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-utility text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8987e]">
                      Ora
                    </span>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      className="becuri-field rounded-2xl border border-[#3a332b] bg-[#151210] px-4 py-3 text-[#f6ead5] focus:border-[#ffc86a] focus:outline-none focus:ring-2 focus:ring-[#ffc86a]/40"
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-display text-xl font-black tracking-[-0.02em]">
                  Câte becuri sunt arse?
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {BURNT_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                        burntBulbs === option.value
                          ? 'border-[#ffc86a] bg-[#ffc86a] text-[#1a1206]'
                          : 'border-[#3a332b] bg-[#151210] text-[#d8c8ad] hover:border-[#6b5c47]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="burntBulbs"
                        value={option.value}
                        checked={burntBulbs === option.value}
                        onChange={() => setBurntBulbs(option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-display text-xl font-black tracking-[-0.02em]">
                  Ce să aduc?
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {EXTRA_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                        extras.includes(option.value)
                          ? 'border-[#ffc86a] bg-[#ffc86a] text-[#1a1206]'
                          : 'border-[#3a332b] bg-[#151210] text-[#d8c8ad] hover:border-[#6b5c47]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={extras.includes(option.value)}
                        onChange={() => toggleExtra(option.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block">
                <span className="font-display text-xl font-black tracking-[-0.02em]">
                  Mesaj pentru electrician
                </span>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="ex: sună de două ori, soneria s-a ars și ea"
                  className="becuri-textarea mt-3 w-full resize-none rounded-2xl border border-[#3a332b] bg-[#151210] px-4 py-3 text-[#f6ead5] placeholder:text-[#6b5c47] focus:border-[#ffc86a] focus:outline-none focus:ring-2 focus:ring-[#ffc86a]/40"
                />
              </label>
            </div>

            {mutation.isError && (
              <p className="mt-6 rounded-2xl border border-[#7a3b3b] bg-[#241412] px-4 py-3 text-sm font-bold text-[#ffb0a4]">
                Nu a mers trimiterea: {mutation.error.message}. Mai încearcă o dată.
              </p>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="becuri-yes mt-8 w-full rounded-3xl bg-[#ffc86a] px-8 py-5 text-[#1a1206] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
            >
              <span className="becuri-label text-2xl">
                {mutation.isPending ? 'Se trimite...' : 'Trimite programarea'}
              </span>
            </button>
          </form>
        )}

        {stage === 'sent' && (
          <SentStage
            receipt={mutation.data ?? null}
            date={date}
            time={time}
            burntBulbs={burntBulbs}
            extras={extras}
            refusals={refusals}
          />
        )}

        <footer className="mt-auto pt-6">
          <p className="font-utility text-[10px] uppercase tracking-[0.18em] text-[#6b5c47]">
            Un serviciu DoomSchooling · fără garanție, cu scară
          </p>
        </footer>
      </main>
    </div>
  );
}

function BulbRow({ litBulbs, poppingBulb }: { litBulbs: number; poppingBulb: number | null }) {
  return (
    <div className="flex items-start justify-center gap-4 sm:gap-8">
      {Array.from({ length: TOTAL_BULBS }, (_, index) => {
        const isLit = index < litBulbs;
        const Icon = isLit ? Lightbulb : LightbulbOff;
        return (
          <div key={index} className="flex flex-col items-center">
            <span
              aria-hidden="true"
              className="h-8 w-px bg-gradient-to-b from-transparent to-[#3a332b] sm:h-12"
            />
            <Icon
              aria-hidden="true"
              size={30}
              strokeWidth={1.6}
              className={`${isLit ? 'becuri-bulb-on' : 'becuri-bulb-off'} ${
                poppingBulb === index && !isLit ? 'becuri-bulb-popping' : ''
              }`}
            />
          </div>
        );
      })}
      <span className="sr-only">
        {litBulbs} din {TOTAL_BULBS} becuri mai funcționează
      </span>
    </div>
  );
}

interface AskingStageProps {
  refusals: number;
  refusalLine: string | null;
  litBulbs: number;
  sizeStep: number;
  noPosition: NoPosition;
  onAccept: () => void;
  onRefuse: () => void;
  onNoHover: () => void;
}

function AskingStage({
  refusals,
  refusalLine,
  litBulbs,
  sizeStep,
  noPosition,
  onAccept,
  onRefuse,
  onNoHover,
}: AskingStageProps) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="becuri-dim mt-6 text-center sm:mt-8">
        {HER_NAME && (
          <p className="font-utility text-[11px] font-bold uppercase tracking-[0.22em] text-[#ffc86a]">
            Pentru {HER_NAME}
          </p>
        )}
        <h1 className="mx-auto max-w-[16ch] font-display text-[2.3rem] font-black leading-[1] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
          Mă lași să vin să-ți schimb becurile?
        </h1>
        <p className="mx-auto mt-4 max-w-[46ch] text-base leading-7 text-[#d8c8ad] sm:text-lg">
          Tu ai becuri arse și un tavan pe care nu l-ai atins niciodată. Eu am scară, șurubelniță
          și absolut niciun alt plan.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full border border-[#3a332b] bg-[#151210] px-3 py-1.5 font-utility text-[11px] font-bold text-[#d8c8ad]">
            Becuri funcționale: {litBulbs}/{TOTAL_BULBS}
            {litBulbs === 0 && ' · beznă totală'}
          </span>
          {refusals > 0 && (
            <span className="rounded-full border border-[#3a332b] bg-[#151210] px-3 py-1.5 font-utility text-[11px] font-bold text-[#d8c8ad]">
              Refuzuri: {refusals}
            </span>
          )}
        </div>

        <p
          aria-live="polite"
          className="mx-auto mt-4 min-h-[3.25rem] max-w-[44ch] text-base font-bold leading-7 text-[#ffc86a]"
        >
          {refusalLine}
        </p>
      </div>

      {/* Flexes to whatever height is left so the buttons never fall below the
          fold — the runway the "Nu" button climbs is simply shorter on a laptop. */}
      <div className="relative mx-auto min-h-[220px] w-full max-w-[720px] flex-1">
        <button
          type="button"
          onClick={onRefuse}
          onMouseEnter={onNoHover}
          style={{ top: `${noPosition.top}%`, left: `${noPosition.left}%` }}
          className={`becuri-no absolute z-10 rounded-full border border-[#3a332b] bg-[#151210] text-[#8d8069] hover:border-[#6b5c47] hover:text-[#d8c8ad] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b5c47] ${NO_PADDINGS[sizeStep]}`}
        >
          <span className={`becuri-label ${NO_TEXT[sizeStep]}`}>Nu</span>
        </button>

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={onAccept}
            className={`becuri-yes max-w-full rounded-[2rem] bg-[#ffc86a] text-[#1a1206] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#ffc86a]/50 ${YES_PADDINGS[sizeStep]}`}
          >
            <span className={`becuri-label ${YES_TEXT[sizeStep]}`}>Da</span>
          </button>
          {refusals >= 3 && (
            <p className="font-utility text-[11px] text-[#6b5c47]">
              (butonul ăsta e la înălțimea ta)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SentStageProps {
  receipt: BulbBookingReceipt | null;
  date: string;
  time: string;
  burntBulbs: BurntBulbCount;
  extras: BulbExtra[];
  refusals: number;
}

function SentStage({ receipt, date, time, burntBulbs, extras, refusals }: SentStageProps) {
  const orderNumber = (receipt?.id ?? '').replaceAll('-', '').slice(0, 5).toUpperCase() || 'XXXXX';
  const burntLabel = BURNT_OPTIONS.find((option) => option.value === burntBulbs)?.label ?? '—';
  const extraLabels = EXTRA_OPTIONS.filter((option) => extras.includes(option.value)).map(
    (option) => option.label,
  );

  return (
    <div className="flex-1 py-10 text-center">
      <p className="font-utility text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffc86a]">
        Comandă #BEC-{orderNumber}
      </p>
      <h1 className="mx-auto mt-4 max-w-[15ch] font-display text-[2.7rem] font-black leading-[0.98] tracking-[-0.05em] sm:text-7xl">
        S-a făcut lumină.
      </h1>
      <p className="mx-auto mt-5 max-w-[44ch] text-base leading-7 text-[#d8c8ad] sm:text-lg">
        Electricianul a fost anunțat. A zâmbit. Își pregătește scara.
      </p>

      <dl className="mx-auto mt-9 max-w-[440px] divide-y divide-[#2a251f] rounded-3xl border border-[#3a332b] bg-[#151210] px-5 text-left">
        <SummaryRow label="Când" value={`${formatBookingDate(date)}, ora ${time}`} />
        <SummaryRow label="Becuri arse" value={burntLabel} />
        <SummaryRow
          label="Vin cu"
          value={extraLabels.length > 0 ? extraLabels.join(', ') : 'Doar cu mine'}
        />
        <SummaryRow label="Refuzuri" value={String(refusals)} />
      </dl>

      <p className="mx-auto mt-8 max-w-[42ch] text-sm leading-6 text-[#8d8069]">
        Poți închide pagina. Becurile rămân aprinse.
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3.5">
      <dt className="font-utility text-[10px] font-bold uppercase tracking-[0.16em] text-[#a8987e]">
        {label}
      </dt>
      <dd className="text-right text-sm font-bold text-[#f6ead5]">{value}</dd>
    </div>
  );
}
