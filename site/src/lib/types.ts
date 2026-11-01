export type Commentaire = {
  auteur: string;
  date: string;
  texte: string;
};

export type Poeme = {
  slug: string;
  titre: string;
  /** ISO, AAAA-MM-JJ */
  date: string;
  /** Les retours à la ligne sont significatifs : ce sont des vers. */
  texte: string;
  mots: number;
  /** Présent seulement pour les poèmes repris de l'ancien blog. */
  sourceUnblog?: string;
  commentaires: Commentaire[];
};

export type Annee = {
  annee: string;
  nombre: number;
};
