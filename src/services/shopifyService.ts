
const MYSHOPIFY_DOMAIN = 'cjka9h-aw.myshopify.com';
const CUSTOM_DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN || 'ahstore.shop';
const STOREFRONT_ACCESS_TOKEN = import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN || '30adfdf1a4e52d1d1edce6a09bafa154';

// Use CUSTOM_DOMAIN if it contains 'myshopify.com', otherwise fallback to internal domain
const domainToUse = CUSTOM_DOMAIN.includes('myshopify.com') ? CUSTOM_DOMAIN : MYSHOPIFY_DOMAIN;
const API_ENDPOINT = `https://${domainToUse}/api/2024-04/graphql.json`;

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  images: {
    edges: Array<{
      node: {
        url: string;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        id: string;
        price: {
          amount: string;
          currencyCode: string;
        };
      };
    }>;
  };
}

export async function fetchShopifyProducts(): Promise<ShopifyProduct[]> {
  const query = `
  {
    products(first: 20) {
      edges {
        node {
          id
          title
          description
          images(first: 5) {
            edges {
              node {
                url
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }`;

  console.log('Fetching products from Shopify...', API_ENDPOINT);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Shopify Response Error:', response.status, errorText);
      return [];
    }

    const json = await response.json();
    
    if (json.errors) {
      console.error('Shopify GraphQL Errors:', json.errors);
      return [];
    }

    const products = json.data.products.edges.map((edge: any) => edge.node);
    console.log(`Successfully fetched ${products.length} products from Shopify`);
    return products;
  } catch (error) {
    console.error('Failed to fetch Shopify products:', error);
    return [];
  }
}

export async function createShopifyCheckout(lineItems: Array<{ variantId: string, quantity: number }>): Promise<string | null> {
  const query = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          webUrl
        }
        checkoutUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      lineItems
    }
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await response.json();
    if (json.data?.checkoutCreate?.checkout?.webUrl) {
      return json.data.checkoutCreate.checkout.webUrl;
    }
    console.error('Checkout creation failed:', json.data?.checkoutCreate?.checkoutUserErrors);
    return null;
  } catch (error) {
    console.error('Failed to create Shopify checkout:', error);
    return null;
  }
}
