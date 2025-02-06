import crypto from 'crypto';
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
  log.info({ postBody: request.body }, "Webhook - POST from flow action");
  let shopWebhookKey = request.params.key;

  let shop = await api.shopifyShop.maybeFindFirst({
    filter: {
      webhookKey: { equals: shopWebhookKey },
    },
  });
  console.log("Webhook trigger: found shop ID from webhook key: ", shopWebhookKey);

  if (!shop) {
    throw new Error("Shop not found for webhook key: " + shopWebhookKey);
  }

  let shopify = await connections.shopify.forShopId(shop.id);
  let payload = {
    payloadJsonString: JSON.stringify(request.body),
  };
  let result = await triggerFlow(shopify, "webhook-trigger", payload);
  log.info({ result }, "Webhook trigger result");

  return { success: true, ...result };
}

export async function triggerFlow(shopify, handle, payload) {
  const result = await shopify.graphql(
    `mutation triggerFlow($payload: JSON!) {
      flowTriggerReceive(handle: "${handle}",
        payload: $payload) {
        userErrors {
          field
          message
        }
      }
    }`,
    {
      payload: payload,
    }
  );

  if (result.flowTriggerReceive.userErrors.length) {
    throw new Error("flowTriggerReceive error: " + JSON.stringify(result.flowTriggerReceive));
  }

  console.log("Successfully triggered flow: ", handle, " with payload: ", payload);

  return result;
}

export default route;
