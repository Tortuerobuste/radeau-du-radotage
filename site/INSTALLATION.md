# Mettre le site en ligne

Deux services, gratuits tous les deux : **Supabase** (le compte et la base où
atterrissent ses poèmes) et **Vercel** (l'hébergement). Compter une demi-heure.

Lui n'aura jamais à connaître ni l'un ni l'autre : il ira sur le site, il
cliquera, il écrira.

---

## 1. Créer la base (Supabase)

1. Créer un compte sur [supabase.com](https://supabase.com) et un projet neuf.
   Choisir la région **Europe (Francfort ou Paris)** : le site sera plus rapide
   depuis la France.
2. Dans le projet : **SQL Editor** → **New query**. Coller tout le contenu de
   [`supabase/schema.sql`](supabase/schema.sql), puis **Run**.
   Ça crée la table des poèmes et les règles d'accès : lecture pour tout le
   monde, écriture pour lui seul.
3. Dans **Project Settings → API**, relever deux valeurs :
   - **Project URL**
   - la clé **anon public**

   Ces deux-là sont publiques, elles ont le droit de se retrouver dans le
   navigateur. Ne jamais utiliser la clé `service_role`, qui contourne toutes
   les règles.

## 2. Créer son compte à lui

Dans Supabase : **Authentication** → **Users** → **Add user** → *Create new user*.

- son adresse e-mail
- un mot de passe que vous lui donnez
- cocher **Auto Confirm User**, sinon il devra aller chercher un e-mail de
  confirmation pour pouvoir se connecter

### Puis l'autoriser à écrire — à ne pas oublier

Avoir un compte ne donne pas le droit de publier : il faut être inscrit dans
la table `auteurs`. Retournez dans **SQL Editor** et lancez, avec son adresse :

```sql
insert into auteurs (id)
select id from auth.users where email = 'son-adresse@exemple.fr'
on conflict do nothing;
```

Sans ça, il se connectera mais ne pourra rien publier.

### Fermer les inscriptions

Dans **Authentication → Sign In / Providers → Email**, désactiver
**Allow new users to sign up**.

C'est une deuxième serrure, pas la première : même si quelqu'un parvenait à
se créer un compte, il ne serait pas dans `auteurs` et ne pourrait donc rien
écrire. Mais autant ne pas laisser la porte entrouverte.

## 3. Essayer sur votre machine

Dans le dossier `site/`, créer un fichier `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

(Une fois le site en ligne, ajouter aussi `NEXT_PUBLIC_SITE_URL=https://votre-site.fr`
dans les variables de Vercel : c'est l'adresse qu'utilisent le flux RSS et le
plan du site. Sur votre machine, ne pas la mettre.)

Puis :

```bash
npm install
```

```bash
npm run dev
```

Ouvrir `http://localhost:3000/connexion`, entrer son adresse et son mot de
passe, écrire un poème d'essai, vérifier qu'il apparaît sur l'accueil.
Le supprimer ensuite depuis Supabase (**Table Editor → poemes**).

## 4. Mettre en ligne (Vercel)

1. Pousser le dépôt sur GitHub.
2. Sur [vercel.com](https://vercel.com), **Add New → Project**, choisir le dépôt.
3. **Root Directory** : indiquer `site`.
4. Dans **Environment Variables**, remettre les deux mêmes lignes que dans
   `.env.local`.
5. **Deploy**.

Pour une adresse à lui (`leradeaududradotage.fr` par exemple) : acheter le nom
chez n'importe quel registrar, puis **Vercel → Settings → Domains**.

## 5. Ce qu'il faut lui dire, à lui

Une seule page à retenir : **`votre-site.fr/connexion`**.
Son adresse, son mot de passe, et le bouton **Écrire** apparaît en haut.

Dans l'éditeur, il tape comme il veut : les retours à la ligne sont gardés
exactement tels quels, une ligne vide sépare les strophes, il n'y a aucune
syntaxe à apprendre. Son texte est enregistré en permanence dans le
navigateur : même s'il ferme l'onglet par accident, il le retrouve en revenant.

---

## Garder une copie, toujours

Les 6 290 poèmes d'unblog sont dans le dépôt lui-même
(`archive/` et `site/content/poemes.json`) : ils ne dépendent d'aucun service
et personne ne peut les effacer.

Ce qu'il écrit à partir de maintenant vit dans Supabase. Pour le rapatrier
dans le dépôt de temps en temps — deux ou trois fois par an suffisent :

```bash
npm run exporter
```

Les nouveaux poèmes deviennent des fichiers dans `archive/posts/`, comme les
anciens. Il n'y a plus qu'à committer.

C'est la leçon d'unblog : un service ferme, un dépôt reste.
