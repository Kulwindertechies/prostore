// "use server";

// import { CartItem } from "@/types";
// import { cookies } from "next/headers";
// import { convertToPlainObject, formatError, round2 } from "../utils";
// import { auth } from "@/auth";
// import { prisma } from "@/db/prisma";
// import { cartItemSchema, insertCartSchema } from "../validators";
// import { revalidatePath } from "next/cache";

// // Price Calculation
// const calcPrice = (items: CartItem[]) => {
//   const itemsPrice = round2(
//       items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
//     ),
//     shippingPrice = round2(itemsPrice > 100 ? 0 : 10),
//     taxPrice = round2(0.15 * itemsPrice),
//     totalPrice = round2(itemsPrice + taxPrice + shippingPrice);

//   return {
//     itemsPrice: itemsPrice.toFixed(2),
//     shippingPrice: shippingPrice.toFixed(2),
//     taxPrice: taxPrice.toFixed(2),
//     totalPrice: totalPrice.toFixed(2),
//   };
// };

// export async function addItemToCart(data: CartItem) {
//   try {
//     const sessionCartId = (await cookies()).get("sessionCartId")?.value;
//     if (!sessionCartId) throw new Error("Cart session not found");

//     const session = await auth();
//     const userId = session?.user?.id ? (session.user.id as string) : undefined;

//     let validUserId: string | undefined = undefined;
//     if (userId) {
//       const user = await prisma.user.findUnique({ where: { id: userId } });
//       if (user) {
//         validUserId = userId;
//       }
//     }

//     const cart = await getMyCart();

//     const item = cartItemSchema.parse(data);
//     const product = await prisma.product.findFirst({
//       where: { id: item.productId },
//     });
//     console.log("new product add",product);
    
//     if (!product) throw new Error("Product not found");

//     if (!cart) {
//       // Create new cart
//       const newCart = insertCartSchema.parse({
//         userId: validUserId,
//         items: [item],
//         sessionCartId,
//         ...calcPrice([item]),
//       });
// console.log("new cart",newCart);

//       await prisma.cart.create({ data: newCart });

//       revalidatePath(`/product/${product.slug}`);
//       return { success: true, message: `${product.name} added to cart` };
//     } else {
//       const existItem = (cart.items as CartItem[]).find(
//         (x) => x.productId === item.productId
//       );

//       if (existItem) {
//         if (product.stock < existItem.qty + 1) {
//           throw new Error("Not enough stock");
//         }
//         existItem.qty += 1;
//       } else {
//         if (product.stock < 1) throw new Error("Not enough stock");
//         cart.items.push(item);
//       }

//       await prisma.cart.update({
//         where: { id: cart.id },
//         data: {
//           items: cart.items,
//           ...calcPrice(cart.items as CartItem[]),
//         },
//       });

//       revalidatePath(`/product/${product.slug}`);
//       return {
//         success: true,
//         message: `${product.name} ${
//           existItem ? "updated in" : "added to"
//         } cart`,
//       };
//     }
//   } catch (error) {
//     return {
//       success: false,
//       message: formatError(error),
//     };
//   }
// }

// // Helper: Get Cart
// export async function getMyCart() {
//   const sessionCartId = (await cookies()).get("sessionCartId")?.value;
//   if (!sessionCartId) throw new Error("Cart session not found");

//   const session = await auth();
//   const userId = session?.user?.id ? (session.user.id as string) : undefined;

//   const cart = await prisma.cart.findFirst({
//     where: userId ? { userId } : { sessionCartId },
//   });
// console.log("cart action",cart);

//   if (!cart) return undefined;

//   return convertToPlainObject({
//     ...cart,
//     items: cart.items as CartItem[],
//     itemsPrice: cart.itemsPrice.toString(),
//     totalPrice: cart.totalPrice.toString(),
//     shippingPrice: cart.shippingPrice.toString(),
//     taxPrice: cart.taxPrice.toString(),
//   });
// }


// export async function removeItemFromCart(productId: string) {
//   try {
//     const sessionCartId = (await cookies()).get("sessionCartId")?.value;
//     if (!sessionCartId) throw new Error("Cart session not found");

//    // get product
//    const product = await prisma.product.findFirst({
//       where: { id: productId }
//     });
//     if (!product) throw new Error("Product not found");


//     // get cart
//     const cart = await getMyCart();
//     if (!cart) throw new Error("Cart not found");

