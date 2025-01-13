#!/bin/bash

curl -X POST \
  'https://flow-extensions--development.gadget.app/api/send-abandoned-email' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "cartId": "gid://shopify/Cart/123456789",
    "shopDomain": "test-store.myshopify.com"
  }'
