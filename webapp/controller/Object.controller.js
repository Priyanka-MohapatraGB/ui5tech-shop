/*global location*/
sap.ui.define([
	"demo/shop/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"demo/shop/model/formatter",
	"sap/m/MessageToast"
], function (
	BaseController,
	JSONModel,
	History,
	formatter,
	MessageToast
) {
	"use strict";

	return BaseController.extend("demo.shop.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var iOriginalBusyDelay,
				oViewModel = new JSONModel({
					busy: true,
					delay: 0
				});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			// Store original busy indicator delay, so it can be restored later on
			iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			this.setModel(oViewModel, "objectView");
			this.getOwnerComponent().getModel().metadataLoaded().then(function () {
				// Restore original busy indicator delay for the object view
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("objectView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});
			oShareDialog.open();
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("ProductSet", {
					ProductID: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound
		 * @private
		 */
		_bindView: function (sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				parameters: {
					expand: "ToSupplier"
				},
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.metadataLoaded().then(function () {
							// Busy indicator on view should only be set if metadata is loaded,
							// otherwise there may be two busy indications next to each other on the
							// screen. This happens because route matched handler already calls '_bindView'
							// while metadata is loaded.
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}

			var oResourceBundle = this.getResourceBundle(),
				oObject = oView.getBindingContext().getObject(),
				sObjectId = oObject.ProductID,
				sObjectName = oObject.ProductID;

			// Everything went fine.
			oViewModel.setProperty("/busy", false);
			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("saveAsTileTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		onAddToBasket: function (oEvent) {
			// Basket Model ermitteln
			var oBasketModel = this.getModel("basket");
			var oProduct = oEvent.getSource().getBindingContext().getObject();

			// Ermitteln, ob bereits eine SalesOrderId existiert
			if (oBasketModel.getProperty("/salesOrderId")) {
				// Bestellposition (SalesOrderLineItem) anlegen
				this._createSalesOrderLineItem(oProduct);
			} else {
				// Neue Bestellung (SalesOrder) inkl. Bestellposition (SalesOrderLineItem) anlegen.
				this._createSalesOrder(oProduct);
			}
		},

		_createSalesOrderLineItem: function (oProduct) {
			var oModel = this.getModel();
			var oBasketModel = this.getModel("basket");
			var oSalesOrderLineItemEntry = oModel.createEntry("SalesOrderLineItemSet");
			var oSalesOrderLineItem = oSalesOrderLineItemEntry.getObject();

			// Daten für Bestellposition hinzufügen
			oSalesOrderLineItem.SalesOrderID = oBasketModel.getProperty("/salesOrderId");
			oSalesOrderLineItem.ProductID = oProduct.ProductID;
			oSalesOrderLineItem.Note = oProduct.Name;
			oSalesOrderLineItem.Quantity = "1";
			oSalesOrderLineItem.CurrencyCode = oBasketModel.getProperty("/currencyCode");
			oSalesOrderLineItem.DeliveryDate = new Date();

			// OData Call (Create SalesOrderLineItem)
			oModel.create("/SalesOrderLineItemSet", oSalesOrderLineItem, {
				success: function (oData) {
					// Anzahl der Items anpassen
					var iItemsCount = oBasketModel.getProperty("/itemsCount") + 1;
					oBasketModel.setProperty("/itemsCount", iItemsCount);
					oBasketModel.setProperty("/hasItems", true);

					// Gesamtpreis anpassen
					var fPrice = parseFloat(oBasketModel.getProperty("/totalPrice"));
					fPrice = fPrice + parseFloat(oProduct.Price);
					oBasketModel.setProperty("/totalPrice", fPrice);

					// Bestätigungsmeldung
					var sMessage = "Item" + oProduct.Name + "Added to the shopping cart";
					MessageToast.show(sMessage);
				}
			});
		},

		_createSalesOrder: function (oProduct) {
			var oBasketModel = this.getModel("basket");
			var oModel = this.getModel();
			var oSalesOrderEntry = oModel.createEntry("SalesOrderSet");
			var oSalesOrder = oSalesOrderEntry.getObject();

			// SalesOrder Daten
			oSalesOrder.CurrencyCode = oBasketModel.getProperty("/currencyCode");
			oSalesOrder.CustomerID = oBasketModel.getProperty("/customerID");

			// OData Call (Create SalesOrder)
			var that = this;
			oModel.create("/SalesOrderSet", oSalesOrder, {
				success: function (oData) {
					// SalesOrder Id in Model hinterlegen
					oBasketModel.setProperty("/salesOrderId", oData.SalesOrderID);
					that._createSalesOrderLineItem(oProduct);
				}
			});
		},

		openBasket: function () {
			this.getRouter().navTo("basket");
		}

	});

});