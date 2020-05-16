import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const loadedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:CartProducts',
      );

      if (loadedProducts) {
        setProducts(JSON.parse(loadedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productsToSave = products.map(product => {
        const newProduct = product;
        if (newProduct.id === id) newProduct.quantity += 1;
        return newProduct;
      });

      setProducts(productsToSave);

      await AsyncStorage.setItem(
        '@GoMarketplace:CartProducts',
        JSON.stringify(productsToSave),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productFinded = products.find(productToFind => {
        return productToFind.id === product.id;
      });

      if (productFinded) {
        increment(productFinded.id);
      } else {
        const productsToSave = [
          ...products,
          {
            ...product,
            quantity: 1,
          },
        ];

        setProducts(productsToSave);

        await AsyncStorage.setItem(
          '@GoMarketplace:CartProducts',
          JSON.stringify(productsToSave),
        );
      }
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const productsToSave = products
        .map(product => {
          const newProduct = product;

          if (newProduct.id === id) newProduct.quantity -= 1;

          return newProduct;
        })
        .filter(product => {
          return product.quantity > 0;
        });

      setProducts(productsToSave);

      await AsyncStorage.setItem(
        '@GoMarketplace:CartProducts',
        JSON.stringify(productsToSave),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