//     // check if item exists in cart
//     const existItem = (cart.items as CartItem[]).find((x) => x.productId === productId);
//     if (!existItem) throw new Error("Item not found in cart");

// // check if only one qty in cart 
//    if (existItem.qty === 1){
//     // remove item from cart
//     cart.items = (cart.items as CartItem[]).filter(
//       (x) => x.productId !== existItem.productId);
//    }else{
//     // reduce qty by 1
//     (cart.items as CartItem[]).find((x) => x.productId === productId)!.qty = existItem.qty - 1;
//    }
//   // Update cart in database
//    await prisma.cart.update({
//         where: { id: cart.id },
//         data: {
//           items: cart.items,
//           ...calcPrice(cart.items as CartItem[]),
//         },
//       });


//     revalidatePath(`/product/${product.slug}`);

//     return { success: true, message:`${product.name} removed from cart`};
//   } catch (error) {
//     return {
//       success: false,
//       message: formatError(error),
//     };
//   }
// }


"use server";

import { CartItem } from "@/types";
import { cookies } from "next/headers";
import { convertToPlainObject, formatError, round2 } from "../utils";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema, insertCartSchema } from "../validators";
import { revalidatePath } from "next/cache";

// Price Calculation
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = round2(
      items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
    ),
    shippingPrice = round2(itemsPrice > 100 ? 0 : 10),
    taxPrice = round2(0.15 * itemsPrice),
    totalPrice = round2(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

// ✅ Main action function
export async function addItemToCart(data: CartItem) {
  try {
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) throw new Error("Cart session not found");

    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // ✅ Validate that user exists if userId is present
    let validUserId: string | undefined = undefined;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        validUserId = userId;
      }
    }

    const cart = await getMyCart();

    const item = cartItemSchema.parse(data);
    const product = await prisma.product.findFirst({
      where: { id: item.productId },
    });
    if (!product) throw new Error("Product not found");

    if (!cart) {
      // Create new cart
      const newCart = insertCartSchema.parse({
        userId: validUserId,
        items: [item],
        sessionCartId,
        ...calcPrice([item]),
      });

      await prisma.cart.create({ data: newCart });

      revalidatePath(`/product/${product.slug}`);
      return { success: true, message: `${product.name} added to cart` };
    } else {
      const existItem = (cart.items as CartItem[]).find(
        (x) => x.productId === item.productId
      );

      if (existItem) {
        if (product.stock < existItem.qty + 1) {
          throw new Error("Not enough stock");
        }
        existItem.qty += 1;
      } else {
        if (product.stock < 1) throw new Error("Not enough stock");
        cart.items.push(item);
      }

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items,
          ...calcPrice(cart.items as CartItem[]),
        },
      });

      revalidatePath(`/product/${product.slug}`);
      return {
        success: true,
        message: `${product.name} ${
          existItem ? "updated in" : "added to"
        } cart`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Helper: Get Cart
export async function getMyCart() {
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;
  if (!sessionCartId) throw new Error("Cart session not found");

  const session = await auth();
  const userId = session?.user?.id ? (session.user.id as string) : undefined;

  const cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionCartId },
  });
console.log("cart",cart);

  if (!cart) return undefined;

  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
}


export async function removeItemFromCart(productId: string) {
  try {
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) throw new Error("Cart session not found");

   // get product
   const product = await prisma.product.findFirst({
      where: { id: productId }
    });
    if (!product) throw new Error("Product not found");


    // get cart
    const cart = await getMyCart();
    if (!cart) throw new Error("Cart not found");

    // check if item exists in cart
    const existItem = (cart.items as CartItem[]).find((x) => x.productId === productId);
    if (!existItem) throw new Error("Item not found in cart");

// check if only one qty in cart 
   if (existItem.qty === 1){
    // remove item from cart
    cart.items = (cart.items as CartItem[]).filter(
      (x) => x.productId !== existItem.productId);
   }else{
    // reduce qty by 1
    (cart.items as CartItem[]).find((x) => x.productId === productId)!.qty = existItem.qty - 1;
   }
  // Update cart in database
   await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: cart.items,
          ...calcPrice(cart.items as CartItem[]),
        },
      });


    revalidatePath(`/product/${product.slug}`);

    return { success: true, message:`${product.name} removed from cart`};
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
  
  