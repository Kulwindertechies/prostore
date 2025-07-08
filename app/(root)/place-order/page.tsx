import { auth } from "@/auth";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { shippingAddress } from "@/types";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import CheckoutSteps from "@/components/shared/checkout-steps";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: 'Place Order'
}

const PlaceOrderPage = async () => {
   const cart = await getMyCart();
   const session = await auth();
   const userId = session?.user?.id;

   if (!userId) throw new Error ('user not found');

   const user = await getUserById(userId);

   if(!cart || cart.items.length === 0) redirect('/cart');
   if(!user.address) redirect('/shipping-address');
   if(!user.paymentMethod) redirect('/payment-method');

   const userAddress = user.address as shippingAddress;

    return ( <>
    <CheckoutSteps current={3} />
    <h1 className="py-2 text-2xl">Place Order</h1>
    <div className="grid md:grid-cols-3 md:gap-5">
        <div className="md:col-span-2 overflow-x-auto-space-y-4">
            <Card>
                <CardContent className="p-4 gap-4">
                    <h2 className="text-xl pb-4">Shipping Address</h2>
                    <p>{userAddress.fullName}</p>
                    <p>
                        {userAddress.streetAddress}, {userAddress.city} {' '}
                        {userAddress.postalCode}, {userAddress.country} {' '}
                    </p>
                    <div className="mt-3">
                        <Link href="/shipping-address">
                        <Button variant='outline'>Edit</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
    </> );
}  
 
export default PlaceOrderPage;