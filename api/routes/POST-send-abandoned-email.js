let log = null;

const route = async ({ request, reply, api, logger, connections }) => {
  try {
    log = logger;
    return await _routeHandler({ request, reply, api, connections });
  } catch (error) {
    logger.error({ error }, "Error");
    return { error: error.message, status: 400 };
  }
};

async function _routeHandler({ request, api, connections }) {
  let postData = request.body;
  let properties = postData.properties;
  let checkoutLinksTemplate = properties.checkout_links_template;

  log.info({ request, properties }, "Klaviyo - POST from flow action");

  let shopId = postData.shop_id;
  let shop = (await api.shopifyShop.findMany({ where: { id: shopId } }))?.[0];
  if (!shop) {
    throw new Error("Shop not found for id: " + shopId);
  }

  const shopify = await connections.shopify.forShopId(shopId);
  let abandonment = await fetchAbandonment(shopify, properties.abandonment_id);
  log.info({ abandonment }, "Klaviyo - Shopify Abandonment: " + abandonment.id);
  if (!abandonment?.customer?.email) {
    throw new Error("No email found for abandonment: " + abandonment.id);
  }

  let result = await postToKlaviyo(shop.klaviyoApiKey, abandonment, checkoutLinksTemplate);

  return result;
}

async function fetchCustomer(shopify, customerId) {
  let query = `#graphql
    {
      customer(id: "${customerId}") {
        id
        email
        firstName
        lastName
      }
    }
  `;

  let response = await shopify.graphql(query);
  return response.customer;
}

async function fetchAbandonment(shopify, abandonmentId) {
  let query = `#graphql
    {
      abandonment(id: "${abandonmentId}") {
        id
        customer {
          email
          firstName
          lastName
        }
        productsAddedToCart(first:20) {
          nodes {
            product {
              title
              vendor
              media(first:10) {
                nodes {
                  id
                  ... on MediaImage {
                    originalSource {
                      fileSize
                      url
                    }
                  }
                }
              }
            }
            variant {
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  `;

  let response = await shopify.graphql(query);
  if (!response?.abandonment?.id) {
    throw new Error("Abandonment not found for id: " + abandonmentId);
  }

  return response.abandonment;
}

async function postToKlaviyo(klaviyoApiKey, abandonment, checkoutLinksTemplate) {
  const klaviyoEndpoint = "https://a.klaviyo.com/api/events";

  let klaviyoPayload = {
    data: {
      type: "event",
      attributes: {
        properties: {
          abandonment: abandonment,
          checkout_links_template: checkoutLinksTemplate,
        },
        metric: {
          data: {
            type: "metric",
            attributes: {
              name: "Checkout Links Shopify Flow Abandoned Cart",
            },
          },
        },
        profile: {
          data: {
            type: "profile",
            attributes: {
              email: abandonment.customer.email,
            },
          },
        },
      },
    },
  };

  // Define the options for the fetch request
  const options = {
    method: "POST",
    headers: {
      accept: "application/vnd.api+json",
      revision: "2025-01-15",
      "content-type": "application/vnd.api+json",
      Authorization: `Klaviyo-API-Key ${klaviyoApiKey}`, // Use the API key variable
    },
    body: JSON.stringify(klaviyoPayload),
  };

  log.info({ klaviyoPayload }, "Klaviyo - POST to Klaviyo endpoint: " + klaviyoEndpoint);
  let response = await fetch(klaviyoEndpoint, options);
  try {
    response = await response.json();
  } catch (error) {
    // Usually when it doesn't return json that means it succeeded - weird.
  }

  if (response.errors) {
    throw new Error("Klaviyo API error: " + response.errors[0].detail);
  }

  log.info("Klaviyo - API response looks good - no json response with errors");
  return { success: true };
}

export default route;
