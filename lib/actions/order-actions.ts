'use server';

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { auth } from "@/auth";
import { formatError } from "../utils";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";
import { insertProductSchema } from "../validators";


// create order and create the order items

export async function createOrder() {
    try{

    const session = await auth();
    if(!session) throw new Error ("user is not authenticated");
    const cart = await getMyCart();
     const userId = session?.user?.id;
     if(!userId) throw new Error ('user not found');

     const user = await getUserById(userId);

     if(!cart || cart.items.length === 0){
        return {success: false, message: 'your cart is empty', redirectTo:'/cart'}
     }
      if(!user.address){
        return {success: false, message: 'No shipping addres', redirectTo:'/shipping-address'}
     }
      if(!user.paymentMethod){
        return {success: false, message: 'No payment method', redirectTo:'/payment-method'}
     }
     // create order objet
     const order = insertProductSchema.parse({
        userId: user.id,
        shippingAddress: user.address,
        paymentMethod: user.paymentMethod,
        itemsPrice:cart.itemsPrice,
        shippingPrice:cart.shippingPrice,
        taxPrice:cart.taxPrice,
        totalPrice:cart.totalPrice,
     })
    } catch (error){
     if(!isRedirectError(error)) throw error;
     return{success: false, message:formatError(error) }
    }
}