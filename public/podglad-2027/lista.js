import { filterOffers } from "./filterOffers.js";

const cards = [...document.querySelectorAll("[data-offer]")].map((element) => ({
    element,
    city: element.dataset.city,
    title: element.dataset.title,
    location: element.dataset.location,
    code: element.dataset.code,
    price: element.dataset.price,
}));
const form = document.querySelector("[data-filter]");
const count = document.querySelector("[data-count]");
const city = document.body.dataset.city || "wszystkie";

function apply(query) {
    const visible = filterOffers(cards, { city, q: query });
    const keep = new Set(visible.map((offer) => offer.element));
    for (const card of cards) card.element.hidden = !keep.has(card.element);
    if (count) count.textContent = String(visible.length);
}

const params = new URLSearchParams(window.location.search);
const initial = params.get("q") || "";
if (form) {
    const input = form.querySelector("[name=q]");
    if (input && initial) input.value = initial;
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const value = new FormData(form).get("q");
        const next = new URLSearchParams(window.location.search);
        if (String(value || "").trim()) next.set("q", String(value).trim());
        else next.delete("q");
        const query = next.toString();
        history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
        apply(String(value || ""));
    });
}
apply(initial);
