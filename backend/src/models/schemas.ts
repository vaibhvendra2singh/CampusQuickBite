import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// Helper for UUID or Numeric ID (we use both in different places)
const idSchema = z.union([z.string().uuid(), z.number().int().positive()]);
const stringIdSchema = z.union([z.string().min(1), z.number().int().positive()]).transform(v => String(v));

// XSS Sanitization helper: Strips ALL HTML tags for plain text fields
const sanitizedString = (min: number = 0, max: number = 1000) => 
    z.string()
    .min(min)
    .max(max)
    .transform(val => sanitizeHtml(val, {
        allowedTags: [],
        allowedAttributes: {}
    }).trim());
 
// Internal Campus Email helper: Allows things like 'user@bennett' without a dot extension
const emailSchema = z.string().regex(/^[^@]+@[^@]+$/, 'Invalid email format');

// Auth Schemas
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(6),
});

export const registerSchema = z.object({
    email: emailSchema,
    password: z.string().min(8),
    name: sanitizedString(2, 100),
    role: z.string().optional().transform(v => v?.toLowerCase()).pipe(z.enum(['student', 'owner', 'admin']).optional()),
});

export const forgotPasswordSchema = z.object({
    email: emailSchema,
});

export const verifyTokenSchema = z.object({
    token: z.string().uuid(),
});

export const resetPasswordSchema = z.object({
    token: z.string().uuid(),
    newPassword: z.string().min(8),
});

export const changePasswordSchema = z.object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(8),
});

// Order Schemas
export const createOrderSchema = z.object({
    outletId: stringIdSchema,
    items: z.array(z.object({
        menuItemId: stringIdSchema,
        quantity: z.number().int().min(1).max(100),
    })).min(1),
});

export const updateOrderStatusSchema = z.object({
    status: z.string().transform(v => v.toLowerCase()).pipe(z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled'])),
});

// Menu Schemas
export const menuItemSchema = z.object({
    name: sanitizedString(1, 100),
    price: z.number().min(0),
    description: sanitizedString(0, 500).optional(),
    isVeg: z.boolean().optional(),
    availability: z.boolean().optional(),
    image_url: z.string().url().optional().or(z.literal('')),
});

export const menuItemUpdateSchema = menuItemSchema.partial();

// Cart Schemas
export const addToCartSchema = z.object({
    menuItemId: stringIdSchema,
    quantity: z.number().int().min(1).max(50).optional(),
});

export const updateCartItemSchema = z.object({
    menuItemId: stringIdSchema,
    quantity: z.number().int().min(1).max(50),
});

// Outlet Schemas
export const createOutletSchema = z.object({
    name: sanitizedString(2, 100),
    location: sanitizedString(2, 200),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    ownerName: sanitizedString(2, 100).optional(),
    ownerEmail: emailSchema.optional(),
    ownerPassword: z.string().min(8).optional(),
});

export const updateOutletSchema = createOutletSchema.partial().extend({
    is_open: z.boolean().optional()
});

// Rating Schemas
export const submitRatingSchema = z.object({
    orderId: z.number().int().positive(),
    menuItemId: stringIdSchema.optional(),
    rating: z.number().int().min(1).max(5),
    review: sanitizedString(0, 300).optional(),
});

// User Schemas
export const updateUserProfileSchema = z.object({
    name: sanitizedString(2, 100).optional(),
    phoneNumber: z.string().max(15).optional(),
    enrollmentNumber: z.string().max(20).optional(),
    profilePic: z.string().url().optional(),
});

export const updateUserRoleSchema = z.object({
    role: z.enum(['student', 'owner', 'admin']),
});

export const toggleUserStatusSchema = z.object({
    field: z.string().optional(),
    value: z.boolean().optional(),
    is_banned: z.boolean().optional()
});

// Announcement Schemas
export const createAnnouncementSchema = z.object({
    title: z.string().min(2).max(100),
    content: z.string().min(2).max(1000),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
    target_role: z.enum(['student', 'owner', 'admin', 'all']).optional().default('all'),
});

// Payment Schemas
export const paymentSchema = z.object({
    orderId: z.number().int().positive(),
    amount: z.number().positive(),
    paymentMethod: z.string().min(1).max(50),
});

