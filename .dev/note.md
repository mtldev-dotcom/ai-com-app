Query Parameters
fields
string
optional
Comma-separated fields that should be included in the returned data. if a field is prefixed with + it will be added to the default fields, using - will remove it from the default fields. without prefix it will replace the entire default fields.

Related guide: Read More
Request Body
application/json
title
string
optional
The product's title.

subtitle
string
optional
The product's subtitle.

description
string
optional
The product's description.

is_giftcard
boolean
optional
Whether the product is a gift card.

discountable
boolean
optional
Whether the product is discountable.

images
Array of objects
optional
The product's images.

thumbnail
string
optional
The URL of the product's thumbnail.

handle
string
optional
The product's handle.

status
string
optional
Enum: "draft", "proposed", "published", "rejected"
The product's status.

type_id
string
optional
The ID of the type the product belongs to.

collection_id
string
optional
The ID of the collection the product belongs to.

categories
Array of objects
optional
The categories the product belongs to.

id
string
The category's ID.

tags
Array of objects
optional
The product's tags.

id
string
The tag's ID.

options
Array of objects
optional
The product's options.

title
string
The product option's title.

values
Array of strings
The product option's values.

variants
Array of objects
optional
The product's variants.

title
string
The variant's title.

prices
Array of objects
The variant's prices.

currency_code
string
The price's currency code.

amount
number
The price's amount.

min_quantity
number
optional
The minimum quantity that must be available in the cart for this price to apply.

max_quantity
number
optional
The maximum quantity that must not be surpassed in the cart for this price to apply.

rules
object
optional
Example: {"region_id":"reg_123"}
The price's rules.

region_id
string
The ID of a region.

sku
string
optional
The variant's SKU.

ean
string
optional
The variant's EAN.

upc
string
optional
The variant's UPC.

barcode
string
optional
The variant's barcode.

hs_code
string
optional
The variant's HS code.

mid_code
string
optional
The variant's MID code.

allow_backorder
boolean
optional
Whether it's allowed to order this variant when it's out of stock.

manage_inventory
boolean
optional
Whether Medusa manages the variant's inventory quantity. If disabled, the product variant is always considered in stock.

variant_rank
number
optional
The sorting order of the variant among other variants in the product.

weight
number
optional
The variant's weight.

length
number
optional
The variant's length.

height
number
optional
The variant's height.

width
number
optional
The variant's width.

origin_country
string
optional
The variant's origin country.

material
string
optional
The variant's material.

metadata
object
optional
The variant's metadata, used to store custom key-value pairs.

Related guide: Learn how to manage metadata
options
object
optional
Example: {"Color":"Black"}
The variant's options, where the key is an option's name, and the value is the option's value.

inventory_items
Array of objects
optional
The variant's inventory items to create.

inventory_item_id
string
The inventory item's ID.

required_quantity
number
optional
The number of units a single quantity is equivalent to. For example, if a customer orders one quantity of the variant, Medusa checks the availability of the quantity multiplied by the value set for required_quantity. When the customer orders the quantity, Medusa reserves the ordered quantity multiplied by the value set for required_quantity.

sales_channels
Array of objects
optional
The sales channels the product is available in.

id
string
The sales channel's ID.

weight
number
optional
The product's weight.

length
number
optional
The product's length.

height
number
optional
The product's height.

width
number
optional
The product's width.

hs_code
string
optional
The product's HS code.

mid_code
string
optional
The product's MID code.

origin_country
string
optional
The product's origin country.

material
string
optional
The product's material.

metadata
object
optional
The product's metadata, used to store custom key-value pairs.

Related guide: Learn how to manage metadata
external_id
string
optional
The ID of the product in an external or third-party system.

shipping_profile_id
string
optional
The ID of the product's shipping profile.

additional_data
object
optional
Pass additional custom data to the API route. This data is passed to the underlying workflow under the additional_data parameter