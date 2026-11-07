import type { Property } from './properties';

export const GARDEN_READ: string;
export const GARDEN_LINK_CHECK: string;
export const GARDEN_OFFERS: Array<{
    id: string;
    city: 'Warszawa' | 'Katowice';
    garden: number | null;
    price: number;
    parking: string | null;
    status: string;
    url: string;
    combined: number | null;
}>;

export function gardenStudioProperties(): Property[];
