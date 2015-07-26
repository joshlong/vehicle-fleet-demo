// Load Map 
// var map = L.map('map').setView([40.061, -97.515], 4);
var mapboxUrl = 'https://{s}.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={token}';
var mapID = 'albertoaflores.llpjgl43';
var mapToken = 'pk.eyJ1IjoiYWxiZXJ0b2FmbG9yZXMiLCJhIjoiS3duWUxzUSJ9.X1rRTTRkktNR7DFIc0DsCw';
var mapboxAttribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>';

// create map
var map = L.map('map', {
	center : [ 40.061, -97.515 ],
	zoom : 4
});

var miniMap = L.map('miniMap', {
	center : [ 40.061, -97.515 ],
	zoom : 15
});

// Creates markers for each group
var inMotionNormalMarker = L.AwesomeMarkers.icon({
	icon : 'bullseye',
	iconColor : '#FFFFFF',
	markerColor : 'green',
	prefix : 'fa',
	extraClasses : 'faa-flash animated'
});
var stoppedNormalMarker = L.AwesomeMarkers.icon({
	icon : 'bullseye',
	iconColor : '#FFFFFF',
	markerColor : 'green',
	prefix : 'fa'
});
var inMotionServiceInfoMarker = L.AwesomeMarkers.icon({
	icon : 'bullseye',
	iconColor : '#FFFFFF',
	markerColor : 'blue',
	prefix : 'fa',
	extraClasses : 'faa-flash animated'
});
var stoppedServiceInfoMarker = L.AwesomeMarkers.icon({
	icon : 'bullseye',
	iconColor : '#FFFFFF',
	markerColor : 'blue',
	prefix : 'fa'
});
var inMotionServiceSoonMarker = L.AwesomeMarkers.icon({
	icon : 'bullseye',
	iconColor : '#FFFFFF',
	markerColor : 'beige',
	prefix : 'fa',
	extraClasses : 'faa-flash animated'
});
var stoppedServiceSoonMarker = L.AwesomeMarkers.icon({
	icon : 'bullseye',
	iconColor : '#FFFFFF',
	markerColor : 'beige',
	prefix : 'fa'
});
var inMotionServiceNowMarker = L.AwesomeMarkers.icon({
	icon : 'bullseye',
	iconColor : '#FFFFFF',
	markerColor : 'orange',
	prefix : 'fa',
	extraClasses : 'faa-flash animated'
});
var stoppedServiceNowMarker = L.AwesomeMarkers.icon({
	icon : 'bullseye',
	iconColor : '#FFFFFF',
	markerColor : 'orange',
	prefix : 'fa'
});
var inMotionStopTruckMarker = L.AwesomeMarkers.icon({
	icon : 'bullseye',
	iconColor : '#FFFFFF',
	markerColor : 'red',
	prefix : 'fa',
	extraClasses : 'faa-flash animated'
});
var stoppedStopTruckMarker = L.AwesomeMarkers.icon({
	icon : 'bullseye',
	iconColor : '#FFFFFF',
	markerColor : 'red',
	prefix : 'fa'
});

// Create markers for the RentMe Unit Locations
var serviceCenterMarker = L.AwesomeMarkers.icon({
	icon : 'truck',
	iconColor : '#FFFFFF',
	markerColor : 'cadetblue',
	prefix : 'fa'
});

function setupDefaultMap() {
	// add map tiles
	L.tileLayer(mapboxUrl, {
		attribution : mapboxAttribution,
		maxZoom : 18,
		subdomains : [ 'a', 'b', 'c', 'd' ],
		id : mapID,
		token : mapToken
	}).addTo(map);

	// query for all points by default
	var queryFilter = buildQuery();
	queryFleetInfo(queryFilter);
}

function setupMinimap() {
	// add map tiles
	L.tileLayer(mapboxUrl, {
		maxZoom : 18,
		subdomains : [ 'a', 'b', 'c', 'd' ],
		id : mapID,
		token : mapToken
	}).addTo(miniMap);
}

