import type { Property } from './properties';

type PropertyTranslation = Pick<Property, 'title' | 'description'> & { features?: string[] };

// Legacy listings created before bilingual fields were added to Firebase.
// Newer records should store titleEn, descriptionEn and featuresEn directly.
const LEGACY_ENGLISH: Record<number, PropertyTranslation> = {
    104750017: { title: '130 m² House — Orzesze, Rybnicka Street', description: 'A detached 130 m² house on an 851 m² plot in Orzesze. With six rooms, two garages and an outbuilding, it is a strong opportunity for a family or investor ready to renovate and create a home to their own plan.' },
    104750018: { title: '153 m² House — Będzin, Grodziec', description: 'A new 153 m² terraced house in the Grodziec district of Będzin, on a 376 m² plot. Four rooms, an integrated garage, triple-glazed windows and city utilities create a practical family home, scheduled for completion in Q4 2026.' },
    104750164: { title: '4-room, 68.3 m² Apartment — Katowice, Nikiszowiec', description: 'A four-room, 68.3 m² apartment in Katowice’s Nikiszowiec district. Built in 2023, it offers a living room with kitchenette, three bedrooms and a secure, gated development with optional parking and storage.' },
    104750200: { title: 'Studio Apartment, 30.3 m² — Katowice, Kostuchna', description: 'A functional 30.3 m² apartment on the seventh floor of a building with a lift in Katowice’s Kostuchna district. City infrastructure and nearby woodland make it a good first home, pied-à-terre or investment.' },
    104750212: { title: 'Studio Apartment, 24.73 m² — Chorzów II', description: 'A compact 24.73 m² apartment on the seventh floor of a ten-storey building with a lift in Chorzów II. The thermally upgraded building and excellent transport links make it a practical city base.' },
    104750216: { title: 'Studio Apartment, 27.04 m² — Świętochłowice Centre', description: 'A renovated 27.04 m² ground-floor apartment in central Świętochłowice. Updated installations, a fitted kitchen and appliances let you move in comfortably without organising basic renovation work.' },
    104750223: { title: '3-room, 50.89 m² Apartment — Czeladź, Waryńskiego Street', description: 'A functional 50.89 m² three-room apartment in Czeladź, with two bedrooms, a utility room and approximately 10 m² of basement storage. A comfortable choice for a family or a well-planned investment.' },
    104750225: { title: '2-room, 61.02 m² Apartment — Chorzów, Batory', description: 'A fully renovated 61.02 m² two-room apartment in Chorzów Batory. It combines a large basement, underfloor heating controlled by app and a fenced property with parking options.' },
    104750226: { title: '2-room, 37.55 m² Apartment — Katowice, Piotrowice', description: 'A practical 37.55 m² two-room apartment in Katowice’s Piotrowice district. The layout includes a living area with kitchenette, bedroom, walk-in wardrobe and basement storage in a quiet, gated development.' },
    104750228: { title: '2-room, 51.06 m² Apartment — Chorzów, Batory', description: 'A spacious 51.06 m² renovated two-room apartment in Chorzów Batory. A wardrobe, 13.6 m² basement and a living room with kitchenette provide valuable everyday space.' },
    104750234: { title: '3-room, 47.12 m² Apartment — Sosnowiec Centre', description: 'A 47.12 m² three-room apartment in central Sosnowiec, with two bedrooms, a balcony, basement storage and a lift in the building. A practical option for a family or rental investment.' },
    104750235: { title: '2-room, 52.63 m² Apartment — Katowice City Centre', description: 'A 52.63 m² two-room apartment in central Katowice with a balcony, basement and gated parking. The railway station, city centre and Kościuszko Park are all within easy walking distance.' },
    104750236: { title: '3-room, 56.5 m² Apartment — Chorzów, Klimzowiec', description: 'A 56.5 m² three-room apartment in Chorzów’s Klimzowiec district, with two bedrooms, a balcony, separate WC and basement. Nearby parks, tram and bus links make it especially convenient for a family.' },
    104750237: { title: '3-room, 55.78 m² Apartment — Katowice, Zadole', description: 'A functional 55.78 m² three-room ground-floor apartment in Katowice’s Zadole estate. It offers a balcony, walk-in wardrobe and basement, with Zadole Park and local services close by.' },
};

const FEATURE_REPLACEMENTS: [RegExp, string][] = [
    [/Powierzchnia działki/g, 'Plot area'], [/Liczba pięter/g, 'Number of floors'], [/Rok budowy/g, 'Year built'],
    [/Stan budynku/g, 'Building condition'], [/Typ domu/g, 'House type'], [/Rynek/g, 'Market'],
    [/Garaż\/Miejsca parkingowe/g, 'Garage/parking spaces'], [/Piętro/g, 'Floor'], [/Parter/g, 'Ground floor'],
    [/Teren ogrodzony/g, 'Gated development'], [/Winda/g, 'Lift'], [/Dostępne w okolicy/g, 'Nearby'],
    [/Komunikacja/g, 'Transport'], [/Tak/g, 'Yes'], [/Wtórny/g, 'Resale'], [/Do remontu/g, 'For renovation'],
    [/Wolnostojący/g, 'Detached'], [/Szeregowy/g, 'Terraced'], [/Autobus/g, 'Bus'], [/Tramwaj/g, 'Tram'],
    [/Sklep/g, 'Shops'], [/Szkoła/g, 'School'], [/Przedszkole/g, 'Kindergarten'], [/Apteka/g, 'Pharmacy'],
    [/Restauracja/g, 'Restaurant'], [/Park/g, 'Park'], [/Plac zabaw/g, 'Playground'], [/Kościół/g, 'Church'],
    [/Bank/g, 'Bank'], [/Basen/g, 'Pool'], [/Las/g, 'Forest'], [/Centrum handlowe/g, 'Shopping centre'],
];

function translateFeatures(features: string[]) {
    return features.map((feature) => FEATURE_REPLACEMENTS.reduce(
        (translated, [pattern, replacement]) => translated.replace(pattern, replacement),
        feature,
    ));
}

export function getLocalizedProperty(property: Property, language: 'pl' | 'en') {
    if (language === 'pl') return { title: property.title, description: property.description, features: property.features };
    const legacy = LEGACY_ENGLISH[property.id];
    return {
        title: property.titleEn || legacy?.title || property.title,
        description: property.descriptionEn || legacy?.description || property.description,
        features: property.featuresEn?.length ? property.featuresEn : legacy?.features || translateFeatures(property.features || []),
    };
}
