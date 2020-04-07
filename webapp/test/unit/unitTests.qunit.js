/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"Demo/Tech-Shop/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});