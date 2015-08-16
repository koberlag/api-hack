var autocomplete, lat, lng, resultsLatLng = [];
$(function(){
    setupAjaxLoadingIcon();
    $("#from-date").datepicker().datepicker('setDate', new Date());
	$(".filter-form").submit(getEvents);
	$(".location-icon").click(getCurrentLocation);
	// $(".map-view").on('click', showMapView);
	$(document).on('click', '.list-view', showListView);
	$(document).on('click', '.map-view', showMapView);
	// $(".list-view").click(showListView);
});

function setupAjaxLoadingIcon(){
	var loading = $('#loading');
	$(document)
	.ajaxStart(function () {
    	loading.show();
  	})
  	.ajaxStop(function () {
    	loading.hide();
  	});
}

function getCurrentLocation(){
	if(!$(this).hasClass("current-location")){
	 	loading = $('#loading').show();
		//$(".result-container").html("");
		geolocate()
	}
}

function toggleView(){
	var resultContainer = $(".result-container");
		listContainer = resultContainer.find(".list-container");
		mapContainer = resultContainer.find(".map-container")
	listContainer.toggle();
	mapContainer.toggle();
}

function showListView(){
	var resultContainer = $(".result-container");
	resultContainer.find(".list-container").show();
	resultContainer.find(".map-container").hide();
	// var resultContainer = $(".result-container");
	// 	listContainer = $(".templates .list-container").clone();
	// if(resultContainer.hasClass("map-container")){
	// 	resultContainer.removeClass("map-container");
	// 	resultContainer.html("");
	// 	getEvents();
	// }
}

function showMapView(){
	var resultContainer = $(".result-container");
	resultContainer.find(".list-container").hide();
	resultContainer.find(".map-container").show();
	resultContainer.addClass("map-container");
	// 	mapContainer = $(".templates .map-container");
	// if(!resultContainer.hasClass("map-container")){
	// 	resultContainer.addClass("map-container"),
	// 	resultContainer.html("");
	// 	resultContainer.prepend($('.view-switch').clone());

	// 	initMap();
	// }
}

//function to get a the date range string for the bands in town API
//The string begin date is the date selected in the from textbox, and the end date is approximately 1 year later.
//We send this range so that we can allow the user to select a start date, but also return data from dates occurring after.
function getDateRange(){
	var beginDate = new Date($("#from-date").val())
		endDate = new Date(beginDate.getTime() + (60*60*24*365*1000));
	return beginDate.toISOString().substring(0,10) + "," + endDate.toISOString().substring(0,10)
}

function initMap() {
  var map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: lat, lng: lng},
    zoom: 8
  });

  var infowindow = new google.maps.InfoWindow();
  var service = new google.maps.places.PlacesService(map);

	for (var i = resultsLatLng.length - 1; i >= 0; i--) {
		var marker = new google.maps.Marker({
		    position: resultsLatLng[i].latlng,
		    map: map,
		    title: resultsLatLng[i].venue
	  	});
	  	marker.setMap(map);
	};
}

function initialize(){
	$(".result-container").find(".map-container").hide();
 // Create the autocomplete object, restricting the search
  // to geographical location types.
  autocomplete = new google.maps.places.Autocomplete(
      /** @type {HTMLInputElement} */(document.getElementById('location')),
      { types: ['geocode'] });

  	geolocate();
  // When the user selects an address from the dropdown,
  // populate the city and state in the location field
  google.maps.event.addListener(autocomplete, 'place_changed', function() {
	 // Get the place details from the autocomplete object.
  	 var place = autocomplete.getPlace();
  	 lat = place.geometry.location.lat();
  	 lng = place.geometry.location.lng();
     getEvents();
     $(".location-icon").removeClass("current-location");
  });
}

