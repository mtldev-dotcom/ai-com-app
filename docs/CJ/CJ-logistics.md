6 Logistics
1 Logistics
1.1 Freight Calculation (POST)
Freight calculation. Bulk purchase products will have designated shipping methods, while dropshipping products will usually have more options.

URL
https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate

CURL
curl --location --request POST 'https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate' \
                --header 'Content-Type: application/json' \
                --header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
                --data-raw '{
                    "startCountryCode": "US",
                    "endCountryCode": "US",
                    "products": [
                        {
                            "quantity": 2,
                            "vid": "439FC05B-1311-4349-87FA-1E1EF942C418"
                        }
                    ]
                }'
Parameter	Definition	Type	Required	Length	Note
startCountryCode	Country of origin	string	Y	200	
endCountryCode	Country of destination	string	Y	200	
zip	zip	string	N	200	
taxId	tax id	string	N	200	
houseNumber	house number	string	N	200	
iossNumber	ioss number	string	N	200	
quantity	Quantity	int	Y	10	
vid	Variant id	string	Y	200	
Return
success

{
    "code": 200,
    "result": true,
    "message": "Success",
    "data": [
        {
            "logisticAging": "2-5",
            "logisticPrice": 4.71,
            "logisticPriceCn": 30.54,
            "logisticName": "USPS+"
        }
    ],
    "requestId": "0242ad78-eea2-481d-876a-7cf64398f07f"
}
Field	Definition	Type	Length	Note
logisticPrice	Shipping cost in USD	BigDecimal	（18，2）	Unit: $ (USD）
logisticPriceCn	Shipping cost in CNY	BigDecimal	（18，2）	Unit: ¥ (CNY)
logisticAging	Shipping time	string	20	
logisticName	Carrier name	string	20	
taxesFee	taxes fee	BigDecimal	(18, 2)	Unit：$(USD)
clearanceOperationFee	customs clearance fee	BigDecimal	(18, 2)	Unit：$(USD)
totalPostageFee	total postage	BigDecimal	(18, 2)	Unit：$(USD)
error

{
    "code": 1600100, 
    "result": false,
    "message": "Param error",
    "data": null,
    "requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"
}
Field	Definition	Type	Length	Note
code	error code	int	20	Reference error code
result	Whether or not the return is normal	boolean	1	
message	return message	string	200	
data	return data	object		interface data return
requestId	requestId	string	48	Flag request for logging errors
1.2 Freight Calculation Tip(POST)
Freight calculation. Bulk purchase products will have designated shipping methods, while dropshipping products will usually have more options.

URL
https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculateTip

CURL
curl --location --request POST 'https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculateTip' \
                --header 'Content-Type: application/json' \
                --header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \
                --data-raw '{
                    "reqDTOS": [
                        {
                            "srcAreaCode": "CN",
                            "destAreaCode": "US",
                            "length": 0.3,
                            "width": 0.4,
                            "height": 0.5,
                            "volume": 0.06,
                            "totalGoodsAmount":123.2,
                            "productProp": [
                                "COMMON"
                            ],
                            "freightTrialSkuList": [
                                {
                                    "skuQuantity": 1,
                                    "sku": "CJCF104237201AZ"
                                }
                            ],
                            "skuList": [
                                "CJCF104237201AZ"
                            ],
                            "platforms": [
                                "Shopify"
                            ]
                        }
                    ]
                }'
