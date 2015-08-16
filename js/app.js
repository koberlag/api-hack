var autocomplete, lat, lng, resultsLatLng = [], pageNum = 1, errorTriggered = false,
 months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

$(function(){
    setupAjaxLoadingIcon();
    $("#from-date").datepicker().datepicker('setDate', new Date());
	$(".filter-form").submit(function()
		{
			resultsLatLng.length = 0;
			pageNum = 1;
			getEvents
		});
	$(".location-icon").click(getCurrentLocation);
	$(document).on('click', '.list-view', showListView);
	$(document).on('click', '.map-view', showMapView);
	setupLazyLoading();
});

function setupLazyLoading(){
	$(window).scroll(function () {
	   if ($(window).scrollTop() >= $(document).height() - $(window).height() - 10 
	   	&& !errorTriggered
	   	&& $(".list-container").hasClass("active")){
	      pageNum++;
	      getEvents();
	   }
	});
}

function showListView(){
	var resultContainer = $(".result-container");
	resultContainer.find(".list-container").addClass("active").show();
	resultContainer.find(".map-container").removeClass("active").hide();
	resultContainer.removeClass("map-container");
}

function showMapView(){
	var resultContainer = $(".result-container");
	resultContainer.find(".list-container").removeClass("active").hide();
	resultContainer.find(".map-container").addClass("active").show();
	resultContainer.addClass("map-container");
	initMap();
}

function initMap() {
  var map 	 = new google.maps.Map(document.getElementById("map")),
  	  bounds = new google.maps.LatLngBounds();

	for (var i = resultsLatLng.length - 1; i >= 0; i--) {
		var marker = new google.maps.Marker({
		    position: resultsLatLng[i].latlng,
		    map: map,
		    title: resultsLatLng[i].venue
	  	});
	  	marker.setMap(map);
 		bounds.extend(marker.getPosition());
	};
	map.fitBounds(bounds);
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
	// the parameters we need to pass in our request to the bands in town API
	var request = {
	 	format : 'json',
	 	location : lat + "," + lng,
	 	date : getDateRange(),
	 	radius: $("#proximity-list").val(),
	 	app_id : 'Proximity',
	 	per_page:1,
	 	page: pageNum
	 },
	 eventUrl = "http://api.bandsintown.com/events/search";
	
	getAJAX(request, eventUrl, "jsonp")
	.done(function(eventData){
		if(eventData.errors || eventData.length === 0)
		{
			return;
		}
		$.each(eventData, function(i, eventResult) {
			var objDate = new Date(eventResult.datetime),
					month = months[objDate.getMonth()],
				day   = objDate.getDate();
    			
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
		});
		
		$('.result-container').removeClass("hidden");
			// $('.result-container').prepend($('.view-switch').clone())
	});
}

function getEventView(result){
	var eventContainer 	= $(".templates").find(".event-container").clone(),
		eventLink 		= eventContainer.find(".event-link"),
		// eventHeader     = eventContainer.find(".event-header"),
		artistList		= eventContainer.find(".artist-list"),
		venueName		= eventContainer.find(".venue-name"),
		eventTime		= eventContainer.find(".event-time");

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
	// eventHeader.text(eventTitle);
	venueName.text(result.venue.name);
	var dateTime = new Date(result.datetime.replace(/\-/g,'\/').replace(/[T|Z]/g,' '));
	eventTime.text(" @ " + formatAMPM(new Date(dateTime)));
	
	resultsLatLng.push({ latlng:{lat: result.venue.latitude, lng: result.venue.longitude}, venue: result.venue.name});
	return eventContainer;
}

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

function getCurrentLocation(){
	if(!$(this).hasClass("current-location")){
	 	loading = $('#loading').show();
		//$(".result-container").html("");
		geolocate()
	}
}

//function to get a the date range string for the bands in town API
//The string begin date is the date selected in the from textbox, and the end date is approximately 1 year later.
//We send this range so that we can allow the user to select a start date, but also return data from upcoming dates.
function getDateRange(){
	var beginDate = new Date($("#from-date").val())
		endDate = new Date(beginDate.getTime() + (60*60*24*365*1000));
	return beginDate.toISOString().substring(0,10) + "," + endDate.toISOString().substring(0,10)
}

// takes error string and turns it into displayable DOM element
var showError = function(error){
	var errorElem = $('.templates .error').clone();
	var errorText = '<p>' + error + '</p>';
	errorElem.append(errorText);
	$('.result-container').append(errorElem);
	errorTriggered = true;
};

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

 