// configure search bar widget
var visualSearch;
function setupSearchBar() {
	// initialize search box
	$(document).ready(function() {
		visualSearch = VS.init({
			container : $('.visual_search'),
			query : '',
			showFacets : true,
			unquotable : [],
			callbacks : {
				search : function(query, searchCollection) {
					// perform query
					updateSearch();
				},
				facetMatches : function(callback) {
					callback([ 'Customer', 'VIN', 'Unit ID' ]);
				},
				valueMatches : function(facet, searchTerm, callback) {

				}
			}
		});
	});
}

// empty query object
function buildQuery() {
	var queryFilter = {};
	queryFilter.vins = [];
	queryFilter.customers = [];
	queryFilter.unitIds = [];
	queryFilter.serviceFilters = [];
	queryFilter.vehicleMovementFilters = [];
	return queryFilter;
}

// executes ajax call to remote server
function queryFleetInfo(query) {
	// debug
	console.log("Ignored Query: [" + JSON.stringify(query) + "]");
	var data = [];
	// processing - spin!
	$("#spinnerIcon").show();
	collectPages('/fleet-location-service/locations', function(result) {
		if (result.locations && result.locations.length > 0) {
			data = data.concat(result.locations);
		} else {
			// See https://github.com/Leaflet/Leaflet.markercluster
			markers = L.markerClusterGroup();

			// iterate over the list of results
			$.each(data, function(index, value) {
				// console.log(data.trucks[index]);
				var truck = data[index];
				var iconType = resolveMarker(truck.vehicleMovementType,
						truck.serviceType);

				// var marker = L.marker([truck.latitude, truck.longitude], {icon:
				// iconType}).addTo(map);
				var obj = {
					lat : truck.latitude,
					lon : truck.longitude
				};
				if (truck.latitude && truck.longitude) {
					var marker = L.marker({
						lat : truck.latitude,
						lon : truck.longitude
					}, {
						icon : iconType
					});
					marker.vin = "" + truck.vin;
					marker.truck = truck;
					marker.on('click', markerClickHandler);
					marker.bindPopup("Vin: " + truck.vin);
					markers.addLayer(marker);
				} else {
					msg = "FAIL - VIN: " + truck.vin + " JSON: " + JSON.stringify(obj)
							+ " TSP: " + truck.tspProvider;
					console.log(msg);
				}
			});

			map.addLayer(markers);
			$("#spinnerIcon").hide();
		}
	});
}

function resolveMarker(movementType, serviceType) {
	var iconType = stoppedNormalMarker;
	if (movementType == 'IN_MOTION' && serviceType == 'None') {
		iconType = inMotionNormalMarker;
	} else if (movementType == 'STOPPED' && serviceType == 'None') {
		iconType = stoppedNormalMarker;
	} else if (movementType == 'IN_MOTION' && serviceType == 'ServiceInfo') {
		iconType = inMotionServiceInfoMarker;
	} else if (movementType == 'STOPPED' && serviceType == 'ServiceInfo') {
		iconType = stoppedServiceInfoMarker;
	} else if (movementType == 'IN_MOTION' && serviceType == 'ServiceSoon') {
		iconType = inMotionServiceSoonMarker;
	} else if (movementType == 'STOPPED' && serviceType == 'ServiceSoon') {
		iconType = stoppedServiceSoonMarker;
	} else if (movementType == 'IN_MOTION' && serviceType == 'ServiceNow') {
		iconType = inMotionServiceNowMarker;
	} else if (movementType == 'STOPPED' && serviceType == 'ServiceNow') {
		iconType = stoppedServiceNowMarker;
	} else if (movementType == 'IN_MOTION' && serviceType == 'StopTruck') {
		iconType = inMotionStopTruckMarker;
	} else if (movementType == 'STOPPED' && serviceType == 'StopTruck') {
		iconType = stoppedStopTruckMarker;
	}

	return iconType;
}

var markers;

