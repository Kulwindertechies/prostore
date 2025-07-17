import { getLatestProduct } from "@/lib/actions/product.actions";
import ProductList from "@/components/shared/product/product-list";
import { Product } from "@/types"; // Assuming this is the correct type

const Homepage = async () => {
  const rawProducts = await getLatestProduct();

  const latestproduct: Product[] = rawProducts.map((p) => ({
    ...p,
    price: p.price.toString(),   // ✅ convert Decimal to string
    rating: p.rating.toString(), // ✅ convert Decimal to string
  }));

  return (
    <ProductList
      data={latestproduct}
      title="Featured Products"
      limit={6}
    />
  );
};

export default Homepage;
