/**
 * EcoVision - Smart Campus Circular Plastic Economy
 * Smart Campus & Student Life Business Logic
 * 
 * Features:
 * - Campus Zones & Smart Drop-off Hubs
 * - Plastic Classification & EcoCredits Rates
 * - Student Reward Vouchers (Cafeteria, Printing, Bookstore, 3D Filament)
 * - Inter-Hostel / Club Green League Leaderboard
 * - Environmental Impact Calculation (CO2e, Landfill Diverted, Trees Equivalent)
 */

export const CAMPUS_ZONES = [
    { id: 'north_dorms', name: 'North Dormitories (Hall 1 & 2)', location: 'Sector A', type: 'Residential' },
    { id: 'south_dorms', name: 'South Residences (Hall 3 & 4)', location: 'Sector B', type: 'Residential' },
    { id: 'student_union', name: 'Student Union & Central Cafeteria', location: 'Campus Center', type: 'Dining & Social' },
    { id: 'makerspace_lab', name: 'Engineering Makerspace & 3D Lab', location: 'Tech Block 3', type: 'Laboratory' },
    { id: 'science_complex', name: 'Biotech & Science Complex', location: 'Science Wing B', type: 'Laboratory' },
    { id: 'library', name: 'Central University Library', location: 'Academic Quad', type: 'Study Hub' },
    { id: 'sports_arena', name: 'Campus Sports Arena & Gymnasium', location: 'Athletics Zone', type: 'Sports' }
];

export const PLASTIC_CATEGORIES = {
    PET: {
        code: 'PET (1)',
        name: 'Polyethylene Terephthalate',
        commonUses: 'Water bottles, juice containers, cafeteria cups',
        ratePerKg: 16,
        creditsPerKg: 30,
        co2OffsetPerKg: 1.5,
        badgeColor: '#27ae60',
        recyclable: true
    },
    HDPE: {
        code: 'HDPE (2)',
        name: 'High-Density Polyethylene',
        commonUses: 'Milk jugs, laundry detergent bottles, campus shampoo containers',
        ratePerKg: 14,
        creditsPerKg: 25,
        co2OffsetPerKg: 1.8,
        badgeColor: '#2980b9',
        recyclable: true
    },
    PVC: {
        code: 'PVC (3)',
        name: 'Polyvinyl Chloride',
        commonUses: 'Lab pipes, electrical conduit scraps, cable sheathing',
        ratePerKg: 11,
        creditsPerKg: 20,
        co2OffsetPerKg: 1.3,
        badgeColor: '#8e44ad',
        recyclable: true
    },
    LDPE: {
        code: 'LDPE (4)',
        name: 'Low-Density Polyethylene',
        commonUses: 'Packaging bubble wrap, e-commerce mailing bags, squeeze bottles',
        ratePerKg: 10,
        creditsPerKg: 18,
        co2OffsetPerKg: 1.2,
        badgeColor: '#e67e22',
        recyclable: true
    },
    PP: {
        code: 'PP (5)',
        name: 'Polypropylene',
        commonUses: 'Reusable meal boxes, lab test-tube racks, bottle caps',
        ratePerKg: 12,
        creditsPerKg: 22,
        co2OffsetPerKg: 1.4,
        badgeColor: '#16a085',
        recyclable: true
    },
    PS: {
        code: 'PS (6)',
        name: 'Polystyrene',
        commonUses: 'Protective packaging foam, insulation scraps, disposable cutlery',
        ratePerKg: 8,
        creditsPerKg: 15,
        co2OffsetPerKg: 1.1,
        badgeColor: '#d35400',
        recyclable: true
    },
    PLA_3D: {
        code: 'PLA/PETG (7)',
        name: '3D Printer Scraps & Prototypes',
        commonUses: 'Makerspace failed prints, support material, prototyping spools',
        ratePerKg: 25,
        creditsPerKg: 50,
        co2OffsetPerKg: 2.2,
        badgeColor: '#1abc9c',
        recyclable: true
    }
};

export const STUDENT_REWARDS = [
    {
        id: 'reward_cafe',
        title: 'Cafeteria Green Meal Pass',
        costCredits: 100,
        description: '₹100 discount voucher valid at any campus dining hall or food truck.',
        category: 'Food & Dining',
        icon: '☕'
    },
    {
        id: 'reward_print',
        title: 'Campus Printing Quota (50 Pages)',
        costCredits: 60,
        description: '50 free B&W laser printouts credited to your student library account.',
        category: 'Academic Services',
        icon: '🖨️'
    },
    {
        id: 'reward_bookstore',
        title: 'Bookstore 20% Discount Voucher',
        costCredits: 150,
        description: '20% off on textbooks, stationary, and campus supplies.',
        category: 'Store & Merchandise',
        icon: '📚'
    },
    {
        id: 'reward_filament',
        title: 'Recycled 3D Filament Spool (500g)',
        costCredits: 280,
        description: '500g spool of 1.75mm recycled PLA/PETG filament for campus makerspace.',
        category: 'Engineering & Lab',
        icon: '🧵'
    },
    {
        id: 'reward_badge',
        title: 'Verified Green Ambassador Badge',
        costCredits: 400,
        description: 'Official digital campus badge and sustainability certificate for your resume/LinkedIn.',
        category: 'Achievement',
        icon: '🏅'
    }
];

export const INITIAL_HOSTEL_LEADERBOARD = [
    { id: 'dorm_newton', name: 'Newton Hall of Residence', totalKg: 420, credits: 11200, rank: 1, members: 210 },
    { id: 'dorm_curie', name: 'Curie Science Hostel', totalKg: 385, credits: 9950, rank: 2, members: 180 },
    { id: 'dorm_aryabhata', name: 'Aryabhata Engineering Block', totalKg: 340, credits: 8900, rank: 3, members: 195 },
    { id: 'club_warriors', name: 'Green Warriors Student Club', totalKg: 290, credits: 7800, rank: 4, members: 75 },
    { id: 'dorm_tagore', name: 'Tagore Arts & Humanities Dorm', totalKg: 215, credits: 5600, rank: 5, members: 140 }
];

export class CampusMetrics {
    /**
     * Calculates environmental offsets from total recycled plastic
     * @param {number} totalKg 
     */
    static calculateImpact(totalKg) {
        const kg = Math.max(0, Number(totalKg) || 0);
        return {
            plasticKg: kg,
            co2OffsetKg: Number((kg * 1.62).toFixed(2)),
            landfillVolumeM3: Number((kg * 0.0032).toFixed(3)),
            treesEquivalent: Math.floor(kg / 22),
            energySavedKWh: Number((kg * 5.77).toFixed(1))
        };
    }

    /**
     * Calculates EcoCredits for a given plastic type and quantity
     * @param {string} plasticType 
     * @param {number} quantityKg 
     * @returns {number}
     */
    static calculateEcoCredits(plasticType, quantityKg) {
        const typeInfo = PLASTIC_CATEGORIES[plasticType] || PLASTIC_CATEGORIES.PET;
        const qty = Math.max(0, Number(quantityKg) || 0);
        return Math.round(qty * typeInfo.creditsPerKg);
    }

    /**
     * Computes user purchase limit based on verified role
     * @param {'student'|'faculty_staff'|'campus_recycler'} role 
     * @returns {number} limit in kg
     */
    static getRoleWeightLimit(role) {
        switch (role) {
            case 'campus_recycler': return 1000;
            case 'faculty_staff': return 150;
            case 'student':
            default:
                return 50;
        }
    }
}

