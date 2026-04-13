import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

const idSchema = z.union([z.string().uuid(), z.number().int().positive()]);
const stringIdSchema = z.union([z.string().min(1), z.number().int().positive()]).transform(v => String(v));

const sanitizedString = (min: number = 0, max: number = 1000) => 
    z.string()
    .min(min)
    .max(max)
    .transform(val => sanitizeHtml(val, {
        allowedTags: [],
        allowedAttributes: {}
    }).trim());
 
const emailSchema = z.string().regex(/^[^@]+@[^@]+$/, 'Invalid email format');

export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(6),
});

export const registerSchema = z.object({
    email: emailSchema,
    password: z.string().min(6),
    name: sanitizedString(2, 100),
    role: z.string().optional().transform(v => v?.toLowerCase()).pipe(z.enum(['student', 'owner', 'shop_owner', 'admin']).optional()),
    enrollmentNumber: z.string().min(5).max(20).optional(),
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

export const createOrderSchema = z.object({
    outletId: stringIdSchema,
    items: z.array(z.object({
        menuItemId: stringIdSchema,
        quantity: z.number().int().min(1).max(100),
    })).min(1),
    notes: z.string().max(500).optional(),
    scheduledTime: z.string().datetime().optional().or(z.string().optional()),
});

export const updateOrderStatusSchema = z.object({
    status: z.string().transform(v => v.toLowerCase()).pipe(z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled'])),
});

export const menuItemSchema = z.object({
    name: sanitizedString(1, 100),
    price: z.number().min(0),
    description: sanitizedString(0, 500).optional(),
    isVeg: z.boolean().optional(),
    availability: z.boolean().optional(),
    image_url: z.string().url().optional().or(z.literal('')),
});

export const menuItemUpdateSchema = menuItemSchema.partial();

export const addToCartSchema = z.object({
    menuItemId: stringIdSchema,
    quantity: z.number().int().min(1).max(50).optional(),
});

export const updateCartItemSchema = z.object({
    menuItemId: stringIdSchema,
    quantity: z.number().int().min(1).max(50),
});

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

export const submitRatingSchema = z.object({
    orderId: z.number().int().positive(),
    menuItemId: stringIdSchema.optional(),
    rating: z.number().int().min(1).max(5),
    review: sanitizedString(0, 300).optional(),
});

export const updateUserProfileSchema = z.object({
    name: sanitizedString(2, 100).optional(),
    phoneNumber: z.string().max(15).optional(),
    enrollmentNumber: z.string().max(20).optional(),
    profilePic: z.string().url().optional().or(z.literal('')),
});

export const updateUserRoleSchema = z.object({
    role: z.enum(['student', 'owner', 'admin']),
});

export const toggleUserStatusSchema = z.object({
    field: z.string().optional(),
    value: z.boolean().optional(),
    is_banned: z.boolean().optional()
});

export const createAnnouncementSchema = z.object({
    title: z.string().min(2).max(100),
    message: z.string().min(2).max(1000),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional().default('normal'),
    target_role: z.enum(['student', 'owner', 'admin', 'all']).optional().default('all'),
});

export const paymentSchema = z.object({
    orderId: z.union([z.number(), z.string()]),
    amount: z.number().positive(),
    paymentMethod: z.string().min(1).max(50).optional().default('CASH'),
});

