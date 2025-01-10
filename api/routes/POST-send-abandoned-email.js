const route = async ({ request, reply, api, logger, connections }) => {
  try {
    return await _routeHandler({ request, reply, api, logger, connections });
  } catch (error) {
    logger.error({ error }, "Error");
    return { error: error.message, status: 400 };
  }
};

async function _routeHandler({ request, api, logger, connections }) {
  let properties = request.body.properties;
  logger.info({ request, properties }, "POST from flow action");
  
  return { success: true };
}

export default route;
