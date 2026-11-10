export interface Property {
    id: number;
    title: string;
    titleEn?: string;
    price: number;
    location: string;
    beds: number;
    baths: number;
    sqft: number;
    type: 'dom' | 'mieszkanie' | 'dzialka';
    status: 'sprzedaz' | 'wynajem';
    image: string;
    featured: boolean;
    published?: boolean;
    promotionalVideoUrl?: string;
    promotionalVideoPageUrl?: string;
    promotionalVideoThumbnailUrl?: string;
    promotionalVideoUpdatedAt?: string;
    description: string;
    descriptionEn?: string;
    images: string[];
    features: string[];
    featuresEn?: string[];
    agent: {
        name: string;
        phone: string;
        email: string;
        image: string;
    };
}

export const PROPERTIES: Property[] = [
    {
        id: 1,
        title: "Nowoczesny Bliźniak w Tłuszczu",
        titleEn: "Modern Semi-detached Home in Tłuszcz",
        price: 850000,
        location: "Tłuszcz, ul. Spokojna",
        beds: 4,
        baths: 2,
        sqft: 145,
        type: "dom",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1600596542815-2250657d2f96?q=80&w=2675&auto=format&fit=crop",
        featured: true,
        description: "Nowoczesny dom w zabudowie bliźniaczej w cichej i spokojnej okolicy Tłuszcza. Idealny dla rodziny. Wysoki standard, ogród, garaż.",
        descriptionEn: "A modern semi-detached home in a quiet part of Tłuszcz. Ideal for a family, with a high standard of finish, garden and garage.",
        images: [
            "https://images.unsplash.com/photo-1600596542815-2250657d2f96?q=80&w=2675&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=2670&auto=format&fit=crop"
        ],
        features: ["Garaż", "Ogród", "Stan deweloperski", "Pompa ciepła", "Ogrzewanie podłogowe"],
        featuresEn: ["Garage", "Garden", "Developer finish", "Heat pump", "Underfloor heating"],
        agent: {
            name: "Anna Nowak",
            phone: "+48 517 303 400",
            email: "anna.nowak@domiz.pl",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop"
        }
    },
    {
        id: 9,
        title: "Nowoczesne 3-pokojowe mieszkanie z panoramicznym widokiem - Gwiazdy",
        titleEn: "Modern 3-bedroom Apartment with Panoramic Views — Gwiazdy",
        price: 495000,
        location: "Katowice, Al. Roździeńskiego (Os. Gwiazdy)",
        beds: 3,
        baths: 1,
        sqft: 61,
        type: "mieszkanie",
        status: "sprzedaz",
        image: "/properties/gwiazdy/salon.jpg",
        featured: true,
        description: "Zapraszam do wyjątkowego mieszkania w sercu osiedla Gwiazdy – przestronnej nieruchomości, która połączy Twoje marzenia o nowoczesnym stylu życia z bliskim dostępem do wszystkiego.\n\n61 m² przestrzeni obejmuje: salon z widokiem na miasto i balkonem, oddzielną kuchnię, sypialnie z pięknym widokiem, łazienkę, osobne WC oraz trzeci pokój (sypialnia/gabinet). Dodatkowo komórka lokatorska.\n\nMieszkanie w doskonałym stanie. Budynek posiada trzy nowe windy, monitoring i ochronę.\n\nLokalizacja: Strefa Kultury, transport, sklepy, szkoły. Idealne dla pary, rodziny lub pod inwestycję (sprawdzona historia wynajmu przez 15 lat).\n\n15. piętro zapewnia spektakularne zachody słońca i widok na centrum Katowic.",
        descriptionEn: "Welcome to this exceptional apartment in the heart of the Gwiazdy estate — a spacious home combining modern living with easy access to everything you need.\n\nThe 61 m² layout includes a living room with city views and a balcony, a separate kitchen, bedrooms with beautiful views, a bathroom, a separate WC and a third room that can serve as a bedroom or office. A storage unit is included.\n\nThe apartment is in excellent condition. The building has three new lifts, CCTV and security.\n\nThe Culture Zone, public transport, shops and schools are close by. A great choice for a couple, family or investment, with a proven 15-year rental history.\n\nThe 15th floor offers spectacular sunsets and views over central Katowice.",
        images: [
            "/properties/gwiazdy/salon.jpg",
            "/properties/gwiazdy/kuchnia.jpg",
            "/properties/gwiazdy/pokoj.jpg",
            "/properties/gwiazdy/lazienka.jpg",
            "/properties/gwiazdy/przedpokoj.jpg"
        ],
        features: ["3 Pokoje", "15. piętro", "Balkon", "Widok na panoramę", "Winda", "Monitoring", "Osobne WC", "Komórka lokatorska"],
        featuresEn: ["3 rooms", "15th floor", "Balcony", "Panoramic view", "Lift", "CCTV", "Separate WC", "Storage unit"],
        agent: {
            name: "Marek Wiśniewski",
            phone: "+48 517 303 400",
            email: "marek.wisniewski@domiz.pl",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2670&auto=format&fit=crop"
        }
    }
];
