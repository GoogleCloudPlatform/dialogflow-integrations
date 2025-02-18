# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# The original author of this file is unreachable, and there is no
# test-case for this file, hence it is not feasible to lint this file
# pylint: skip-file

"""Google Cloud Function to return JSON or HTML from search response

This sample uses the Retail API with client libraries

This can be used for doing AJAX/client side calls to get search results
and render in a div.

Configure the GCF to use a service account which has Retail Editor Role
"""

import datetime
import datetime
import os
import random
import tomllib
import uuid

import firebase_admin
from firebase_functions import https_fn
import flask
from google.api_core.gapic_v1 import client_info
import google.auth
from google.cloud import firestore
from google.cloud import retail_v2
from google.protobuf import json_format


timedelta = datetime.timedelta
datetime = datetime.datetime
ClientInfo = client_info.ClientInfo
initialize_app = firebase_admin.initialize_app
request = flask.request
MessageToDict = json_format.MessageToDict


# User-Agent: cloud-solutions/conversational-commerce-agent-v0.0.1
TOML_PATH = os.getenv("CONFIG_TOML_PATH", "config.toml")
with open(TOML_PATH, "rb") as f:
  config = tomllib.load(f)


initialize_app()
app = flask.Flask(__name__)


# Create a client to interact with Firestore
db = firestore.Client(
    project=config["gcp"]["project_id"],
    database=config["gcp"]["apparel_firebase_db"],
)

# GCP Project Number
PROJECT_NUMBER = config["gcp"]["project_number"]

# Retail API auth scopes
credentials, project = google.auth.default(
    scopes=["https://www.googleapis.com/auth/cloud-platform"],
    quota_project_id=config["gcp"]["project_id"],
)
auth_req = google.auth.transport.requests.Request()

client = retail_v2.SearchServiceClient(
    credentials=credentials,
    client_info=ClientInfo(
        "cloud-solutions/conversational-shopping-agent-v0.0.1"
    ),
)

predict_client = retail_v2.PredictionServiceClient(credentials=credentials)
product_client = retail_v2.ProductServiceClient(credentials=credentials)

product_name = (
    "projects/"
    + PROJECT_NUMBER
    + "/locations/global/catalogs/default_catalog/branches/1/products/"
)

# For now for demo purposes we are just returning the same example reviews regardless of the product.
REVIEWS = [
    {
        "product_id": "",
        "user": "Briene Sanje",
        "rating": 3,
        "desc": (
            "the ${title} fit real well at first, I suppose. However after a"
            " few hours into the night               I started to wish I had"
            " gone up a size or two. Every couple minutes I had to             "
            "  re-adjust. It wasn't a cute look on the dance floor haha. Wish I"
            " had               size up, otherwise I've no other regrets."
        ),
        "title": "",
    },
    {
        "product_id": "",
        "user": "Jenny Rahme",
        "rating": 5,
        "desc": (
            "As a first-time buyer, I must say, I am head over heels in love"
            " with my               purchase! The moment I delicately wear the"
            " ${title}, I felt an instant               connection, as if it"
            " was meant to be.               What impressed me the most was the"
            " comfort it provded throughout the day."
        ),
        "title": "",
    },
    {
        "product_id": "",
        "user": "Nadine Bhakta",
        "rating": 4,
        "desc": (
            "I recently had the pleasure of wearing the most enchanting"
            " ${title}               for a special occasion, and let me tell"
            " you, heads turned and compliments poured               in all"
            " night long!               The fit was mostly great."
        ),
        "title": "",
    },
    {
        "product_id": "",
        "user": "Anjali Gupta",
        "rating": 5,
        "desc": (
            "I recently purchased the ${title} from this store, and I must say,"
            " it's               absolutely stunning! The quality is premium,"
            " and the work is a testament to the remarkable craftsmanship.     "
            "          The product is beautiful, and the rich color hasn't"
            " faded a bit even after a few wears."
        ),
        "title": "",
    },
]

# This acts as a simple "database" for demonstration purposes
user_info = {
    "delivery_address": "638 Maple Street, Apt 11, Cupertino, CA 95014",
    "payment_info": "**********4111",
    "contact_number": "416-555-6704",
    "email": "poetry_reader456@gmail.com",
}


