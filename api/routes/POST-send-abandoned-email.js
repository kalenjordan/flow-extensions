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
  log.info({ request, properties }, "POST from flow action");

  let shopId = postData.shop_id;
  // Find the shop using the shopId
  const shop = await api.shopifyShop.findMany({ where: { id: shopId } });
  log.info({ shop }, "Shopify Shop");

  const shopify = await connections.shopify.forShopId(shopId);
  let customer = await fetchCustomer(shopify, properties.customer_id);
  log.info({ customer }, "Shopify Customer");

  await postToKlaviyo(customer);
}

async function fetchCustomer(shopify, customerId) {
  log.info({ customerId }, "Customer ID");
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
  return response;
}

async function postToKlaviyo(postData) {
  const klaviyoEndpoint = 'https://a.klaviyo.com/api/events';
  const apiKey = 'YOUR_KLAVIYO_API_KEY'; // Replace with your actual API key

  // Construct the event data
  const data = {
    type: 'event',
    attributes: {
      properties: {
        newKey: "New Value" // Replace with actual properties
      },
      metric: {
        data: {
          type: "metric"
        }
      },
      profile: {
        data: {
          type: "profile",
          email: properties.email,
          attributes: {
            properties: {
              newKey: "New Value" // Replace with actual properties
            },
            meta: {
              patch_properties: {
                append: {
                  newKey: "New Value" // Replace with actual properties
                },
                unappend: {
                  newKey: "New Value" // Replace with actual properties
                }
              }
            }
          }
        }
      }
    }
  };

  // Define the options for the fetch request
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/vnd.api+json',
      revision: '2025-01-15',
      'content-type': 'application/vnd.api+json',
      Authorization: `Klaviyo-API-Key ${apiKey}` // Use the API key variable
    },
    body: JSON.stringify(data),
  };

  // Post the event to Klaviyo using fetch with the new options
  const response = await fetch(klaviyoEndpoint, options);

  const responseData = await response.json();
  logger.info({ response: responseData }, "Klaviyo API response");

  return { success: true };
}

export default route;
