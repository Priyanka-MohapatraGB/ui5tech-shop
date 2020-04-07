sap.ui.define([
		"demo/shop/controller/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("demo.shop.controller.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);