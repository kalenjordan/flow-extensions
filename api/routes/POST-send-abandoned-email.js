import FETCH_ABANDONMENT_QUERY from "../queries/fetchAbandonment.js";

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

  let email = abandonment.customer.email;
  let klaviyoProperties = mapAbandonmentToKlaviyoProperties(abandonment, checkoutLinksTemplate);
  let result = await postToKlaviyo(shop.klaviyoApiKey, klaviyoProperties, email);

  return result;
}

function mapAbandonmentToKlaviyoProperties(abandonment, checkoutLinksTemplate) {
  let payload = {
    checkout_links_template: checkoutLinksTemplate,
    $value: abandonment.abandonedCheckoutPayload.totalPriceSet?.presentmentMoney?.amount || 0.00,
    Items: abandonment.productsAddedToCart.nodes.map((node) => node.product.title),
    "Item Count": abandonment.productsAddedToCart.nodes.length,
    "Customer Locale": abandonment.customer?.locale || "en-US",
    "Discount Codes": abandonment.abandonedCheckoutPayload.discountCodes,
    "Total Discounts": abandonment.abandonedCheckoutPayload.totalDiscountSet?.shopMoney?.amount || 0.00,
    extra: {
      checkout_url: abandonment.abandonedCheckoutPayload.checkoutUrl,
      presentment_currency: abandonment.abandonedCheckoutPayload.totalPriceSet.presentmentMoney.currencyCode,
      note_attributes: [],
      line_items: abandonment.productsAddedToCart.nodes.map((node) => ({
        quantity: node.quantity,
        sku: node.variant?.sku || "",
        title: node.product.title,
        line_price: node.variant?.price || 0.00,
        price: node.variant?.price || 0.00,
        product: {
          title: node.product.title,
          tags: node.product.tags,
          body_html: node.product.body_html,
          images: node.product.images,
          variant: {
            sku: node.variant?.sku || "",
            title: node.variant?.title || "",
            options: node.variant?.selectedOptions || [],
            images: node.variant?.images || [],
          },
        },
      })),
    },
  };

  return payload;
}

async function fetchAbandonment(shopify, abandonmentId) {
  let query = FETCH_ABANDONMENT_QUERY.replace("$abandonmentId", abandonmentId);

  let response = await shopify.graphql(query);
  if (!response?.abandonment?.id) {
    throw new Error("Abandonment not found for id: " + abandonmentId);
  }

  return response.abandonment;
}

async function postToKlaviyo(klaviyoApiKey, klaviyoProperties, email) {
  const klaviyoEndpoint = "https://a.klaviyo.com/api/events";

  let klaviyoPayload = {
    data: {
      type: "event",
      attributes: {
        properties: klaviyoProperties,
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
              email: email,
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

  log.info({ klaviyoProperties, klaviyoPayload }, "Klaviyo - POST to Klaviyo endpoint: " + klaviyoEndpoint);
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
