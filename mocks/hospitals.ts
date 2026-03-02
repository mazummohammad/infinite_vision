export interface Hospital {
    id: string;
    name: string;
    distance: string;
    distanceKm: number;
    address: string;
    phone: string;
    rating: number;
    open24h: boolean;
    type: string;
}

export const HOSPITALS: Hospital[] = [
    {
        id: '1',
        name: 'Apollo Hospital',
        distance: '1.2 km',
        distanceKm: 1.2,
        address: '21 Greams Lane, Off Greams Road',
        phone: '+91 44 2829 3333',
        rating: 4.8,
        open24h: true,
        type: 'Multi-Specialty',
    },
    {
        id: '2',
        name: 'ESI Hospital',
        distance: '2.5 km',
        distanceKm: 2.5,
        address: '143 Sterling Road, Nungambakkam',
        phone: '+91 44 2345 6789',
        rating: 4.2,
        open24h: true,
        type: 'Government',
    },
    {
        id: '3',
        name: 'Fortis Mental Health Center',
        distance: '3.1 km',
        distanceKm: 3.1,
        address: '154/11 Bannerghatta Road',
        phone: '+91 80 6621 4444',
        rating: 4.6,
        open24h: false,
        type: 'Mental Health',
    },
    {
        id: '4',
        name: 'NIMHANS',
        distance: '4.8 km',
        distanceKm: 4.8,
        address: 'Hosur Road, Lakkasandra',
        phone: '+91 80 2699 5000',
        rating: 4.9,
        open24h: true,
        type: 'Mental Health',
    },
    {
        id: '5',
        name: 'Manipal Hospital',
        distance: '5.2 km',
        distanceKm: 5.2,
        address: '98 HAL Old Airport Road',
        phone: '+91 80 2502 4444',
        rating: 4.5,
        open24h: true,
        type: 'Multi-Specialty',
    },
];