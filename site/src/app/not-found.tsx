import Link from "next/link";

export default function Introuvable() {
  return (
    <div className="mx-auto max-w-xl px-5 py-20 text-center sm:py-28">
      <h1 className="m-0 text-3xl font-normal">Rien à cette adresse</h1>
      <p className="mx-auto mt-4 max-w-sm text-encre-douce">
        Le poème que vous cherchez a peut-être une autre adresse depuis que le
        blog a déménagé d’unblog.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3 font-sans text-sm">
        <Link
          href="/recherche"
          className="rounded-full bg-accent px-5 py-2.5 text-paper no-underline transition-opacity hover:opacity-90"
        >
          Le chercher par un mot
        </Link>
        <Link
          href="/"
          className="rounded-full border border-trait px-5 py-2.5 text-encre no-underline transition-colors hover:border-accent hover:text-accent"
        >
          Revenir à l’accueil
        </Link>
      </div>
    </div>
  );
}