Parameter	Definition	Type	Required	Length	Note
srcAreaCode	Country of origin	string	Y	200	
destAreaCode	Country of destination	string	Y	200	
customerCode	customer code	string	N	200	
zip	zip	string	N	200	
houseNumber	house number	string	N	100	
iossNumber	ioss number	string	N	200	
storageIdList	storage id	string	N	100	
recipientAddress	recipient address	string	N	200	
city	city	string	N	50	
recipientName	recipient name	String	N	200	
skuList	sku list	String[]	Y	200	
town	town	String	N	100	
phone	phone	String	N	50	
wrapWeight	wrap weight,Unit:g	int	Y	200	
volume	Volume,Unit:cm³	BigDecimal	Y	200	
station	station	String	N	200	
platforms	platform	String[]	N	200	
dutyNo	dutyNo	String	N	200	
email	email	String	N	100	
province	province	String	N	100	
recipientAddress1	recipient address1	String	N	200	
uid	uid	String	N	200	
recipientId	recipient id	String	N	200	
recipientAddress2	recipient address2	String	N	200	
amount	amount	BigDecimal	N	50	
productTypes	product type	String[]	N	100	
weight	weight,Unit:g	int	Y	100	
productProp	product prop	String	Y	100	
optionName	option name	String	N	200	
volumeWeight	volume weight,Unit:g	BigDecimal	N	100	
orderType	order type	String	N	100	
totalGoodsAmount	total value of goods	BigDecimal	N	100	
freightTrialSkuList	freight trial sku list	Object[]	Y		
- productCode	product code	String	N	100	
- sku	sku	String	N	100	
- productPropList	Product attributes	String	N	100	
- productTypeList	product type (0: normal goods, 1: service goods, 3: packaged goods, 4: supplier goods, 5: supplier self-delivered goods, 6: virtual goods, 7: pod personalized goods)	String[]	N	100	
- vid	variant id	String	N	100	
- skuQuantity	sku quantity	int	N	50	
- skuWeight	sku weight,Unit:g	BigDecimal	N	100	
- skuVolume	sku volume,Unit:cm³	BigDecimal	N	100	
- combinationType	combination type	int	N	50	
- parentVid	parent variant id	String	N	50	
- unsalable	unsalable	int	N	10	
- tailCostQuantity	tail cost quantity	int	N	10	
- privateDeductionQuantity	private Ddeduction quantity	int	N	10	
Return
success