@app.post("/search")
def search():
  """returns products based on a search query from product catalog."""
  app.logger.warning("REACHED /SEARCH")
  request_json = request.get_json(silent=False)
  app.logger.warning("REQUEST: %s", request_json)

  # Capture the user's search query.
  query = request_json["search"]
  start_index = request_json[
      "offset"
  ]  # index number from which the products should be returned

  session_id = str(uuid.uuid4())
  visitorid = session_id
  placement = (  # A search model name which was configured while creating product catalog
      "default_search"
  )

  # Retail API search request
  search_request = {
      "placement": (
          "projects/"
          + PROJECT_NUMBER
          + "/locations/global/catalogs/default_catalog/placements/"
          + placement
      ),
      "query": query,
      "visitor_id": visitorid,
      "query_expansion_spec": {"condition": "AUTO"},
  }
  try:
    # Retail Search API call
    response = client.search(search_request)
    res = MessageToDict(response._pb)
    app.logger.warning("RAW RESULT: %s", res["results"])

    # extract products based on the offset index from the returned products
    if start_index > len(res["results"]) - 1:
      return flask.jsonify({"message": "No more products available to show"})

    num_products = 3  # number of products to display in the UI
    end_index = start_index + num_products
    end_index = (
        end_index if len(res["results"]) > end_index else len(res["results"])
    )
    products = res["results"][start_index:end_index]

    # remove unnecessary fields from product's data
    data = get_minimal_payload(products)
    app.logger.warning("RESULT: %s", data)

    # Transform the product's data into a customer template format to display in the UI
    response = generate_custom_template(data)

    return flask.jsonify(response)
  except Exception as e:
    app.logger.warning("Retail Search Exception: %s", e)
    return flask.jsonify({})


@app.post("/get_product_details")
def get_product_details():
  """Fetch products details to answer customer's queries related to products."""
  app.logger.warning("REACHED /GET_PRODUCT_DETAILS")
  request_json = request.get_json(silent=False)
  app.logger.warning("REQUEST: %s", request_json)

  product_ids = list(set(request_json["product_ids"]))
  app.logger.warning("PRODUCT_IDS: %s", product_ids)

  data = []
  for product_id in product_ids:
    # Retail API call
    product = product_client.get_product(name=product_name + product_id)
    product.retrievable_fields = None
    res = MessageToDict(product._pb)
    obj = {"product": res}
    data.append(obj)

  app.logger.warning("RAW RESULT: %s", data)

  # Keep only necessary fields from product's data
  product_details = get_minimal_payload(data)
  app.logger.warning("PRODUCTS: %s", product_details)

  return flask.jsonify({"products": product_details})


@app.post("/similar")
def similar():
  """Find similar products using Retail Recommendation API."""
  app.logger.warning("REACHED /SIMILAR")
  request_json = request.get_json(silent=False)
  app.logger.warning("REQUEST: %s", request_json)

  product_id = request_json["product_id"]

  page_size = 2
  placement = (  # A recommendation model created during product catalog creation.
      "similar-item"
  )

  user_event = {
      "event_type": "detail-page-view",
      "visitor_id": str(uuid.uuid4()),
      "product_details": [{"product": {"id": product_id}}],
  }

  # Retail Recommendation API request
  predict_request = {
      "placement": (
          "projects/"
          + PROJECT_NUMBER
          + "/locations/global/catalogs/default_catalog/servingConfigs/"
          + placement
      ),
      "user_event": user_event,
      "page_size": page_size,
      "filter": "filterOutOfStockItems",
      "params": {"returnProduct": True, "returnScore": True},
  }

  try:
    # Retail Recommendation API call
    response = predict_client.predict(predict_request)
    res = MessageToDict(response._pb)
    app.logger.warning("RAW RESPONSE: %s", res)
    app.logger.warning("RAW RESULT: %s", res["results"])
    data = res["results"]

    # Remove unnecessary 'metadata' parent nodes to normalize output between /search and /similar results.
    for i in range(len(data)):
      data[i] = data[i]["metadata"]
    data = get_minimal_payload(data)
    app.logger.warning("RESULT: %s", data)

    if len(data) > 0:
      # Transform product's data into custom template format to display in UI
      response = generate_custom_template(data)
    else:
      response = {}

    return flask.jsonify(response)
  except Exception as e:
    app.logger.warning("Retail Search Exception: %s", e)
    return flask.jsonify({})


