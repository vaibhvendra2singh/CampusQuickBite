export const ROLES = {
    STUDENT: 'student',
    OWNER: 'owner',
    ADMIN: 'admin'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

/**
 * Normalizes roles from frontend/input to backend internal representation
 */
export const normalizeRole = (role: string): UserRole => {
    const r = role.toLowerCase();
    if (r === 'shop_owner' || r === 'owner') return ROLES.OWNER;
    if (r === 'admin') return ROLES.ADMIN;
    return ROLES.STUDENT;
};

/**
 * Maps DB role to frontend display role
 */
export const displayRole = (role: string): string => {
    if (role === ROLES.OWNER) return 'SHOP_OWNER';
    return role.toUpperCase();
};
