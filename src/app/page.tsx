"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const services = [
  ["01", "Biens", "Vos appartements, villas et locaux, enfin réunis."],
  ["02", "Loyers", "Des encaissements suivis avec précision, mois après mois."],
  ["03", "Documents", "Contrats, quittances et états des lieux prêts en quelques secondes."],
  ["04", "Fiscalité", "Une vision claire de vos obligations par bien et par exercice."],
];

export default function HomePage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="immo-cinema" style={{ "--scroll": progress } as React.CSSProperties}>
      <div className="cinema-glow" />
      <div className="cinema-grid" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      <div className="cinema-progress" aria-hidden="true"><span style={{ height: `${progress * 100}%` }} /></div>

      <header className="cinema-header">
        <Link href="/" className="cinema-brand">Easy Location <em>IMMO</em></Link>
        <nav>
          <a href="#vision">Vision</a><b />
          <a href="#services">Services</a><b />
          <a href="#network">Réseau</a>
        </nav>
        <div className="cinema-actions"><Link href="/login">Connexion</Link><Link href="/devenir-partenaire" className="contact-pill">Commencer <span>↗</span></Link></div>
      </header>

      <section id="vision" className="cinema-hero">
        <div className="hero-kicker">La gestion immobilière, autrement <span>—</span> Maroc</div>
        <h1>Patrimoine<br /><i>en mouvement.</i></h1>
        <p className="hero-copy">Une matière vivante, comme vos locations. Easy Location IMMO donne une forme claire à chaque bien, chaque loyer et chaque décision.</p>
        <div className="hero-meta"><span>01 — 04</span><span>Défiler pour explorer</span></div>
        <div className="orbit-object" aria-hidden="true"><div className="object-ring ring-one" /><div className="object-ring ring-two" /><div className="object-core" /></div>
      </section>

      <section className="cinema-chapter chapter-two"><div className="chapter-image"><img src="/properties/villa-targa.jpg" alt="Villa gérée par Easy Location IMMO" /></div><div><span className="chapter-number">02 / Matière</span><h2>Chaque détail<br /><i>compte.</i></h2><p>Centralisez votre portefeuille et retrouvez instantanément ce qui fait la valeur de votre activité.</p><Link href="/devenir-partenaire" className="text-link">Découvrir l’espace <span>↗</span></Link></div></section>
      <section id="services" className="cinema-services"><div className="section-label">03 / Instruments de gestion</div><h2>La maîtrise<br /><i>du quotidien.</i></h2><div className="service-list">{services.map(([num, title, text]) => <article key={num}><span>{num}</span><div><h3>{title}</h3><p>{text}</p></div><b>↗</b></article>)}</div></section>
      <section id="network" className="cinema-end"><span className="chapter-number">04 / Continuum</span><h2>Construisons<br /><i>la suite.</i></h2><p>Propriétaire, agence ou conciergerie : votre réseau immobilier mérite un espace à sa mesure.</p><Link href="/devenir-partenaire" className="contact-pill large">Devenir partenaire <span>↗</span></Link></section>
      <footer className="cinema-footer"><span>© 2026 Easy Location IMMO</span><span>Une plateforme pensée au Maroc</span><Link href="/pricing">Tarifs</Link></footer>
    </main>
  );
}
