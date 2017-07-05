// Initialize Model
var places = [
	{
		name: 'Barbeque Factory',
		lat: 12.936253,
		lng: 77.627627,
		info: 'Experience the melting kababs'
	},
	{
		name: 'Barleyz',
		lat: 12.937631,
		lng: 77.626975,
		info: 'Beer Garden; Fine Dining; Contemporary Restaurant'
	},
	{
		name: 'AU BON PAIN CAFE INDIA',
		lat: 12.937288,
		lng: 77.626699,
		info: 'delicious new seasonal menu featuring a balance of healthy and indulgent items'
	},
	{
		name: 'Ambur Hot Dum Biriyani',
		lat: 12.936896,
		lng: 77.626653,
		info: 'Ambur Biryani is one of the famous biriyani recipes of South India'
	},
	{
		name: 'Tangerine Sizzlers and More',
		lat: 12.936472,
		lng: 77.626350,
		info: 'Sizzlers Steaks and Fusion Cusine Restaurant'
	},
];

// Constructor
var Place = function(data) {
	this.name = data.name;
	this.lat = data.lat;
	this.lng = data.lng;
	this.info = data.info;
};

// Initialize ViewModel
var ViewModel = function() {
	var self = this;
	self.placeList = ko.observableArray([]);
	self.imgList = ko.observableArray([]);
	self.search = ko.observable('');
	places.forEach(function(item){
		self.placeList.push(new Place(item));
	}, self);
	self.currentPlace = ko.observable(this.placeList()[0]);
	
	self.setPlace = function(clickedPlace) {
		self.currentPlace(clickedPlace);
		var index = self.filteredItems().indexOf(clickedPlace);
		self.updateContent(clickedPlace);
		self.activateMarker(self.markers[index], self, self.infowindow)();
		self.flickrImg(clickedPlace.lat, clickedPlace.lng, clickedPlace.name);
	};

    // Filter location name for search
	self.filteredItems = ko.computed(function() {
	    var searchTerm = self.search().toLowerCase();
	    if (!searchTerm) {
	        return self.placeList();
	    } else {
	        return ko.utils.arrayFilter(self.placeList(), function(item) {
            	return item.name.toLowerCase().indexOf(searchTerm) !== -1;
	        });
	    }
	});

	// Initialize Google Maps
	self.map = new google.maps.Map(document.getElementById('map'), {
        	center: {lat: 12.937037, lng: 77.627147},
            zoom: 17,
			mapTypeControl: false,
			streetViewControl: false
        }); 

  	// Initialize markers
	self.markers = [];
	self.infowindow = new google.maps.InfoWindow({
		maxWidth: 320
	});
	self.renderMarkers(self.placeList());
	self.filteredItems.subscribe(function(){
		self.renderMarkers(self.filteredItems());
  	});
	google.maps.event.addListener(self.map, 'click', function(event) {
		self.deactivateAllMarkers();
	    self.infowindow.close();
	});
	
	//flickr API Call
	self.flickrImg = function(lat, lng, loc) {
		var igLat = lat,
			igLng = lng,
			locationURLList = [],
			imageObjList = [],
			imageList = [],
			flickrError = $('#ig');
		
		self.imgList.removeAll();
		
		$.getJSON('https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=ca936d08ca736e1a6ceb2232f82e5962&lat=12.937631&lon=77.626975&format=json&nojsoncallback=1', function(data) {
			self.shuffle(data.photos.photo);
				for (var i = 0; i < 5; i++) {
			    	var targetURL = {url : 'https://farm' + data.photos.photo[i].farm + '.staticflickr.com/' + data.photos.photo[i].server + '/' + data.photos.photo[i].id + '_' + data.photos.photo[i].secret + '.jpg'};
			    	self.imgList.push(targetURL);
				
			}
		    
		}).error(function(e){
			//In case of error
			console.log("sorry failed to fetch data from api");
			flickrError.text("Fail to get flickr resources");
	    });;
	    
	};
};

ViewModel.prototype.shuffle = function(array) {
	  var currentIndex = array.length, temporaryValue, randomIndex;

	  // While there remain elements to shuffle...
	  while (0 !== currentIndex) {

	    // Pick a remaining element...
	    randomIndex = Math.floor(Math.random() * currentIndex);
	    currentIndex -= 1;

	    // And swap it with the current element.
	    temporaryValue = array[currentIndex];
	    array[currentIndex] = array[randomIndex];
	    array[randomIndex] = temporaryValue;
	  }

	  return array;
	};




// Render Markers
ViewModel.prototype.renderMarkers = function(arrayInput) {

	this.clearMarkers();
	var infowindow = this.infowindow;
	var context = this;
	var placeToShow = arrayInput;

  	for (var i = 0, len = placeToShow.length; i < len; i ++) {
		var location = {lat: placeToShow[i].lat, lng: placeToShow[i].lng};
		var marker = new google.maps.Marker({
				position: location,
				map: this.map,
				icon: 'img/map-pin-01.png'
			});

		this.markers.push(marker);
		this.markers[i].setMap(this.map);

		//listen to click
		marker.addListener('click', this.activateMarker(marker, context, infowindow, i));
  	}
};

//Update Info Window based on user interaction
ViewModel.prototype.activateMarker = function(marker, context, infowindow, index) {
	return function() {
		if (!isNaN(index)) {
			var place = context.filteredItems()[index];
			context.updateContent(place);
			context.flickrImg(place.lat, place.lng);
		}
		infowindow.close();
		context.deactivateAllMarkers();
		infowindow.open(context.map, marker);
		marker.setIcon('img/map-pin-02.png');
	};
};

// Info Window
ViewModel.prototype.updateContent = function(place){
	var html = '<div class="info-content">' +
		'<h3>' + place.name + '</h3>' +
		'<p>' + place.info + '</p>' + '</div>';

	this.infowindow.setContent(html);
};

//Reset marker
ViewModel.prototype.deactivateAllMarkers = function() {
	var markers = this.markers;
	for (var i = 0; i < markers.length; i ++) {
		markers[i].setIcon('img/map-pin-01.png');
	}
};

//Clear Markers
ViewModel.prototype.clearMarkers = function() {
	for (var i = 0; i < this.markers.length; i++) {
		this.markers[i].setMap(null);
	}
		this.markers = [];
};


function init(){
	ko.applyBindings(new ViewModel());
}

function googleError() {
	mapError = $('#map');
	mapError.text("Fail to load map. check internet connection");
	
}




