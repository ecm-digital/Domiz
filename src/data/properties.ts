export interface Property {
    id: number;
    title: string;
    price: number;
    location: string;
    beds: number;
    baths: number;
    sqft: number;
    type: 'dom' | 'mieszkanie' | 'dzialka';
    status: 'sprzedaz' | 'wynajem';
    image: string;
    featured: boolean;
    description: string;
    images: string[];
    features: string[];
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
        title: "Nowoczesna Willa z Basenem",
        price: 1250000,
        location: "Tłuszcz, Aleja Lipowa",
        beds: 4,
        baths: 3,
        sqft: 220,
        type: "dom",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1600596542815-2250657d2f96?q=80&w=2675&auto=format&fit=crop",
        featured: true,
        description: "Luksusowa willa z basenem, ogrodem i garażem na 2 samochody. Wysoki standard wykończenia, inteligentny system zarządzania domem oraz ekologiczne rozwiązania. Idealna dla wymagających klientów ceniących prywatność i komfort.",
        images: [
            "https://images.unsplash.com/photo-1600596542815-2250657d2f96?q=80&w=2675&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop"
        ],
        features: ["Basen", "Garaż", "Ogród", "Smart Home", "Klimatyzacja", "Panel fotowoltaiczny"],
        agent: {
            name: "Anna Nowak",
            phone: "+48 500 600 700",
            email: "anna.nowak@domiz.pl",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop"
        }
    },
    {
        id: 2,
        title: "Apartament w Centrum",
        price: 450000,
        location: "Tłuszcz, ul. Warszawska",
        beds: 2,
        baths: 1,
        sqft: 65,
        type: "mieszkanie",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop",
        featured: false,
        description: "Nowoczesny apartament w ścisłym centrum miasta. Blisko do stacji PKP, sklepów i szkół. W pełni wyposażony aneks kuchenny i przestronny salon.",
        images: [
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2680&auto=format&fit=crop"
        ],
        features: ["Balkon", "Winda", "Parking podziemny", "Ochrona", "Blisko PKP"],
        agent: {
            name: "Piotr Kowalski",
            phone: "+48 500 600 800",
            email: "piotr.kowalski@domiz.pl",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2574&auto=format&fit=crop"
        }
    },
    {
        id: 3,
        title: "Dom Rodzinny na Przedmieściach",
        price: 890000,
        location: "Jasienica, ul. Centralna",
        beds: 5,
        baths: 2,
        sqft: 180,
        type: "dom",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop",
        featured: true,
        description: "Przestronny dom idealny dla dużej rodziny. Spokojna okolica, blisko lasu. Duży ogród z miejscem na grilla i plac zabaw dla dzieci.",
        images: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2574&auto=format&fit=crop"
        ],
        features: ["Duży ogród", "Garaż dwustanowiskowy", "Kominek", "Taras", "Spokojna okolica"],
        agent: {
            name: "Anna Nowak",
            phone: "+48 500 600 700",
            email: "anna.nowak@domiz.pl",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop"
        }
    },
    {
        id: 4,
        title: "Kawalerka do Wynajęcia",
        price: 2200,
        location: "Tłuszcz, ul. Kolejowa",
        beds: 1,
        baths: 1,
        sqft: 32,
        type: "mieszkanie",
        status: "wynajem",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2680&auto=format&fit=crop",
        featured: false,
        description: "Przytulna kawalerka tuż obok stacji. Idealna dla osoby dojeżdżającej do Warszawy. Niskie opłaty eksploatacyjne.",
        images: [
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2680&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop"
        ],
        features: ["Blisko PKP", "Umeblowane", "Internet w cenie", "Niskie opłaty"],
        agent: {
            name: "Piotr Kowalski",
            phone: "+48 500 600 800",
            email: "piotr.kowalski@domiz.pl",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2574&auto=format&fit=crop"
        }
    },
    {
        id: 5,
        title: "Działka Budowlana 1000m²",
        price: 180000,
        location: "Postoliska, ul. Polna",
        beds: 0,
        baths: 0,
        sqft: 1000,
        type: "dzialka",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2532&auto=format&fit=crop",
        featured: false,
        description: "Atrakcyjna działka budowlana w drugiej linii zabudowy. Wszystkie media w drodze (prąd, woda, gaz, kanalizacja). Wydane warunki zabudowy.",
        images: [
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2532&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2532&auto=format&fit=crop"
        ],
        features: ["Media w drodze", "Warunki zabudowy", "Cicha okolica", "Dojazd asfaltowy"],
        agent: {
            name: "Marek Wiśniewski",
            phone: "+48 500 600 900",
            email: "marek.wisniewski@domiz.pl",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2670&auto=format&fit=crop"
        }
    },
    {
        id: 6,
        title: "Bliźniak z Ogrodem",
        price: 720000,
        location: "Tłuszcz, ul. Ogrodowa",
        beds: 4,
        baths: 2,
        sqft: 145,
        type: "dom",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop",
        featured: true,
        description: "Nowoczesny bliźniak w stanie deweloperskim. Ogrzewanie podłogowe, pompa ciepła, rekuperacja. Ogród o powierzchni 400m2.",
        images: [
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2670&auto=format&fit=crop"
        ],
        features: ["Pompa ciepła", "Rekuperacja", "Ogrzewanie podłogowe", "Garaż", "Stan deweloperski"],
        agent: {
            name: "Anna Nowak",
            phone: "+48 500 600 700",
            email: "anna.nowak@domiz.pl",
            image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=2576&auto=format&fit=crop"
        }
    },
    {
        id: 7,
        title: "Mieszkanie 3-pokojowe",
        price: 3500,
        location: "Tłuszcz, ul. Sportowa",
        beds: 3,
        baths: 1,
        sqft: 72,
        type: "mieszkanie",
        status: "wynajem",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2670&auto=format&fit=crop",
        featured: false,
        description: "Przestronne, w pełni umeblowane mieszkanie dla rodziny. Dwie sypialnie, salon z aneksem, duża łazienka. Miejsce postojowe w cenie.",
        images: [
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop"
        ],
        features: ["Umeblowane", "Miejsce postojowe", "Balkon", "Blisko szkoły"],
        agent: {
            name: "Piotr Kowalski",
            phone: "+48 500 600 800",
            email: "piotr.kowalski@domiz.pl",
            image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=2574&auto=format&fit=crop"
        }
    },
    {
        id: 8,
        title: "Dom Ekologiczny",
        price: 1150000,
        location: "Mokra Wieś, ul. Słoneczna",
        beds: 4,
        baths: 2,
        sqft: 160,
        type: "dom",
        status: "sprzedaz",
        image: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2670&auto=format&fit=crop",
        featured: false,
        description: "Dom pasywny o zerowym zużyciu energii. Własna studnia, oczyszczalnia ścieków, farma fotowoltaiczna. Całkowita niezależność energetyczna.",
        images: [
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2670&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2653&auto=format&fit=crop"
        ],
        features: ["Dom pasywny", "Fotowoltaika", "Własna woda", "Oczyszczalnia", "Las w pobliżu"],
        agent: {
            name: "Marek Wiśniewski",
            phone: "+48 500 600 900",
            email: "marek.wisniewski@domiz.pl",
            image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2670&auto=format&fit=crop"
        }
    }
];
