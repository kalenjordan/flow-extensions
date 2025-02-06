#!/bin/bash

curl -X POST \
  'https://flow-extensions--development.gadget.app/webhook-trigger/0745705960d0ad4b727a890a78b4c52af9648668f03c58309e3cde1703007b77' \
  -H 'Content-Type: application/json' \
  -d '{
    "productId": "7570647122106",
    "tag": "test from webhook"
  }'
