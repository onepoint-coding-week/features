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
    else if (key === "html") node.innerHTML = value;
    else node.setAttribute(key, value);
  }
  node.append(...children.filter((child) => child !== null && child !== undefined));
  return node;
}

const code = (text) => el("code", {}, text);

// Une feature sans équipe cette semaine rejoint les features extra.
const isExtra = (feature, teams) => feature.extra || teams.length === 0;

const teamTag = (team) => el("a", { class: "tag", href: `#team-${pad(team.number)}` },
  el("span", { class: "tag__dot" }), `Team ${pad(team.number)} · ${team.name}`);

function teamCard(team, feature, person) {
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
        el("h3", { class: "card__title" },
          el("a", { class: "person-link", href: `#about-${pad(team.number)}`, title: `Who was ${team.name}?` }, team.name)),
        person ? el("p", { class: "card__person" }, person.known_for) : null)),
    members,
    el("a", { class: "tag", href: `#details-${pad(feature.number)}`, title: "See the feature" },
      el("span", { class: "tag__dot" }), `#${pad(feature.number)} · ${feature.title}`));
}

function featureCard(feature, teams) {
  const card = el("article", {
    class: isExtra(feature, teams) ? "card card--feature card--extra" : "card card--feature",
    id: `feature-${pad(feature.number)}`, style: `--accent: ${accentOf(feature.number)}`,
    "data-feature": feature.number,
  },
    el("div", { class: "card__top" },
      el("span", { class: "card__number", "aria-hidden": "true" }, pad(feature.number)),
      el("h3", { class: "card__title" }, feature.title)),
    el("p", { class: "card__text" }, feature.goal));
  for (const team of teams) card.append(teamTag(team));
  card.append(el("a", { class: "card__more", href: `#details-${pad(feature.number)}` },
    "See the details", el("span", { "aria-hidden": "true" }, " →")));
  return card;
}

// Étapes de la méthode du guide étudiant, appliquées aux chemins de la feature.
function steps(slug) {
  return [
    ["Understand", [
      "Read this card, then the whole test file ", code(`tests/test_${slug}.py`),
      ", slowly: for each test, write in your own words what it checks. Then read ",
      code("app/features/00_example/"),
      ...(slug.startsWith("02_") ? [] : [" and the complete example ", code("app/features/02_participants/")]), ".",
    ]],
    ["Make the tests pass", [
      "Create ", code(`app/features/${slug}/logic.py`), ". Run the tests, pick one failing test, ",
      "write the smallest code that makes it pass, run again, commit. Repeat.",
    ]],
    ["Build the page", [
      "Create ", code("page.py"), " in the same folder and load your code with ",
      code(`import_module("features.${slug}.logic")`), ". Explain the empty cases with ",
      code("st.info"), ": the page must open for the three demo groups.",
    ]],
    ["Polish and deliver", [
      "Edge cases, the ideas of “Going further”, the whole project green, then a pull request and a 5-minute demo.",
    ]],
  ];
}

function doneList(slug) {
  return [
    [code(`uv run pytest tests/test_${slug}.py`), ": all green"],
    [code("uv run pytest"), ": the whole project is still green"],
    ["The page opens in the app for the three groups, with no error and sensible empty states"],
    ["No secret leaked: nobody sees who gives to whom, except their own receiver"],
    ["No change outside your folder and your test file"],
    ["Pull request opened, with a short description"],
    ["Demo prepared"],
  ];
}

function commandLine(command) {
  const button = el("button", { class: "copy", type: "button", "aria-label": `Copy: ${command}` }, "Copy");
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(command);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Select it";
    }
    setTimeout(() => { button.textContent = "Copy"; }, 1500);
  });
  return el("li", {}, el("code", {}, command), button);
}

function detailsContent(feature, teams) {
  const { slug } = feature;
  const head = el("header", { class: "details__head" },
    el("div", { class: "card__top" },
      el("span", { class: "card__number", "aria-hidden": "true" }, pad(feature.number)),
      el("div", {},
        el("p", { class: "card__label" }, isExtra(feature, teams) ? `Extra feature ${pad(feature.number)}` : `Feature ${pad(feature.number)}`),
        el("h2", { class: "details__title", id: "details-title" }, feature.title))),
    el("p", { class: "details__goal" }, feature.goal));
  if (teams.length) head.append(el("div", { class: "details__teams" }, ...teams.map(teamTag)));
  if (feature.needs && feature.needs !== "none") {
    head.append(el("p", { class: "details__needs", html: `<strong>Needs:</strong> ${feature.needs}` }));
  }

  const where = el("section", { class: "details__block" },
    el("h3", {}, "Where you work"),
    el("ul", { class: "files" },
      el("li", {}, el("span", {}, "Your folder"), code(`app/features/${slug}/`)),
      el("li", {}, el("span", {}, "Your tests"), code(`tests/test_${slug}.py`))),
    el("ul", { class: "commands", "aria-label": "Commands" },
      commandLine(`uv run pytest tests/test_${slug}.py -x`),
      commandLine("uv run streamlit run app/app.py")));

  const how = el("section", { class: "details__block" },
    el("h3", {}, "Steps"),
    el("ol", { class: "steps" }, ...steps(slug).map(([title, text]) =>
      el("li", {}, el("strong", {}, title), el("p", {}, ...text)))));

  const spec = feature.sections.map((section) => el("section", { class: "details__block spec" },
    el("h3", {}, section.title), el("div", { class: "spec__body", html: section.html })));

  const done = el("section", { class: "details__block" },
    el("h3", {}, "Definition of done"),
    el("ul", { class: "done" }, ...doneList(slug).map((item) => el("li", {}, ...item))));

  return [head, where, how, ...spec, done];
}

