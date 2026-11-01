const MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

/** « 2016-02-22 » → « 22 février 2016 » */
export function enFrancais(iso: string): string {
  const [a, m, j] = iso.split("-").map(Number);
  if (!a || !m || !j) return iso;
  return `${j === 1 ? "1er" : j} ${MOIS[m - 1]} ${a}`;
}