var markerInUse;
var sidebar;
var truckMarker;
var circle;
function markerClickHandler(event) {
	markerInUse = this;
	if (!(sidebar.isVisible())) {
		sidebar.toggle();
	}

	// update miniMap
	if (truckMarker) {
		miniMap.removeLayer(truckMarker);
		miniMap.removeLayer(circle);
	}
	miniMap.setView({
		lat : markerInUse.truck.latitude,
		lon : markerInUse.truck.longitude
	}, 8, {
		duration : 0.5
	});

	map.panTo({
		lat : markerInUse.truck.latitude,
		lon : markerInUse.truck.longitude
	}, {
		duration : 0.5
	});

	// add marker
	var iconType = resolveMarker(markerInUse.truck.vehicleMovementType,
			markerInUse.truck.serviceType);
	truckMarker = L.marker({
		lat : markerInUse.truck.latitude,
		lon : markerInUse.truck.longitude
	}, {
		icon : iconType
	});
	truckMarker.addTo(miniMap);

	// add circle
	circle = L.circle({
		lat : markerInUse.truck.latitude,
		lon : markerInUse.truck.longitude
	}, 40000, {
		color : 'red',
		fillColor : '#f03',
		fillOpacity : 0.5
	});
	circle.addTo(miniMap);

	// Loading truck telemetry data
	$('#telemetryVin').text(markerInUse.truck.vin);
	$('#telemetryLatitude').text(markerInUse.truck.latitude);
	$('#telemetryLongitude').text(markerInUse.truck.longitude);
	$('#telemetryAddress').text(markerInUse.truck.address);
	$('#telemetryHeading').text(markerInUse.truck.heading);
	$('#telemetryOdometer').text(markerInUse.truck.odometer);
	$('#telemetryGpsSpeed').text(markerInUse.truck.gpsSpeed);
	$('#telemetryGpsStatus').text(markerInUse.truck.gpsStatus);
	$('#telemetryTotalIdleTime').text(markerInUse.truck.totalIdleTime);
	$('#telemetryTotalFuelUsage').text(markerInUse.truck.totalFuelUsage);
	$('#telemetryTimestamp').text(markerInUse.truck.timestamp);
	$('#telemetryTotalEngineTime').text(markerInUse.truck.totalEngineTime);
	$('#telemetryTspProvider').text(markerInUse.truck.tspProvider);

	// update RentMe unit info
	if (markerInUse.truck.unitInfo) {
		$('#rentmeUnitInfo').show();
		$("#customerNumber").text(markerInUse.truck.unitInfo.unitNumber);
		$("#customerName").text(markerInUse.truck.unitInfo.customerName);
		$("#engineMake").text(markerInUse.truck.unitInfo.engineMake);
	} else {
		$('#rentmeUnitInfo').hide();
	}

	// update fault info
	if (markerInUse.truck.unitFault) {
		$('#rentmeFaultInfo').show();
		$("#faultSpn").text(markerInUse.truck.unitFault.spn);
		$("#faultFmi").text(markerInUse.truck.unitFault.fmi);

		// update fault code info
		if (markerInUse.truck.faultCode) {
			$('.rentmeFaultCode').show();
			$("#rentmeFCfaultCode").text(markerInUse.truck.faultCode.faultCode);
			$("#rentmeFCfaultCodeId").text(
					markerInUse.truck.faultCode.faultCodeId);
			$("#rentmeFCdescription").text(
					markerInUse.truck.faultCode.description);
			$("#rentmeFCinstructions").text(
					markerInUse.truck.faultCode.repairInstructions);
		} else {
			$('.rentmeFaultCode').hide();
		}
	} else {
		$('#rentmeFaultInfo').hide();
	}
}

