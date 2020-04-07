/*global QUnit*/

jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"demo/shop/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"demo/shop/test/integration/pages/Worklist",
	"demo/shop/test/integration/pages/Object",
	"demo/shop/test/integration/pages/NotFound",
	"demo/shop/test/integration/pages/Browser",
	"demo/shop/test/integration/pages/App"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "demo.shop.view."
	});

	sap.ui.require([
		"demo/shop/test/integration/WorklistJourney",
		"demo/shop/test/integration/ObjectJourney",
		"demo/shop/test/integration/NavigationJourney",
		"demo/shop/test/integration/NotFoundJourney",
		"demo/shop/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});