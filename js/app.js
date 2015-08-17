var autocomplete, lat, lng, resultsLatLng = [], pageNum = 1, errorTriggered = false,
 months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

$(function(){
	resetDefaults();
    setupAjaxLoadingIcon();
	setupLazyLoading();
    $("#from-date").datepicker().datepicker('setDate', new Date());
	$(".location-icon").click(getCurrentLocation);
	$("#search-button").click(searchEvents)
	$('.list-view').click(showListView);
	$('.map-view').click(showMapView);
});

function resetDefaults(){
	//Set initial values
	$(".list-container").html("");
	resultsLatLng.length = 0;
	pageNum = 1;
	$(".view-switch").addClass("hidden");
}

function searchEvents(){
	resetDefaults();
	getEvents().done(function(){
		if($(".map-container").hasClass("active"))
		{
			initMap();
		}
		setupStickyDateHeaders();
	});
}

function setupLazyLoading(){
	$(window).scroll(function () {
	   if ($(window).scrollTop() >= $(document).height() - $(window).height() - 10 
	   	&& lat != null
	   	&& !errorTriggered
	   	&& $(".list-container").hasClass("active")){
	      pageNum++;
	      getEvents();
	   }
	});
}

function setupStickyDateHeaders(){
var stickyOffset = $('.sticky').offset().top;

$(window).scroll(function(){
  var sticky = $('.sticky'),
      scroll = $(window).scrollTop(),
      offsetContent = sticky.height();

  if (scroll >= stickyOffset){
  	sticky.addClass('fixed-date');
  	$(".result-content").css("margin",offsetContent);
  }
  else {
  	sticky.removeClass('fixed-date');
  }
});
}

function showListView(){
	var resultContainer = $(".result-container");
	resultContainer.find(".list-container").addClass("active").show();
	resultContainer.find(".map-container").removeClass("active").hide();
	resultContainer.removeClass("map-container");
	resultContainer.find(".list-view").addClass("blue");
	resultContainer.find(".map-view").removeClass("red");
}

function showMapView(){
	var resultContainer = $(".result-container");
	resultContainer.find(".list-container").removeClass("active").hide();
	resultContainer.find(".map-container").addClass("active").show();
	resultContainer.addClass("map-container");
	resultContainer.find(".list-view").removeClass("blue");
	resultContainer.find(".map-view").addClass("red");
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

function initializeLocation(){
	$(".result-container").find(".map-container").hide();
    // Create the autocomplete object, restricting the search
    // to geographical location types.
  	autocomplete = new google.maps.places.Autocomplete(
    /** @type {HTMLInputElement} */(document.getElementById('location')),
    { types: ['geocode'] });

	// When the user selects an address from the dropdown,
	// populate the city and state in the location field
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		// Get the place details from the autocomplete object.
	  	var place = autocomplete.getPlace();
		 	lat = place.geometry.location.lat();
		  	lng = place.geometry.location.lng();
		searchEvents();
	    $(".location-icon").removeClass("current-location");
  	});

  	getCurrentLocation()
}

function getCurrentLocation(){
	if(!$(this).hasClass("current-location")){
	 	loading = $('#loading').show();
		$.when(geoLocation.getLocation()).then(function(position, textStatus, jqXHR) {
			var geocoder 	= new google.maps.Geocoder();
		    	lat 		= position.coords.latitude;
		     	lng 		= position.coords.longitude;
		    var latlng = new google.maps.LatLng(lat, lng);
		    $("#location").val("(Current Location)");
	    	$(".location-icon").addClass("current-location");
	    	searchEvents();
		});
	}
}

var geoLocation = {
    getLocation: function() {
        var deferred = $.Deferred();
        // if geo location is supported
        if(navigator.geolocation) {
            // get current position and pass the results to getPostalCode or time out after 5 seconds if it fails
            navigator.geolocation.getCurrentPosition(deferred.resolve, this.geoLocationError, {
                timeout: 5000
            });
        } else {
            //geo location isn't supported
            showError('Your browser does not support Geo Location.');
        }
        return deferred.promise();
    },
    geoLocationError: function() {
        showError('Geo Location failed.');
    }
};

function getEvents(){
	// the parameters we need to pass in our request to the bands in town API
	var request = {
	 	format : 'json',
	 	location : lat + "," + lng,
	 	date : getDateRange(),
	 	radius: $("#proximity-list").val(),
	 	app_id : 'Proximity',
	 	per_page:25,
	 	page: pageNum
	 },
	 eventUrl = "http://api.bandsintown.com/events/search";
	
	return getAJAX(request, eventUrl, "jsonp")
	.done(function(eventData){
		if(eventData.errors)
		{
			$(eventData.errors).each(function(i,error){
				showError(error);
			})
			return;
		}
		$.each(eventData, function(i, eventResult) {
			var objDate 	= new Date(eventResult.datetime),
				month 		= months[objDate.getMonth()],
				day   		= objDate.getDate(),
				dateString 	= month + " " + day,
				dateHeaders = $(".list-container").find(".date-header");

			if(dateHeaders.last().text() !== dateString)
			{
				var dateHeaderContainer = $(".templates .date-header-container").clone().addClass("sticky"),
				dateHeader = dateHeaderContainer.find(".date-header");
				dateHeader.text(dateString);
				$(".list-container").append(dateHeaderContainer);
			}
			$(".list-container").append(getEventView(eventResult));
			resultsLatLng.push({ latlng:{lat: eventResult.venue.latitude, lng: eventResult.venue.longitude}, venue: eventResult.artists[0].name + " @ " + eventResult.venue.name});
		});
		$('.view-switch').removeClass("hidden");
	});
}

function getEventView(result){
	var eventContainer 	= $(".templates").find(".event-container").clone(),
		eventLink 		= eventContainer.find(".event-link"),
		artistList		= eventContainer.find(".artist-list"),
		venueName		= eventContainer.find(".venue-name"),
		eventTime		= eventContainer.find(".event-time");

	eventLink.attr("href", result.url);
	$(result.artists).each(function(index, artist){
		 var artistItem = "";
		 if(index === 0)
		 {
		 	headliner = artist.name;
		  	artistItem = "<li>" + artist.name;
		 }
		 else
		 {
		  	artistItem = "<li>" + " , " + artist.name;
		 }
		 artistList.append(artistItem);
	});
	venueName.text(result.venue.name);
	var dateTime = new Date(result.datetime.replace(/\-/g,'\/').replace(/[T|Z]/g,' '));
	eventTime.text(" @ " + formatAMPM(new Date(dateTime)));
	
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
	$('.result-container').removeClass("hidden").append(errorElem);
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



function setupAjaxLoadingIcon(){
	var loading = $('#loading'),
		overlay = $(".overlay");
	$(document)
	.ajaxStart(function () {
    	loading.show();
    	overlay.show();
  	})
  	.ajaxStop(function () {
    	loading.hide();
    	overlay.hide();
  	});
}

 

