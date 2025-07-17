'use server';

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { auth } from "@/auth";
import { convertToPlainObject, formatError } from "../utils";
import { getMyCart } from "./cart.actions";
import { getUserById } from "./user.actions";
import { insertOrderSchema } from "../validators";
import { prisma } from "@/db/prisma";
import { CartItem, PaymentResult } from "@/types";
import { paypal } from "../paypal";
import { revalidatePath } from "next/cache";


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


// create new paypal order
export async function createPaypalOrder(orderId: string) {
try{
// get order from database
const order = await prisma.order.findFirst({
   where: { id: orderId },
});

if(order){
//create paypal order
const paypalOrder = await paypal.createOrder(Number(order.totalPrice));
// update order with paypal order id
await prisma.order.update({
   where: { id: orderId },
   data: {
      paymentResult: {
         id: paypalOrder.id,  
         email_address: '',
         status: '',
         pricePaid: 0,
      }
    },
});
return {success: true,
   message:'Paypal order created successfully',
    data: paypalOrder.id};

}else{
   throw new Error('Order not found');
}

}catch (error) {
    return {success: false, message: formatError(error)};
  }
}

// Approve paypal order and update order to paid
export async function approvePaypalOrder(orderId: string, data:{orderId: string}){
   try{
      // get order from database
      const order = await prisma.order.findFirst({
         where: { id: orderId },
      });
       if(!order) throw new Error('Order not found');
    
       const captureData = await paypal.capturePayment(data.orderId);

       if(!captureData || captureData.id !== (order.paymentResult as PaymentResult)?.id ||
        captureData.status !== 'COMPLETED') {
         throw new Error('Error in paypal payment');
       }
    
         // update order to paid
       updateOrderToPaid({
         orderId,
         paymentResult:{
            id: captureData.id,
            status: captureData.status,
            email_address: captureData.payer.email_address,
            pricePaid: captureData.purchase_units[0]?.payments?.capture[0]?.amount?.value,
         }
       })


         revalidatePath(`/order/${orderId}`);


         return{
            success: true,
            message: 'Order paid successfully',
         }
   }catch (error) {
      return {success: false, message: formatError(error)};
   }

}

// update order to paid
async function updateOrderToPaid({
   orderId,
   paymentResult,
   }: {
   orderId: string;
   paymentResult: PaymentResult;
}) {
      // get order from database
      const order = await prisma.order.findFirst({
         where: { id: orderId },
         include: { orderitems: true },
      });
       if(!order) throw new Error('Order not found');

       if(order.isPaid) throw new Error('Order is already paid');

       //Transaction to update order and account for prosuct stock 
       await prisma.$transaction(async (tx) =>{
         // Iterate over products and update stock
         for (const item of order.orderitems) {
            await tx.product.update({
               where: { id: item.productId },
               data: { stock: { increment: -item.qty } },
            });
         }

      // set the order to paid
      await tx.order.update({
         where:{id: orderId},
         data: {
          isPaid: true,
          paidAt: new Date(),
          paymentResult,
         }
      })
       }); 

      //get update order after transaction
      const updatedOrder = await prisma.order.findFirst({
         where: { id: orderId },
         include: { orderitems: true,
         user: {select: { name: true, email: true }},
         },
      });
      if(!updatedOrder) throw new Error('Order not found after update');
}