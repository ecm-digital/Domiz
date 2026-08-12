type OfferSeoInput = {
    title: string;
    price?: number;
    status?: 'sprzedaz' | 'wynajem' | string;
    location?: string;
    description?: string;
};

const META_DESCRIPTION_LIMIT = 160;

function formatPrice(price: number, status?: string) {
    const formatted = price.toLocaleString('pl-PL');
    return status === 'wynajem' ? `Cena ${formatted} zł/mies.` : `Cena ${formatted} zł.`;
}

function clampMeta(text: string) {
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= META_DESCRIPTION_LIMIT) return normalized;
    return `${normalized.slice(0, META_DESCRIPTION_LIMIT - 3).trimEnd()}...`;
}

/**
 * Zwięzły meta opis oferty pod SEO / OG — bez ucinania surowego opisu w połowie zdania.
 */
export function buildPropertyMetaDescription(property: OfferSeoInput): string {
    const title = property.title.trim().replace(/[.]+$/, '');
    const parts = [`${title}.`];

    if (typeof property.price === 'number' && Number.isFinite(property.price)) {
        parts.push(formatPrice(property.price, property.status));
    }

    parts.push('Sprawdź opis, galerię i umów prezentację nieruchomości.');

    return clampMeta(parts.join(' '));
}

export function buildPropertySeoKeywords(property: OfferSeoInput): string {
    const chunks = [
        property.title,
        property.location,
        'nieruchomość na sprzedaż',
        'Domiz Homes',
        'Śląsk',
        'Mazowsze',
        'Dubaj',
    ].filter(Boolean);

    return chunks.join(', ');
}