function updateVehicleWidget(data) {
	// debug
	console.log("Truck Info: [" + JSON.stringify(data) + "]");
	console.log("Truck: [" + JSON.stringify(markerInUse.truck) + "]");

	// Loading truck telemetry data
	$('#telemetryVin').text(markerInUse.truck.vin);
	$('#telemetryLatitude').text(markerInUse.truck.latitude);
	$('#telemetryLongitude').text(markerInUse.truck.longitude);
	$('#telemetryAddress').text(markerInUse.truck.address);
	$('#telemetryHeading').text(markerInUse.truck.heading);
	$('#telemetryOdometer').text(markerInUse.truck.odometer);
	$('#telemetryGpsSpeed').text(markerInUse.truck.gpsSpeed);
	$('#telemetryGpsStatus').text(markerInUse.truck.gpsStatus);
	$('#telemetryTotalIdleTime').text(markerInUse.truck.totalIdleTime);
	$('#telemetryTotalFuelUsage').text(markerInUse.truck.totalFuelUsage);
	$('#telemetryTimestamp').text(markerInUse.truck.timestamp);
	$('#telemetryTotalEngineTime').text(markerInUse.truck.totalEngineTime);
	$('#telemetryTspProvider').text(markerInUse.truck.tspProvider);

	// update RentMe unit info
	if (markerInUse.truck.unitInfo) {
		$('#rentmeUnitInfo').show();
		$("#customerNumber").text(markerInUse.truck.unitInfo.unitNumber);
		$("#customerName").text(markerInUse.truck.unitInfo.customerName);
		$("#engineMake").text(markerInUse.truck.unitInfo.engineMake);
	} else {
		$('#rentmeUnitInfo').hide();
	}

	// update fault info
	if (markerInUse.truck.unitFault) {
		$('#rentmeFaultInfo').show();
		$("#faultSpn").text(markerInUse.truck.unitFault.spn);
		$("#faultFmi").text(markerInUse.truck.unitFault.fmi);

		// update fault code info
		if (markerInUse.truck.faultCode) {
			$('.rentmeFaultCode').show();
			$("#rentmeFCfaultCode").text(markerInUse.truck.faultCode.faultCode);
			$("#rentmeFCfaultCodeId").text(
					markerInUse.truck.faultCode.faultCodeId);
			$("#rentmeFCdescription").text(
					markerInUse.truck.faultCode.description);
			$("#rentmeFCinstructions").text(
					markerInUse.truck.faultCode.repairInstructions);
		} else {
			$('.rentmeFaultCode').hide();
		}
	} else {
		$('#rentmeFaultInfo').hide();
	}

	// update spinner
	$("#spinnerIcon").hide();
}

function closeTruckInfoView() {
	$('#truckView').popup('hide');
}

// This runs from the "Search Bar" and from the "Filter" pop-up
function updateSearch() {
	var query = buildQuery();

	// iterate over the facets
	$.each(visualSearch.searchQuery.facets(), function(index, value) {
		if (value['VIN']) {
			query.vins.push(value['VIN']);
		}
		if (value['Customer']) {
			query.customers.push(value['Customer']);
		}
		if (value['Unit ID']) {
			query.unitIds.push(value['Unit ID']);
		}
	});

	$('input[name="serviceFilter"]:checked').each(function() {
		query.serviceFilters.push(this.value);
	});
	$('input[name="vehicleMovementFilter"]:checked').each(function() {
		query.vehicleMovementFilters.push(this.value);
	});

	// clean up map
	map.removeLayer(markers);

	// querying
	queryFleetInfo(query);
}

function handleExportButton() {

	$('#dataExportView').popup({
		tooltipanchor : $('.leaflet-bar-part'),
		autoopen : true,
		offsettop : 13,
		offsetleft : 20,
		vertical : 'topedge',
		horizontal : 'leftedge',
		type : 'tooltip'
	});
}

function handleExportRequest() {
	var exportRequest = {};
	exportRequest.columns = [];
	exportRequest.exportType = $('input[name="dataExportType"]:checked').val();

	$('input[name="dataExportColumns"]:checked').each(function() {
		exportRequest.columns.push(this.value);
	});

	exportRequest.startDate = $('#actualFromDate').val();
	exportRequest.endDate = $('#actualToDate').val();

	// build the new URL
	var download_url = '/download?columns=' + exportRequest.columns;
	download_url += '&startDate=' + $('#actualFromDate').val();
	download_url += '&endDate=' + $('#actualToDate').val();
	download_url += '&type=' + $('input[name="dataExportType"]:checked').val();

	// load it into a hidden iframe
	var iframe = $("<iframe/>").attr({
		src : download_url,
		style : "visibility:hidden;display:none"
	}).appendTo('body');
}

