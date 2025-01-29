const FETCH_ABANDONMENT_QUERY = `#graphql
  {
    abandonment(id: "$abandonmentId") {
      id
      abandonedCheckoutPayload {
        discountCodes
        totalDiscountSet {
          presentmentMoney {
            amount
          }
        }
        totalPriceSet {
          presentmentMoney {
            amount
            currencyCode
          }
        }
      }
      customer {
        email
        firstName
        lastName
        locale
      }
      productsAddedToCart(first: 20) {
        nodes {
          quantity
          product {
            tags
            title
            media(first: 10) {
              nodes {
                id
                ... on MediaImage {
                  image {
                    url
                  }
                }
              }
            }
          }
          variant {
            sku
            title
            price
            selectedOptions {
              name
              value
            }
            media(first: 10) {
              nodes {
                id
                ... on MediaImage {
                  image {
                    url
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export default FETCH_ABANDONMENT_QUERY;
