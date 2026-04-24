import { useNavigate } from 'react-router-dom';
import { Shield, Bell, FileDown, Smartphone, Wifi, WifiOff, Heart, Activity, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

const features = [
  { icon: Shield, title: 'Vos données, votre contrôle', desc: 'Chiffrement local, anonymat par défaut. Aucun tracking.' },
  { icon: Bell, title: 'Rappels intelligents', desc: 'Notifications push + fallback SMS pour ne jamais oublier une prise.' },
  { icon: FileDown, title: 'Export PDF', desc: 'Générez un carnet médical complet à montrer à tout professionnel.' },
  { icon: WifiOff, title: '100% hors connexion', desc: 'Fonctionne sans internet. Vos données restent sur votre téléphone.' },
];

const stats = [
  { value: '30–50%', label: 'de non-adhésion thérapeutique en Afrique subsaharienne' },
  { value: '100%', label: 'de vos données restent sur votre appareil' },
  { value: '0 F', label: 'gratuit, sans pub, sans tracking' },
];

export default function Landing() {
  const navigate = useNavigate();
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            entry.target.classList.remove('opacity-0');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    sectionsRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setRef = (i: number) => (el: HTMLElement | null) => { sectionsRef.current[i] = el; };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold text-foreground tracking-tight">HealthPocket</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/connexion')}
              className="text-sm font-semibold text-foreground px-4 py-2 rounded-xl transition-colors hover:bg-muted active:scale-[0.97]"
            >
              Connexion
            </button>
            <button
              onClick={() => navigate('/inscription')}
              className="text-sm font-semibold bg-primary text-primary-foreground px-5 py-2.5 rounded-xl transition-transform active:scale-[0.97]"
            >
              Commencer
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 pb-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground mb-6 animate-fade-in">
              <Smartphone className="h-4 w-4" />
              Application installable sur téléphone
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground leading-[1.1] tracking-tight">
              Votre carnet de santé numérique,{' '}
              <span className="text-primary">toujours avec vous</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl leading-relaxed" style={{ textWrap: 'pretty' }}>
              Fini les ordonnances perdues et les oublis de médicaments. HealthPocket BJ garde votre historique médical en sécurité sur votre téléphone, même sans internet.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/inscription')}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-7 py-4 rounded-xl font-bold text-lg transition-transform active:scale-[0.97]"
              >
                Créer mon carnet
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/connexion')}
                className="flex items-center gap-2 border-2 border-border bg-card text-foreground px-7 py-4 rounded-xl font-bold text-lg transition-transform active:scale-[0.97]"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-30">
          <div className="absolute inset-0 bg-gradient-to-bl from-primary/20 via-transparent to-transparent" />
        </div>
      </section>

      {/* Stats */}
      <section ref={setRef(0)} className="opacity-0 py-16 px-5 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center sm:text-left">
              <p className="font-heading text-3xl font-bold text-primary tabular-nums">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section ref={setRef(1)} className="opacity-0 py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={setRef(2)} className="opacity-0 py-20 px-5 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
            Comment ça marche ?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Créez votre compte', desc: 'Inscription rapide avec nom, prénom et email. Votre profil médical est prêt.' },
              { step: '02', title: 'Ajoutez vos traitements', desc: 'Enregistrez médicaments, posologie et horaires. Les rappels se créent automatiquement.' },
              { step: '03', title: 'Suivez votre santé', desc: 'Marquez vos prises, consultez vos statistiques et exportez votre carnet en PDF.' },
            ].map((item, i) => (
              <div key={i} className="relative">
                <span className="font-heading text-5xl font-bold text-primary/15 absolute -top-2 -left-1">{item.step}</span>
                <div className="pt-10">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={setRef(3)} className="opacity-0 py-20 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <Activity className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Prenez le contrôle de votre santé
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Rejoignez les patients qui ne perdent plus jamais leurs informations médicales.
          </p>
          <button
            onClick={() => navigate('/inscription')}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg transition-transform active:scale-[0.97]"
          >
            Créer mon carnet gratuitement
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">HealthPocket BJ</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} HealthPocket BJ — Carnet de santé numérique pour le Bénin
          </p>
        </div>
      </footer>
    </div>
  );
}
