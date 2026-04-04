export const ROLES = {
    STUDENT: 'student',
    OWNER: 'owner',
    ADMIN: 'admin'
} as const;

export const DISPLAY_ROLES = {
    STUDENT: 'STUDENT',
    SHOP_OWNER: 'SHOP_OWNER',
    ADMIN: 'ADMIN'
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
 * Maps DB role to frontend display/JWT role
 */
export const displayRole = (role: string): string => {
    if (role === ROLES.OWNER || role === 'SHOP_OWNER') return DISPLAY_ROLES.SHOP_OWNER;
    if (role === ROLES.ADMIN || role === 'ADMIN') return DISPLAY_ROLES.ADMIN;
    return DISPLAY_ROLES.STUDENT;
};
