export function filterOffers(offers, { city = "wszystkie", q = "" } = {}) {
    const query = String(q || "").trim().toLowerCase();
    return offers.filter((offer) => {
        const offerCity = offer.city || offer.datasetCity;
        const cityOk = !city || city === "wszystkie" || offerCity === city;
        if (!cityOk) return false;
        if (!query) return true;
        const haystack = `${offer.title || ""} ${offer.location || ""} ${offer.code || ""} ${offer.price || ""}`.toLowerCase();
        return haystack.includes(query);
    });
}
