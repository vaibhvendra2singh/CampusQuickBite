import { z } from 'zod';

// Auth Schemas
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    role: z.string().optional().transform(v => v?.toLowerCase()).pipe(z.enum(['student', 'owner', 'admin']).optional()),
});

// Order Schemas
export const createOrderSchema = z.object({
    outletId: z.union([z.string(), z.number()]),
    items: z.array(z.object({
        menuItemId: z.union([z.string(), z.number()]),
        quantity: z.number().int().min(1),
    })).min(1),
});

export const updateOrderStatusSchema = z.object({
    status: z.string().transform(v => v.toLowerCase()).pipe(z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled'])),
});

// Menu Schemas
export const menuItemSchema = z.object({
    name: z.string().min(1),
    price: z.number().min(0),
    description: z.string().optional(),
    isVeg: z.boolean().optional(),
    availability: z.boolean().optional(),
    image_url: z.string().url().optional().or(z.literal('')),
});

// Partial update schema — used for PUT requests (e.g. availability-only toggle)
export const menuItemUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    price: z.number().min(0).optional(),
    description: z.string().optional(),
    isVeg: z.boolean().optional(),
    availability: z.boolean().optional(),
    image_url: z.string().url().optional().or(z.literal('')),
});

// Cart Schemas
export const addToCartSchema = z.object({
    menuItemId: z.union([z.string(), z.number()]),
    quantity: z.number().int().min(1).optional(),
});
