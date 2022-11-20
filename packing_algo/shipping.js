import moment from "moment";

function updateOrderLines (orderInfo, formInput, box, time) {
  for (var i = 0; i < orderInfo.OrderLines.length; i++) {
    var info = {
      DateShipped: time,
      CarrierCode: orderInfo.ShipmentInfos[0].CarrierCode ? orderInfo.ShipmentInfos[0].CarrierCode : formInput.carrier,
      ClassCode: orderInfo.ShipmentInfos[0].ClassCode,
      TrackingNumber: formInput.trackingNumber,
      Qty: orderInfo.OrderLines[i].Quantity,
      ContainerType: "Box",
      Height: box[0],
      Width: box[1],
      Length: box[2],
      DimensionUnit: "IN",
      Weight: 0.0,
      WeightUnit: "LB"
    }
    orderInfo.OrderLines[i].ShipmentInfos = [info];
  }
  return orderInfo.OrderLines
}


export function createShipment (orderInfo, formInput, box) {
    var time = moment().format("YYYY-MM-DD[T]HH:mm:ss");
    var body =
    {
      ShipFromAddress: {
        CompanyName: formInput.name,
        Address1: formInput.address,
        Address2: "",
        City: formInput.city,
        State: formInput.state,
        Country: formInput.country,
        Zip: formInput.zip.toString(),
        Phone: formInput.phone.toString(),
      },
      ExpectedDeliveryDate: formInput.expectedDelivery,
      BillofLading: formInput.bol ? formInput.bol : "",
      PRONumber: formInput.pro ? formInput.pro : "",
      ShipmentNumber: orderInfo.Identifier.SourceKey,
      ShipmentLines: updateOrderLines(orderInfo, formInput, box, time),
      Identifier: orderInfo.Identifier,
      OrderNumber: orderInfo.OrderNumber,
      VendorNumber: orderInfo.VendorNumber ? orderInfo.VendorNumber : "",
      PartnerPO: orderInfo.PartnerPO,
      OrderDate: orderInfo.OrderDate,
      PaymentTerm: orderInfo.PaymentTerm,
      ShipmentInfos: [
        {
          DateShipped: time,
          TrackingNumber: formInput.trackingNumber,
          ContainerType: "Box",
          Height: box[0],
          Width: box[1],
          Length: box[2],
          DimensionUnit: "IN",
          Weight: 0.0,
          WeightUnit: "LB"
        }
      ],
      ShipToAddress: orderInfo.ShipToAddress,
      BillToAddress: orderInfo.BillToAddress,
      OrderedByAddress: orderInfo.OrderedByAddress,
      ExtendedAttributes: orderInfo.ExtendedAttributes,
      TotalAmount: orderInfo.TotalAmount,
      StatusCode: orderInfo.StatusCode,
      HandlingAmount: orderInfo.HandlingAmount,
      Note: orderInfo.Note,
      SenderCompanyId: orderInfo.ReceiverCompanyId,
      ReceiverCompanyId: orderInfo.SenderCompanyId
    };
    console.log("TEST TEST TEST TEST\n\n", body);
    return body;
}
