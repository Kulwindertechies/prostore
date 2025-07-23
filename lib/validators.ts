import { z } from 'zod';
import { formatNumberwithDecimalPlaces } from '@/lib/utils';
import { PAYMENT_METHODS } from './constants';

const currency = z
  .string()
  .refine(
    (value) => /^\d+(\.\d{2})?$/.test(formatNumberwithDecimalPlaces(Number(value))),
    'Price must be a valid number with two decimal places'
  );

export const insertProductSchema = z.object({
  name: z.string().min(3, 'Name is required'),
  slug: z.string().min(3, 'Slug is required'),
  category: z.string().min(3, 'Category is required'),
  brand: z.string().min(3, 'Brand is required').nullable(), // ✅ FIXED
  description: z.string().min(3, 'Description is required'),
  stock: z.coerce.number(),
  images: z.array(z.string()).min(1, 'At least one image is required'),
  isFeatured: z.boolean(),
  banner: z.string().nullable(),
  price: currency,
});


// schema for  signing user in
export const signInFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6,'Password must be a least 6 characters'),
});

// schema for  sign up user in
export const signUpFormSchema = z.object({
  name : z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6,'Password must be a least 6 characters'),
   confirmpassword: z.string().min(6,'confirm Password must be a least 6 characters'),
}).refine((data) => data.password === data.confirmpassword,{
  message: "password don't match",
  path:['confirmpassword'],
} );

// cart schemas
export const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  qty: z.number().int().nonnegative('Quantity must be a positive number'),
  image: z.string().min(1, 'Image is required'),
  price: currency
});

export const insertCartSchema = z.object({
items: z.array(cartItemSchema),
itemsPrice: currency,
totalPrice: currency,
shippingPrice: currency,
taxPrice: currency,
sessionCartId: z.string().min(1, 'Session cart id is required'),
userId: z.string().optional().nullable(),
})

//schema for the shipping adrees
export const shippingAddressSchema = z.object({
  fullName: z.string().min(3, 'Name must be at least 3 characters'),
  streetAddress: z.string().min(3, 'Address must be at least 3 characters'),
  city: z.string().min(3, 'City must be at least 3 characters'),
  postalCode: z.string().min(3, 'Postal code must be at least 3 characters'),
  country: z.string().min(3, 'Country must be at least 3 characters'),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// schema for the payment method
export const paymentMethodSchema = z.object({
  type: z.string().min(1, 'Payment method is required'),
}).refine((data) => PAYMENT_METHODS.includes(data.type), {
  path: ['type'], 
  message: 'Invalid payment method',
});

// schema for inserting an order
export const insertOrderSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  itemsPrice: currency,
  totalPrice: currency,
  shippingPrice: currency,
  taxPrice: currency,
  paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
    message: 'Invalid payment method',
  }),
  shippingAddress: shippingAddressSchema,
});
// schema for inserting an order item
export const insertOrderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  slug: z.string(),
  image: z.string(),
  price: currency,
  qty: z.number(),
});
// schema for the paypal paymentresult 
export const paymentResultSchema = z.object({
  id: z.string(),
  status: z.string(), 
  email_address: z.string(),
  pricePaid: z.string(),
});

// schema for updating the profile
export const updateProfileSchema = z.object({
  name: z.string().min(3, 'Name must be at least'),
  email: z.string().min(3, 'Email must be at least')
})