@app.post("/get_reviews")
def get_reviews():
  """retrieve product's reviews (Currently using DUMMY reviews)"""
  app.logger.warning("REACHED /GET_REVIEWS")
  request_json = request.get_json(silent=False)
  app.logger.warning("REQUEST: %s", request_json)

  # Eventually this should look up reviews based on the product ID provided.
  shown_products = request_json["shown_products"]
  reviews_per_product = len(REVIEWS) // len(shown_products)
  app.logger.warning("reviews_per_product: %s", reviews_per_product)

  # splitting the reviews for the shown products
  reviews = []
  for idx, product in enumerate(shown_products):
    for r in REVIEWS[
        idx * reviews_per_product : (idx + 1) * reviews_per_product
    ]:
      review = r.copy()
      review["product_id"] = product["id"]
      review["title"] = product["title"]
      review["desc"] = review["desc"].replace("${title}", product["title"])

      reviews.append(review)

  app.logger.warning("REVIEWS: %s", reviews)

  # Transforming reviews into a customer template format to display in UI
  response = generate_custom_template(reviews, template="review-template")
  response["reviews"] = reviews
  return flask.jsonify(response)


@app.post("/get_delivery_date")
def get_delivery_date():
  """Get the estimated delivery date"""
  app.logger.warning("REACHED /GET_DELIVERY_DATE")
  request_json = request.get_json(silent=False)
  app.logger.warning("REQUEST: %s", request_json)

  shopping_cart = request_json["shopping_cart"]
  app.logger.warning("SHOPPING CART: %s", shopping_cart)

  # set estimated delivery date between next 3 to 7 days
  dt = datetime.now()
  td = timedelta(days=random.randint(3, 7))
  # your calculated date
  est_delivery_date = dt + td

  cart_with_delivery_dates = []
  for item in shopping_cart:
    new_item = item
    new_item["delivery_date"] = datetime.strftime(
        est_delivery_date, "%B %d, %Y"
    )
    new_item["earliest_delivery_date"] = datetime.strftime(
        est_delivery_date, "%B %d, %Y"
    )
    cart_with_delivery_dates.append(new_item)

  app.logger.warning("CART WITH DELIVERY DATES: %s", cart_with_delivery_dates)

  return flask.jsonify({"shopping_cart": cart_with_delivery_dates})


@app.post("/store_delivery_date")
def store_delivery_date():
  """Store the user's preferred delivery date (should be in future than the earliest estimated delivery date)"""
  app.logger.warning("REACHED /STORE_DELIVERY_DATE")
  request_json = request.get_json(silent=False)
  app.logger.warning("REQUEST: %s", request_json)

  shopping_cart = request_json["shopping_cart"]
  preferred_delivery_dates = request_json["preferred_delivery_date"]
  app.logger.warning("SHOPPING CART: %s", shopping_cart)
  app.logger.warning("PREFERRED DELIVERY DATES: %s", preferred_delivery_dates)

  if preferred_delivery_dates:
    for item in preferred_delivery_dates:
      app.logger.warning("PREFERRED DELIVERY DATE ITEM: %s", item)
      if item and item["id"] and item["preferred_delivery_date"]:
        # copy product by value
        product = (
            list(filter(lambda x: x["id"] == item["id"], shopping_cart))
        )[0]
        product_index = shopping_cart.index(product)
        # copy product by reference
        product = shopping_cart[product_index]

        # verify the preferred delivery date is in the future from the earliest delivery date
        if datetime.strptime(
            item["preferred_delivery_date"], "%B %d, %Y"
        ) >= datetime.strptime(product["earliest_delivery_date"], "%B %d, %Y"):
          # updating product delivery date in the shopping cart
          product["delivery_date"] = item["preferred_delivery_date"]

          # modification in preferred_delivery_dates object
          item["reason"] = (
              "The delivery date for the "
              + product["title"]
              + " has been changed to "
              + product["delivery_date"]
          )
          item["status"] = "success"
        else:
          # modification in preferred_delivery_dates object
          item["reason"] = (
              "The preferred delivery date ("
              + item["preferred_delivery_date"]
              + ") is before the earliest delivery date ("
              + product["earliest_delivery_date"]
              + ") for the "
              + product["title"]
          )
          item["status"] = "fail"

  app.logger.warning(
      "DELIVERY DATES CHANGE STATUS: %s", preferred_delivery_dates
  )

  return flask.jsonify({
      "shopping_cart": shopping_cart,
      "preferred_delivery_date": preferred_delivery_dates,
  })


