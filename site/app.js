const ACCENTS = ["#00a4e3", "#e2037e", "#25c0c2", "#b766c9", "#ec8a4f", "#49cbff"];

const pad = (n) => String(n).padStart(2, "0");
const accentOf = (featureNumber) => ACCENTS[(featureNumber - 1) % ACCENTS.length];

// Comparaison insensible à la casse et aux accents (« Zoe » trouve « Zoé »).
const fold = (text) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "style") node.style.cssText = value;
    else node.setAttribute(key, value);
  }
  node.append(...children.filter((child) => child !== null && child !== undefined));
  return node;
}

function teamCard(team, feature) {
  const members = el("ul", { class: "members", "aria-label": "Members" },
    ...team.members.map((name) => el("li", {}, name)));
  return el("article", {
    class: "card", id: `team-${pad(team.number)}`, style: `--accent: ${accentOf(feature.number)}`,
    "data-feature": feature.number,
  },
    el("div", { class: "card__top" },
      el("span", { class: "card__number", "aria-hidden": "true" }, pad(team.number)),
      el("div", {},
        el("p", { class: "card__label" }, `Team ${pad(team.number)}`),
        el("h3", { class: "card__title" }, team.name))),
    members,
    el("a", { class: "tag", href: `#feature-${pad(feature.number)}` },
      el("span", { class: "tag__dot" }), `#${pad(feature.number)} · ${feature.title}`));
}

function featureCard(feature, teams) {
  const card = el("article", {
    class: teams.length ? "card" : feature.extra ? "card card--extra" : "card card--free",
    id: `feature-${pad(feature.number)}`, style: `--accent: ${accentOf(feature.number)}`,
    "data-feature": feature.number,
  },
    el("div", { class: "card__top" },
      el("span", { class: "card__number", "aria-hidden": "true" }, pad(feature.number)),
      el("h3", { class: "card__title" }, feature.title)),
    el("p", { class: "card__text" }, feature.goal));
  if (teams.length) {
    for (const team of teams) {
      card.append(el("a", { class: "tag", href: `#team-${pad(team.number)}` },
        el("span", { class: "tag__dot" }), `Team ${pad(team.number)} · ${team.name}`));
    }
  } else if (!feature.extra) {
    card.append(el("p", { class: "card__free" }, "Not assigned this week"));
  }
  return card;
}

// Le survol d'une carte éclaire sa jumelle (équipe ↔ feature) dans l'autre section.
function linkHover(root) {
  const toggle = (event, on) => {
    const card = event.target.closest(".card[data-feature]");
    if (!card || card.classList.contains("card--free")) return;
    const number = card.dataset.feature;
    for (const other of root.querySelectorAll(`.card[data-feature="${number}"]`)) {
      if (other !== card) other.classList.toggle("is-linked", on);
    }
  };
  root.addEventListener("mouseover", (event) => toggle(event, true));
  root.addEventListener("mouseout", (event) => toggle(event, false));
}

function setupSearch(cards) {
  const input = document.getElementById("search");
  const status = document.getElementById("search-status");
  input.addEventListener("input", () => {
    const query = fold(input.value.trim());
    let shown = 0;
    for (const { card, haystack, items } of cards) {
      const match = !query || haystack.includes(query);
      card.hidden = !match;
      if (match) shown += 1;
      for (const item of items) {
        const hit = query && fold(item.textContent).includes(query);
        item.replaceChildren(hit ? el("mark", {}, item.textContent) : item.textContent);
      }
    }
    status.textContent = query
      ? (shown ? `${shown} team${shown > 1 ? "s" : ""} found` : "No team matches this search")
      : "";
  });
}

async function main() {
  const [teams, features] = await Promise.all(
    ["teams.json", "features.json"].map((url) => fetch(url).then((response) => {
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      return response.json();
    })));
  const byNumber = new Map(features.map((feature) => [feature.number, feature]));

  const teamGrid = document.getElementById("team-grid");
  const cards = teams.map((team) => {
    const feature = byNumber.get(team.feature);
    const card = teamCard(team, feature);
    teamGrid.append(card);
    const haystack = fold([pad(team.number), String(team.number), team.name,
      feature.title, `#${pad(feature.number)}`, ...team.members].join(" | "));
    return { card, haystack, items: [...card.querySelectorAll(".members li")] };
  });

  const teamsOf = (number) => teams.filter((team) => team.feature === number);
  for (const feature of features) {
    const grid = document.getElementById(feature.extra ? "extra-grid" : "feature-grid");
    grid.append(featureCard(feature, teamsOf(feature.number)));
  }

  linkHover(document.querySelector("main"));
  setupSearch(cards);

  // Les cartes n'existent qu'après le rendu : on rejoue l'ancre de l'URL.
  if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
}

main().catch((error) => {
  document.getElementById("team-grid").textContent = `Could not load the teams (${error.message}).`;
});
