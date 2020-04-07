/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function() {
	"use strict";

	sap.ui.require([
		"Demo/Tech-Shop/test/integration/PhoneJourneys"
	], function() {
		QUnit.start();
	});
});