sap.ui.define([
	"demo/shop/controller/BaseController",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (
	BaseController,
	MessageToast,
	MessageBox
) {
	"use strict";
	return BaseController.extend("demo.shop.controller.Basket", {

		onInit: function () {
			this.getRouter().getRoute("basket").attachPatternMatched(this._onObjectMatched, this);
		},

		_onObjectMatched: function (oEvent) {
			var oBasketModel = this.getView().getModel("basket");
			var sObjectId = oBasketModel.getProperty("/salesOrderId");
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("SalesOrderSet", {
					SalesOrderID: sObjectId
				});
				this.getView().bindElement({
					path: "/" + sObjectPath
				});
			}.bind(this));
		},

		onDeleteFromBasket: function (oEvent) {
			var that = this;
			var oSalesOrderLineItem = oEvent.getParameter("listItem").getBindingContext().getObject();
			var sPath = oEvent.getParameter("listItem").getBindingContext().getPath();

			// Dialog zur Abfrage, ob die Position gelöscht werden soll
			MessageBox.show("Do you want to remove " + oSalesOrderLineItem.ProductID + " from the shopping cart?", {
				title: "Delete Item from Shopping Cart?",
				actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
				onClose: function (oAction) {
					// Abbrechen
					if (oAction !== MessageBox.Action.DELETE) {
						return;
					}
					// Dialog wurde bestätigt
					that._deleteSalesOrderItem(sPath, oSalesOrderLineItem);
				}
			});
		},

		_deleteSalesOrderItem: function (sPath, oSalesOrderLineItem) {
			var oModel = this.getModel();
			var oBasketModel = this.getView().getModel("basket");

			oModel.remove(sPath, {
				success: function () {
					// Preis aktualisieren
					var fPrice = parseFloat(oBasketModel.getProperty("/totalPrice"));
					fPrice = fPrice - parseFloat(oSalesOrderLineItem.NetAmount);
					oBasketModel.setProperty("/totalPrice", fPrice);

					// Items Count aktualisieren
					oBasketModel.setProperty("/itemsCount", oBasketModel.getProperty("/itemsCount") - 1);

					if (oBasketModel.getProperty("/itemsCount") === 0) {
						oBasketModel.setProperty("/hasItems", false);
					}

					// Message zur Bestätigung
					var sMessage = "Produkt " + oSalesOrderLineItem.ProductID + " wurde aus dem Warenkorb entfernt.";
					MessageToast.show(sMessage);
				}
			});
		},

		onProductDetails: function (oEvent) {
			var sProductID = oEvent.getSource().getProperty("text");
			this.getRouter().navTo("object", {
				objectId: sProductID
			});
		},

		onSubmit: function (oEvent) {
			var that = this;
			var oBasketModel = this.getView().getModel("basket");
			var sSalesOrderId = oBasketModel.getProperty("/salesOrderId");
			var oModel = this.getModel();

			oModel.callFunction("/SalesOrder_Confirm", {
				method: "POST",
				urlParameters: {
					SalesOrderID: sSalesOrderId
				},
				context: null,
				success: function () {
					that._showConfirmation(sSalesOrderId);
				}
			});
		},

		_showConfirmation: function (sSalesOrderId) {
			var that = this;
			var sMessage = "Order Number " + sSalesOrderId + " placed successfully.";
			MessageToast.show(sMessage);

			// Dialog mit Bestätigung anzeigen
			MessageBox.show(
				sMessage, {
					title: "Thank you for shopping with us!",
					actions: [MessageBox.Action.OK],
					onClose: function (oAction) {
						// Bei Bestätigung des Dialogs erfolgt die Navigation zur Worklist und ein Reset des Basket Models
						that.getRouter().navTo("worklist");
						that._resetBasketModel();
					}
				}
			);
		},

		_resetBasketModel: function () {
			var oBasketModel = this.getModel("basket");
			oBasketModel.setProperty("/salesOrderId", "");
			oBasketModel.setProperty("/hasItems", false);
			oBasketModel.setProperty("/itemsCount", 0);
			oBasketModel.setProperty("/totalPrice", 0);
		}
	});
});