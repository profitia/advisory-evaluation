export default function EvalSidebar() {
  return (
    <aside className="w-80 shrink-0 h-full overflow-y-auto border-l border-gray-200 bg-white flex flex-col">
      {/* Logo */}
      <div className="px-7 pt-7 pb-5 border-b border-gray-100">
        <img src="/logo/profitia.svg" alt="Profitia" className="h-6 w-auto opacity-90" />
      </div>

      {/* Content */}
      <div className="flex-1 px-7 py-6 space-y-9 text-sm">

        {/* Section 1 */}
        <section>
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-3">
            Ewaluacja jakości Conversational Intelligence Profitii
          </p>
          <h1 className="text-base font-semibold text-gray-800 leading-snug mb-4">
            Procurement Advisory Assistant<br />
            <span className="text-gray-500 font-normal">(Wirtualny Zakupowy Doradca)</span>
          </h1>
          <p className="text-gray-600 leading-relaxed mb-4">
            Ta aplikacja służy do oceny jakości rozmowy z Wirtualnym Asystentem Zakupowym
            rozwijanym dla zastosowań procurementowych i negocjacyjnych — w pierwszym kroku
            na potrzeby AI Asystenta na stronę profitia.pl
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Przejdź proszę przez kilka konwersacji — jako potencjalny klient Profitii — kupiec
            z jakimś problemem (i dlatego jest na naszej stronie i szuka rozwiązania). Celem
            Asystenta jest udzielanie merytorycznych odpowiedzi, ale przede wszystkim
            zmierzających do kontaktu ze strony odwiedzającego (lead generation).
          </p>
          <p className="text-xs font-medium text-gray-500 mb-2">Co testujesz:</p>
          <ul className="space-y-1.5 text-gray-600">
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>naturalność konwersacji,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>realizm zachowań doradczych,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>praktyczność rekomendacji,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>jakość prowadzenia trudnych rozmów biznesowych,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>zachowanie modelu w języku polskim i angielskim.</li>
          </ul>
        </section>

        <div className="border-t border-gray-100" />

        {/* Section 2 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Jak prowadzić test</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Najbardziej wartościowe są realistyczne scenariusze:
          </p>
          <ul className="space-y-1.5 text-gray-600 mb-4">
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>trudne negocjacje,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>presja kosztowa,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>konflikty z dostawcami,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>ograniczone dane,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>sytuacje pod presją czasu,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>problemy między zakupami a biznesem.</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-3">
            Pisz z perspektywy potencjalnego użytkownika lub klienta systemu — nie
            z perspektywy eksperta AI.
          </p>
          <p className="text-gray-600 leading-relaxed mb-3">
            Nie chodzi o „łapanie modelu" na błędach albo testowanie odporności promptowej.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Celem jest ocena jakości realnej rozmowy biznesowej.
          </p>
        </section>

        <div className="border-t border-gray-100" />

        {/* Section 3 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Na co zwracać uwagę</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Szczególnie cenny jest feedback dotyczący:
          </p>
          <ul className="space-y-1.5 text-gray-600 mb-5">
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>naturalności odpowiedzi,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>praktyczności rekomendacji,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>poziomu zaufania do odpowiedzi,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>realizmu negocjacyjnego,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>zbyt „AI" tonu,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>zbyt konsultingowego stylu,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>sztucznej pewności siebie,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>nienaturalnego języka,</li>
            <li className="flex gap-2"><span className="text-gray-300 shrink-0">·</span>odpowiedzi brzmiących zbyt idealnie lub zbyt podręcznikowo.</li>
          </ul>
          <p className="text-gray-500 leading-relaxed mb-2">Nie oceniamy perfekcji.</p>
          <p className="text-gray-600 leading-relaxed">
            Bardziej interesuje nas:<br />
            <span className="text-gray-700 font-medium">
              czy odpowiedź brzmi jak rozmowa z doświadczonym praktykiem.
            </span>
          </p>
        </section>

        <div className="border-t border-gray-100" />

        {/* Section 4 */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Tryby językowe</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-700 mb-0.5">🇵🇱 Polski Advisory</p>
              <p className="text-xs text-gray-500">Oddzielna sesja testowa i osobna analityka.</p>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-700 mb-0.5">🇬🇧 English Advisory</p>
              <p className="text-xs text-gray-500">Niezależny transcript oraz oddzielna ocena conversational quality.</p>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Section 5 — Current Runtime */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Current Runtime</h2>
          <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-2">
            <div>
              <p className="text-[11px] font-mono font-semibold text-gray-800 tracking-wide">ETAP 8.5</p>
              <p className="text-xs text-gray-500">Adaptive Executive Realism</p>
            </div>
            <div className="border-t border-gray-200 pt-2 space-y-1">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Focus</p>
              <p className="text-xs text-gray-600">Conversational realism</p>
              <p className="text-xs text-gray-600">Behavioral intelligence</p>
              <p className="text-xs text-gray-600">Negotiation authenticity</p>
            </div>
          </div>
        </section>

      </div>
    </aside>
  );
}
