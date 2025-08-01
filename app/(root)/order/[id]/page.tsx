import { Metadata } from "next";
import { getOrderById } from "@/lib/actions/order-actions";
import {notFound} from "next/navigation";
import OrderDetailsTable from "./order-details-table";
import { ShippingAddress } from "@/types";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: 'Order Details',
  description: 'View your order details',
};
const OrderDetailPage = async (props: {
    params: Promise<{ id: string }>;
}) =>{
const {id} = await props.params;

const order = await getOrderById(id);
if(!order) {
    notFound();
}

const session = await auth();
    return(
        <OrderDetailsTable
         order={{
            ...order,
               orderItems: order.orderitems,
            shippingAddress: order.shippingAddress as ShippingAddress,
        }}
        paypalClientId={process.env.PAYPAL_CLIENT_ID || "sb"}
        isAdmin={session?.user?.role === 'admin' || false}
         />
    );
}
export default OrderDetailPage;