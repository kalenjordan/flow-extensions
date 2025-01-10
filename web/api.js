// Sets up the API client for interacting with your backend. 
// For your API reference, visit: https://docs.gadget.dev/api/flow-extensions
import { Client } from "@gadget-client/flow-extensions";

export const api = new Client({ environment: window.gadgetConfig.environment });
