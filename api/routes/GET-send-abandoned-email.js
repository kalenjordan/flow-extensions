const route = async ({ request, reply, api, logger, connections }) => {
  try {
    return await _routeHandler({ request, reply, api, logger, connections });
  } catch (error) {
    logger.error({ error }, "Error");
    return { error: error.message, status: 400 };
  }
};

async function _routeHandler({ request, api, logger, connections }) {
  return { message: "You must POST to this url, young grasshopper", success: true };
}

export default route;