@app.route("/place_order", methods=["POST"])
def place_order():
  """Place the order for the shopping cart items"""
  app.logger.warning("REACHED /PLACE_ORDER")
  request_json = request.get_json(silent=True)
  app.logger.warning("REQUEST: %s", request_json)

  products = request_json.get("products", [])
  app.logger.warning("SHOPPING CART PRODUCTS: %s", products)

  if not products:
    app.logger.warning("EMPTY CART: %s", products)
    return flask.jsonify(
        {"order_status": "not_placed", "reason": "Shopping cart is empty!"}
    )

  order_id = uuid.uuid4().hex[:8]
  order_created_on = datetime.utcnow().isoformat() + "Z"

  # Eventually this response should be returned from an API after successful order placement
  order_data = {
      "order_id": order_id,
      "order_status": "confirmed",
      "order_created_on": order_created_on,
      "products": products,
  }

  try:
    # store the order data in firestore
    db.collection("orders").document(order_id).set(order_data)
    app.logger.warning("ORDER PLACED: %s", order_data)
    return flask.jsonify(order_data)
  except Exception as e:
    app.logger.warning("PLACE ORDER EXCEPTION: %s", e)
    return flask.jsonify(
        {"order_status": "not_placed", "reason": "Internal Server Error!"}
    )


@app.route("/get_user_info", methods=["GET"])
def get_user_info():
  """Fetch user's personal info.

  NOTE: currently using DUMMY user info. In an actual app, this should be coming
  from user's account.
  """
  app.logger.warning("REACHED /USER_INFO")
  request_json = request.get_json(silent=True)
  app.logger.warning("REQUEST: %s", request_json)

  return flask.jsonify(user_info)


@app.route("/update_user_info", methods=["POST"])
def update_user_info():
  """Update user's info

  NOTE: Currently updating in the DUMMY user info, but in an actual app, this
  should be updated in user's account.
  """
  try:
    # Parse the incoming data
    incoming_data = request.get_json()

    # Update the user_info object with new data when its provided
    user_info["delivery_address"] = incoming_data.get(
        "delivery_address", user_info["delivery_address"]
    )
    user_info["payment_info"] = encrypt_payment_info(
        str(incoming_data.get("payment_info", user_info["payment_info"]))
    )
    user_info["contact_number"] = str(
        incoming_data.get("contact_number", user_info["contact_number"])
    )
    user_info["email"] = incoming_data.get("email", user_info["email"])

    # Respond with updated user information
    return flask.jsonify({
        "message": "User information updated successfully.",
        "user_info": user_info,
    })
  except Exception as e:
    app.logger.warning("USER INFO UPDATE EXCEPTION: %s", e)
    return flask.jsonify(
        {"message": "User information did not update successfully."}
    )


def encrypt_payment_info(payment_info):
  return "*" * 12 + payment_info[-4:]


@app.get("/no_op")
def no_op():
  """Healthcheck endpoint"""
  app.logger.warning("REACHED /NO_OP")
  return flask.jsonify(True)


def get_minimal_payload(resp_json):
  """Returns necessary fields from product's data"""
  results = []
  for item in resp_json:
    output = {"product": {}}
    if "id" in item:
      output["product"]["id"] = item["id"]
    else:
      output["product"]["id"] = item["product"]["id"]
    output["product"]["title"] = item["product"]["title"]
    output["product"]["name"] = item["product"]["name"]
    output["product"]["priceInfo"] = item["product"]["priceInfo"]
    output["product"]["images"] = [item["product"]["images"][0]]
    output["product"]["description"] = item["product"]["description"]
    results.append(output)

  return results


def generate_custom_template(payload, template="retail-template"):
  """This works to return a custom template payload successfully in Playbook -> Tools -> Cloud function.

  Parameters:
    payload: The data being returned
    template: The Custom template for DF Messenger to use to render the rich
    content. Default is retail-template.
  Returns:
    response: The response object which contains custom template payload under
    "payload" field.
  """

  return {
      "payload": {
          "richContent": [[{
              "type": "custom_template",
              "name": template,
              "payload": {"items": payload},
          }]]
      }
  }


@https_fn.on_request()
def main(req: https_fn.Request) -> https_fn.Response:
  credentials.refresh(auth_req)
  with app.request_context(req.environ):
    return app.full_dispatch_request()