function getEvents(){
	//Clear current results
	// $(".result-container").html("");
	resultsLatLng.length = 0;

	// the parameters we need to pass in our request to the bands in town API
	var request = {
	 	format : 'json',
	 	location : lat + "," + lng,
	 	date : getDateRange(),
	 	radius: $("#proximity-list").val(),
	 	app_id : 'Proximity'
	 	// ,per_page:2
	 },
	 eventUrl = "http://api.bandsintown.com/events/search";
	
	getAJAX(request, eventUrl, "jsonp")
	.done(function(eventData){
		$.each(eventData, function(i, eventResult) {
			var objDate = new Date(eventResult.datetime),
    			locale = "en-us",
    			month = objDate.toLocaleString(locale, { month: "short" }),
    			day = objDate.toLocaleString(locale, { day: "numeric" }),
    			
				dateString = month + " " + day,
				dateHeaders = $(".list-container").find(".date-header");

			if(dateHeaders.last().text() !== dateString)
			{
				var dateHeaderContainer = $(".templates .date-header-container").clone(),
				dateHeader = dateHeaderContainer.find(".date-header");
				dateHeader.text(dateString);
				$(".list-container").append(dateHeaderContainer);
			}
			$(".list-container").append(getEventView(eventResult));
			//getArtistEvents(request, eventResult.id, eventResult.artists[0].name);
		});
		if(eventData.length > 0)
		{
			$('.result-container').removeClass("hidden");
			// $('.result-container').prepend($('.view-switch').clone())
		}
	});
	initMap();
}

// //Get all events, get artist by event artist name/ get event where event matches first call
// function getArtistEvents(request, eventId, artist){
// 	// the parameters we need to pass in our request to the bands in town API
// 	 var radius = $("#proximity-list").val(),
// 	 eventUrl = "http://api.bandsintown.com/artists/name/events/search";
// 	 request.artist_id = artist;
// 	 request.api_version = "2.0";
// 	getAJAX(request, eventUrl, "jsonp")
// 	.done(function(eventData){
// 		$.each(eventData, function(i, eventResult) {
// 			if(eventId == eventResult.id){
// 				// $('.result-container').append(getEventView(eventResult));
// 				$(".list-container").append(getEventView(eventResult));
// 			}
// 		});
// 	});
// }

function getAJAX(request, url, datatype){
	return $.ajax({
		url: url,
		data: request,
		dataType: datatype,
		type: "GET",
		})
	.fail(function(jqXHR, error, errorThrown){
		showError(error); 
	});
}

// takes error string and turns it into displayable DOM element
var showError = function(error){
	var errorElem = $('.templates .error').clone();
	var errorText = '<p>' + error + '</p>';
	errorElem.append(errorText);
	$('.result-container').append(errorElem);
};

function getEventView(result){
	var eventContainer 	= $(".templates").find(".event-container").clone(),
		eventLink 		= eventContainer.find(".event-link"),
		eventHeader     = eventContainer.find(".event-header"),
		artistList		= eventContainer.find(".artist-list"),
		venueName		= eventContainer.find(".venue-name"),
		eventTime		= eventContainer.find(".event-time"),
		headliner		= result.artists[0].name,
		eventTitle		= headliner + " @ " + result.venue.name;

	eventLink.attr("href", result.url);
	$(result.artists).each(function(index, artist){
		 var artistItem = "";
		 if(index === 0)
		 {
		  	artistItem = "<li>" + artist.name;
		 }
		 else
		 {
		  	artistItem = "<li>" + " , " + artist.name;
		 }
		 artistList.append(artistItem);
	});
	eventHeader.text(eventTitle);
	venueName.text(result.venue.name);
	// eventTime.text(" @ " + formatAMPM(new Date(result.datetime)));
	eventTime.text(result.datetime);
	
	resultsLatLng.push({ latlng:{lat: result.venue.latitude, lng: result.venue.longitude}, venue: result.venue.name});
	return eventContainer;
}

function formatAMPM(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

//Gets the current location and displays the city and state
function geolocate(){
	navigator.geolocation.getCurrentPosition(function (position) {
	    var geocoder = new google.maps.Geocoder();
	     lat = position.coords.latitude;
	     lng = position.coords.longitude;
	    var latlng = new google.maps.LatLng(lat, lng);

	    getEvents();
	    //reverse geocode the coordinates, returning location information.
	    geocoder.geocode({ 'latLng': latlng }, function (results, status) {
	    	if (status == google.maps.GeocoderStatus.OK) {
	    		var address = results[3].address_components,
		    		locationName = address[0].long_name + ", " + address[2].short_name;
		    	$("#location").val("(Current Location)");
		    	$(".location-icon").addClass("current-location");
			}
	    });
	});
}