{
    "code": 200,
    "result": true,
    "message": "Success",
    "data": [
        {
            "arrivalTime": "12-50",
            "discountFee": 4.09,
            "discountFeeCNY": 25.30,
            "volumeWeight": null,
            "option": {
                "arrivalTime": "12-50",
                "cnName": "CJ航空挂号小包",
                "enName": "CJPacket Postal",
                "id": "1564849338719199233"
            },
            "ruleTips": [
                {
                    "expression": "^[\\s\\d\\-（）()+]{6,32}$",
                    "interceptType": "0",
                    "max": null,
                    "min": null,
                    "msgCode": "1001",
                    "msgEn": "Must be a 6-32 digit number (only numbers, symbols and spaces are supported).",
                    "type": "phone"
                }
            ],
            "ruleTipTypes": [
                "phone"
            ],
            "channelId": "1564543005939785730",
            "error": "",
            "errorEn": "",
            "optionId": "1564849338719199233",
            "postage": 3.55,
            "postageCNY": 22.00,
            "priceIncreases": "115",
            "reSort": "62",
            "remoteFee": 0,
            "remoteFeeCNY": 0,
            "tip": "",
            "uid": "",
            "orderId": null,
            "unWeightChargeTarget": null,
            "floatMaxPrice": null,
            "floatMinPrice": null,
            "logisticsParamRespDTO": null,
            "message": "Hi, CJ will not accept any disputes when you choose the shipping method, which is not trackable when orders arrived at some countries, states, or cities.",
            "wrapPostage": 4.09,
            "wrapPostageCNY": 25.30,
            "wrapWeight": 0,
            "stopWords": [],
            "channel": {
                "cnName": "促佳燕文航空挂号小包特货",
                "enName": "燕文航空挂号小包特货",
                "id": "1564543005939785730"
            },
            "cjRespDTO": {
                "postage": "3.55",
                "postageCNY": "22.00",
                "remoteFee": "0.00",
                "remoteFeeCNY": "0"
            },
            "destArea": {
                "cnName": "美国",
                "countryId": "233",
                "enName": "United States of America (the)",
                "id": "233",
                "parentId": null,
                "postCode": "",
                "shortCode": "US"
            },
            "srcArea": {
                "cnName": "中国",
                "countryId": "48",
                "enName": "China",
                "id": "48",
                "parentId": null,
                "postCode": "",
                "shortCode": "CN"
            },
            "dump": false,
            "zonePrice": [],
            "allRuleTips": [
                {
                    "expression": "^[\\s\\d\\-（）()+]{6,32}$",
                    "interceptType": "0",
                    "max": null,
                    "min": null,
                    "msgCode": "1001",
                    "msgEn": "Must be a 6-32 digit number (only numbers, symbols and spaces are supported).",
                    "type": "phone"
                }
            ],
            "taxesFee": null,
            "clearanceOperationFee": null
        }
    ],
    "requestId": "55c4708d15d44a499f061582ddbd989b",
    "success": true
}
Field	Definition	Type	Length	Note
arrivalTime	arrival time	string	200	
discountFee	discount Fee	BigDecimal	（18，2）	Unit: $ (USD）
discountFeeCNY	discount Fee CNY	BigDecimal	（18，2）	
volumeWeight	volume weight	BigDecimal	（18，2）	Unit: $ (USD）
channelId	channel id	String	200	
error	error	String	200	
errorEn	errorEn	String	200	
optionId	option id	String	100	
postage	postage	BigDecimal	（18，2）	Unit: $ (USD）
postageCNY	postage CNY	BigDecimal	（18，2）	Unit: $ (USD）
priceIncreases	price increases	String	100	
reSort	reSort	String	100	
remoteFee	remoteFee	BigDecimal	（18，2）	Unit: $ (USD）
remoteFeeCNY	remoteFee CNY	BigDecimal	（18，2）	Unit: $ (USD）
tip	tip	string	200	
uid	uid	String	200	
orderId	order id	String	100	
unWeightChargeTarget	unWeightChargeTarget	BigDecimal	（18，2）	Unit: $ (USD）
floatMaxPrice	floatMaxPrice	BigDecimal	（18，2）	Unit: $ (USD）
floatMinPrice	floatMinPrice	BigDecimal	（18，2）	Unit: $ (USD）
logisticsParamRespDTO	logisticsParamRespDTO	String	200	
message	message	String	200	
wrapPostage	wrap postage	BigDecimal	（18，2）	Unit: $ (USD）
wrapPostageCNY	wrap postage CNY	BigDecimal	（18，2）	Unit: $ (USD）
wrapWeight	wrap weight	BigDecimal	（18，2）	Unit: $ (USD）
stopWords	stop Words	String	200	
channel	channel	Object		
cnName	name(CN)	String	200	
enName	name(EN)	String	200	
id	id	String	200	
option	option	Object		
arrivalTime	arrival time	String	100	
cnName	name(CN)	String	100	
enName	name(EN)	String	100	
id	id	String	100	
taxesFee	taxes fee	BigDecimal	（18，2）	Unit: $ (USD）
clearanceOperationFee	customs clearance fee	BigDecimal	（18，2）	Unit: $ (USD）
totalPostageFee	total postage	BigDecimal	(18, 2)	Unit：$(USD)
allRuleTips	all rule tips	String	200	
error

{
    "code": 1600100, 
    "result": false,
    "message": "Param error",
    "data": null,
    "requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"
}
Field	Definition	Type	Length	Note
code	error code	int	20	Reference error code
result	Whether or not the return is normal	boolean	1	
message	return message	string	200	
data	return data	object		interface data return
requestId	requestId	string	48	Flag request for logging errors
2 Tracking Number
2.1 Get Tracking Information (GET) Deprecated
Shipping information can be found upon tracking numbers. You can also visit CJ Logistic Platform(opens new window)

Has deprecated on June 1, 2024, Please use the new api Get Tracking Information

URL
https://developers.cjdropshipping.com/api2.0/v1/logistic/getTrackInfo?trackNumber=CJPKL7160102171YQ

CURL
curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/logistic/getTrackInfo?trackNumber=CJPKL7160102171YQ
                                                                                                    &trackNumber=CJPKL7160102171YQ
                                                                                                    &trackNumber=CJPKL7160102171YQ
                                                                                                    &trackNumber=CJPKL7160102171YQ
Parameter	Definition	Type	Required	Length	Note
trackNumber	trackNumber	string	Y	200	batch query
Return
success

{
    "code": 200,
    "result": true,
    "message": "Success",
    "data": [
        {
            "trackingNumber": "CJPKL7160102171YQ",
            "logisticName": "CJPacket Sensitive",
            "trackingFrom": "CN",
            "trackingTo": "US",
            "deliveryDay": "13",
            "deliveryTime": "2021-06-17 07:04:04",
            "trackingStatus": "In transit",
            "lastMileCarrier": "CJPacket",
            "lastTrackNumber": "926112903032124"
        }
    ],
    "requestId": "3426e927-8c50-4687-9ced-623e77d55bd0"
}
Field	Definition	Type	Length	Note
trackingNumber	tracking number	string	200	
trackingFrom	from	string	20	
trackingTo	to	string	20	
deliveryDay	Delivery day	string	200	
deliveryTime	Delivery time	string	200	
trackingStatus	tracking status	string	200	
lastMileCarrier	last mile carrier	string	200	
lastTrackNumber	last mile tracking number	string	200	
error

{
    "code": 1600100,
    "result": false,
    "message": "Param error",
    "data": null,
    "requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1" 
}
Field	Definition	Type	Length	Note
code	error code	int	20	Reference error code
result	Whether or not the return is normal	boolean	1	
message	return message	string	200	
data	return data	object		interface data return
requestId	requestId	string	48	Flag request for logging errors
2.2 Get Tracking Information (GET)
Shipping information can be found upon tracking numbers. You can also visit CJ Logistic Platform(opens new window)

URL
https://developers.cjdropshipping.com/api2.0/v1/logistic/trackInfo?trackNumber=CJPKL7160102171YQ

CURL
curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/logistic/trackInfo?trackNumber=CJPKL7160102171YQ
                                                                                                    &trackNumber=CJPKL7160102171YQ
                                                                                                    &trackNumber=CJPKL7160102171YQ
                                                                                                    &trackNumber=CJPKL7160102171YQ
Parameter	Definition	Type	Required	Length	Note
trackNumber	trackNumber	string	Y	200	batch query
Return
success

{
    "code": 200,
    "result": true,
    "message": "Success",
    "data": [
        {
            "trackingNumber": "CJPKL7160102171YQ",
            "logisticName": "CJPacket Sensitive",
            "trackingFrom": "CN",
            "trackingTo": "US",
            "deliveryDay": "13",
            "deliveryTime": "2021-06-17 07:04:04",
            "trackingStatus": "In transit",
            "lastMileCarrier": "CJPacket",
            "lastTrackNumber": "926112903032124"
        }
    ],
    "requestId": "3426e927-8c50-4687-9ced-623e77d55bd0"
}
Field	Definition	Type	Length	Note
trackingNumber	tracking number	string	200	
trackingFrom	from	string	20	
trackingTo	to	string	20	
deliveryDay	Delivery day	string	200	
deliveryTime	Delivery time	string	200	
trackingStatus	tracking status	string	200	
lastMileCarrier	last mile carrier	string	200	
lastTrackNumber	last mile tracking number	string	200	
error

{
    "code": 1600100,
    "result": false,
    "message": "Param error",
    "data": null,
    "requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1" 
}
Field	Definition	Type	Length	Note
code	error code	int	20	Reference error code
result	Whether or not the return is normal	boolean	1	
message	return message	string	200	
data	return data	object		interface data return
requestId	requestId	string	48	Flag request for logging errors