function aboutContent(team, person, feature) {
  return [
    el("header", { class: "details__head" },
      el("div", { class: "card__top" },
        el("span", { class: "card__number", "aria-hidden": "true" }, pad(team.number)),
        el("div", {},
          el("p", { class: "card__label" }, `Team ${pad(team.number)} is named after`),
          el("h2", { class: "details__title", id: "details-title" }, team.name))),
      el("p", { class: "about__meta" },
        el("span", { class: "about__known" }, person.known_for), el("span", {}, person.years))),
    el("section", { class: "details__block" },
      el("p", { class: "about__summary" }, person.summary),
      el("p", { class: "about__links" },
        el("a", { href: person.wikipedia, target: "_blank", rel: "noopener" }, "Read more on Wikipedia ↗"),
        el("a", { class: "tag", href: `#details-${pad(feature.number)}` },
          el("span", { class: "tag__dot" }), `Their feature: #${pad(feature.number)} · ${feature.title}`))),
  ];
}

function setupDetails(features, teams, people) {
  const dialog = document.getElementById("details");
  const body = document.getElementById("details-body");
  const byNumber = new Map(features.map((feature) => [feature.number, feature]));
  const teamsOf = (number) => teams.filter((team) => team.feature === number);

  const show = (accent, content) => {
    body.style.setProperty("--accent", accent);
    body.replaceChildren(...content);
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  };

  const route = () => {
    const match = location.hash.match(/^#(details|about)-(\d+)$/);
    const number = match && Number(match[2]);
    if (match?.[1] === "details" && byNumber.has(number)) {
      show(accentOf(number), detailsContent(byNumber.get(number), teamsOf(number)));
    } else if (match?.[1] === "about" && people[teams.find((team) => team.number === number)?.name]) {
      const team = teams.find((candidate) => candidate.number === number);
      show(accentOf(team.feature), aboutContent(team, people[team.name], byNumber.get(team.feature)));
    } else if (dialog.open) {
      dialog.close();
    }
  };

  dialog.addEventListener("close", () => {
    if (/^#(details|about)-/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
  });
  // Un clic sur le fond (hors du panneau) ferme la fenêtre.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.getElementById("details-close").addEventListener("click", () => dialog.close());
  // Le lien vers une équipe doit fermer la fenêtre avant que le navigateur ne défile.
  body.addEventListener("click", (event) => {
    if (event.target.closest('a[href^="#team-"]')) dialog.close();
  });

  // Toute la carte d'une feature est cliquable, sauf ses propres liens.
  document.querySelector("main").addEventListener("click", (event) => {
    const card = event.target.closest(".card--feature");
    if (!card || event.target.closest("a")) return;
    location.hash = `details-${pad(card.dataset.feature)}`;
  });

  window.addEventListener("hashchange", route);
  route();
}

// Le survol d'une carte éclaire sa jumelle (équipe ↔ feature) dans l'autre section.
function linkHover(root) {
  const toggle = (event, on) => {
    const card = event.target.closest(".card[data-feature]");
    if (!card) return;
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
  const [teams, features, people] = await Promise.all(
    ["teams.json", "features.json", "people.json"].map((url) => fetch(url).then((response) => {
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      return response.json();
    })));
  const byNumber = new Map(features.map((feature) => [feature.number, feature]));
  const teamsOf = (number) => teams.filter((team) => team.feature === number);

  const teamGrid = document.getElementById("team-grid");
  const cards = teams.map((team) => {
    const feature = byNumber.get(team.feature);
    const card = teamCard(team, feature, people[team.name]);
    teamGrid.append(card);
    const haystack = fold([pad(team.number), String(team.number), team.name,
      feature.title, `#${pad(feature.number)}`, ...team.members].join(" | "));
    return { card, haystack, items: [...card.querySelectorAll(".members li")] };
  });

  for (const feature of features) {
    const grid = document.getElementById(isExtra(feature, teamsOf(feature.number)) ? "extra-grid" : "feature-grid");
    grid.append(featureCard(feature, teamsOf(feature.number)));
  }

  linkHover(document.querySelector("main"));
  setupSearch(cards);
  setupDetails(features, teams, people);

  // Les cartes n'existent qu'après le rendu : on rejoue l'ancre de l'URL.
  if (location.hash && !/^#(details|about)-/.test(location.hash)) {
    document.querySelector(location.hash)?.scrollIntoView();
  }
}

main().catch((error) => {
  document.getElementById("team-grid").textContent = `Could not load the teams (${error.message}).`;
});
