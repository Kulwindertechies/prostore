'use server';

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { auth } from "@/auth";
import { convertToPlainObject, formatError } from "../utils";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";
import { insertOrderSchema } from "../validators";
import { prisma } from "@/db/prisma";
import { CartItem } from "@/types";


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
     const order = insertOrderSchema.parse({
        userId: user.id,
        shippingAddress: user.address,
        paymentMethod: user.paymentMethod,
        itemsPrice:cart.itemsPrice,
        shippingPrice:cart.shippingPrice,
        taxPrice:cart.taxPrice,
        totalPrice:cart.totalPrice,
     });
     // create a transaction to create the order and order items
    const insertOrderId =  await prisma.$transaction(async (tx) => {
      // create order
     const insertedOrder = await tx.order.create({ data: order });
     // create order items
     for(const item of cart.items as CartItem[]){
    await tx.orderItem.create({
        data: {
         ...item,
         price: item.price,
         orderId: insertedOrder.id,
        },
     });
   }
       // clear the cart 
       await tx.cart.update({
         where: { id: cart.id },
         data: { 
            items: [],
            totalPrice: 0,
            itemsPrice: 0, 
            shippingPrice: 0,
            taxPrice: 0,
          },
       });
       return insertedOrder.id;
     });
     if(!insertOrderId) throw new Error('Order creation failed');
     return {success: true, message: 'Order created successfully', orderId: insertOrderId, redirectTo: `/order/${insertOrderId}`};
    } catch (error){
     if(!isRedirectError(error)) throw error;
     return{success: false, message:formatError(error) }
    }
}

// get order by id
export async function getOrderById(orderId: string) {
const data = await prisma.order.findFirst({
   where: { id: orderId },
   include: {
      orderitems: true,
      user: {select: { name: true, email: true }},
   },
});
return convertToPlainObject(data);
}