/**
 * Utility to create an unique ID using coordinates. This is needed so that we
 * can access it from other places in the DOM.
 */
function createIdFromCoordinates(latitude, longitude) {
	var messageId = "" + latitude + longitude;
	messageId = messageId.replace(/\./g, '');
	messageId = messageId.replace(/-/g, '');
	return messageId;
}

function setupServiceCenters() {
	var scg = new L.LayerGroup();
	var data = [];

	collectPages(
			'/service-location-service/serviceLocations',
			function(result) {
				if (result.locations && result.locations.length > 0) {
					data = data.concat(result.locations);
				} else {
					// iterate over the list of results
					data
							.forEach(function(value, index) {
								var content = "<div class='scg_popup'>"
										+ "<div class='loc_header'><i class='fa fa-wrench'></i> "
										+ value.location + "</div>"
										+ "<div class='loc_comments'>"
										+ value.address2 + "</div>" + "<div>"
										+ value.address1 + "</div>" + "<div>"
										+ value.city + ", " + value.state + " "
										+ value.zip + "</div>" + "</div>";

								L.marker({
									lat : value.latitude,
									lon : value.longitude
								}, {
									icon : serviceCenterMarker
								}).bindPopup(content).addTo(scg);
							});
				}
			});

	// Overlay layers are grouped
	var groupedOverlays = {
		"<i class='fa fa-truck'></i> RentMe Locations" : {
			"Service Center <i class='fa fa-wrench'></i>" : scg
		}
	};

	// Use the custom grouped layer control, not "L.control.layers"
	var layerControl = L.control.groupedLayers(null, groupedOverlays, null);
	map.addControl(layerControl);
}

function getMiles(i) {
	return i * 0.000621371192;
}

function getMeters(i) {
	return i * 1609.344;
}

function setupMapLegend() {
	// control that shows state info on hover
	var info = L.control({
		position : 'bottomleft'
	});

	info.onAdd = function(map) {
		this._div = L.DomUtil.create('div', 'info');
		this._div.innerHTML = '<h4 style="color: black">RentMe Trucks</h4>'
				+ '<i class="fa fa-bullseye faa-flash animated"></i> Moving &nbsp;&nbsp;&nbsp;&nbsp; <i class="fa fa-bullseye"></i> Stopped <br/>'
				+ '<i class="fa fa-map-marker" style="color: green;"></i> Normal &nbsp;&nbsp;'
				+ '<i class="fa fa-map-marker" style="color: blue"></i> ServiceInfo &nbsp;&nbsp;'
				+ '<i class="fa fa-map-marker" style="color: yellow"></i> ServiceSoon &nbsp;&nbsp;'
				+ '<i class="fa fa-map-marker" style="color: orange"></i> ServiceNow &nbsp;&nbsp;'
				+ '<i class="fa fa-map-marker" style="color: red"></i> StopNow &nbsp;';
		return this._div;
	};

	info.addTo(map);
}

function setupSidebar() {
	sidebar = L.control.sidebar('sidebar', {
		closeButton : true,
		position : 'right'
	});
	map.addControl(sidebar);

	map.on('click', function() {
		sidebar.hide();
	});

	sidebar.on('show', function() {
		console.log('Sidebar will be visible.');
	});

	sidebar.on('shown', function() {
		console.log('Sidebar is visible.');
	});

	sidebar.on('hide', function() {
		console.log('Sidebar will be hidden.');
	});

	sidebar.on('hidden', function() {
		console.log('Sidebar is hidden.');
	});

	L.DomEvent.on(sidebar.getCloseButton(), 'click', function() {
		console.log('Close button clicked.');
	});
}

setupSearchBar();
setupDefaultMap();
setupMinimap();
setupServiceCenters();
setupMapLegend();
setupSidebar();