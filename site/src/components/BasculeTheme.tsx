"use client";

/**
 * Bascule clair / sombre.
 *
 * Aucun état React : le thème vit sur <html data-theme>, et les deux icônes
 * sont dans le DOM, celle qui ne sert pas étant masquée en CSS. Donc pas
 * d'effet, pas de décalage à l'hydratation, et le bouton est juste dès le
 * premier rendu.
 */
export function BasculeTheme() {
  function basculer() {
    const html = document.documentElement;
    const actuel =
      html.dataset.theme ??
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const suivant = actuel === "dark" ? "light" : "dark";
    html.dataset.theme = suivant;
    try {
      localStorage.setItem("theme", suivant);
    } catch {
      // Navigation privée : le choix ne survivra pas à l'onglet, tant pis.
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label="Changer entre le thème clair et le thème sombre"
      title="Changer de thème"
      className="ml-1 grid h-9 w-9 place-items-center rounded-full text-encre-douce transition-colors hover:bg-accent-doux hover:text-accent"
    >
      {/* Les deux icônes sont là ; globals.css montre celle qui convient,
          en suivant exactement les mêmes règles que les couleurs. */}
      <Lune className="icone-theme-clair" />
      <Soleil className="icone-theme-sombre" />
    </button>
  );
}

function Lune({ className }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Soleil({ className }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
