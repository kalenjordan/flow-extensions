#!/bin/bash

curl -X POST \
  'https://flow-extensions--development.gadget.app/send-abandoned-email' \
  -H 'Content-Type: application/json' \
  -d '{
    "shop_id": 52529004730,
    "properties": {
      "checkout_links_template": "12345",
      "customer_id": "gid://shopify/Customer/7085965639866"
    }
  }'
