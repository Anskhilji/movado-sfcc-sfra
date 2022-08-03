"use strict";

/* #region OCIPayload */
// Class that carries the data for OCI Inventory Update Payload
function OCIPayload() {
    this.records = new Array();
}
/* #endregion */

/* #region OCIRecord */
// Class that represents and OCI Inventory Record
function OCIRecord(sku, location, id, effectiveDate, onHand) {
    this.sku = sku;
    this.location = location;
    this.id = id;
    this.externalRefId = sku;
    this.futureStock = new Array();
    this.effectiveDate = effectiveDate;
    this.onHand = onHand;
    this.safetyStockCount = 0;
}
/* #endregion */

/* #region OCIFutureStock */
// Class that carries OCI Future Stock details
function OCIFutureStock(expectedDate, quantity) {
    this.expectedDate = expectedDate;
    this.quantity = quantity;
}
/* #endregion */

/* Exports of functions */
exports.OCIPayload = OCIPayload;
exports.OCIRecord = OCIRecord;
exports.OCIFutureStock = OCIFutureStock;
