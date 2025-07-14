import { auth } from "@/auth";
import { getMyCart } from "@/lib/actions/cart.actions";
import { getUserById } from "@/lib/actions/user.actions";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShippingAddress } from "@/types";
import ShippingAddresForm from "./shipping-address-form";
import CheckoutSteps from "@/components/shared/checkout-steps";

export const metadata: Metadata = {
  title: "Shipping Address",
};

const ShippingAddressPage = async () => {
  const cart = await getMyCart();

  // Redirect to cart if empty
  if (!cart || !cart.items || cart.items.length === 0) {
    redirect("/cart");
  }

  const session = await auth();

  // Debug session output
  console.log("🔍 FULL SESSION:", session);

  const userId = session?.user?.id;

  // Fail gracefully if no user ID
  if (!userId) {
    console.error(" No user ID found in session:", session);
    return <div>Error: User not authenticated.</div>;
  }

  const user = await getUserById(userId);

  return (
    <>
    <CheckoutSteps current={1} />
    <ShippingAddresForm address={user.address as ShippingAddress} />
    </>
  );
};

export default ShippingAddressPage;
