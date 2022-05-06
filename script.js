//global variables for our map instance and our lat and lon values
var map;
var lat; 
var lon;
var currentShape;

function loadMapScenario() {
   //loads the map to the html element (to be displayed on screen)
   map = new Microsoft.Maps.Map(document.getElementById('myMap'), {});     
}//end function

function GeoLocate() {
//get users current location
//nav.geo returns a geolocation object that gives access to the location of a device
//getCurrentPosition is used to then query the devices hardware to get the current position of that device
   if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(GetUserLoc);
   }//end if
}//end function

function GetUserLoc(position) {
    //set the devices location to the lat and lon variables
    //the geoLocationPosition instance contains the coords property, 
    //the coords prop. contains a GeoLocationCoordnates object instance (inside is lat and lon properties)
    lat = position.coords.latitude;
    lon = position.coords.longitude;

    //store the lat and lon values into html element
    document.getElementById('lattitude').value = lat;
    document.getElementById('longitude').value = lon;

    //call function
    UpdateMapUserLoc();
}//end function

function UpdateMapUserLoc() {
  
    //on the map instance use the setView method to change the view of the map based on given settings
    map.setView({
        //specify the type of map style that should be displayed (aerial)
        mapTypeID: Microsoft.Maps.MapTypeId.aerial,
        //set center of the map to given location (devices current location)
        center: new Microsoft.Maps.Location(lat, lon),
        //controls how zoomed in the map will be
        zoom: 16,   
    });

    //returns the location of the center of the current map view (in the setView method)
    var center = map.getCenter();

    //access the pushpin class and pass in the center of the map view as arg (so pin is set to that location)
        pin = new Microsoft.Maps.Pushpin(center, {
        title: 'Your Location',
        color: 'purple',
        enableHoverStyle: true
    });

    //Add the pushpin to the map
    map.entities.push(pin);
}//end function

function queryApi() {
    //bing map key
    const key = 'AlWrmFsuKIg2hnt-aOJ2mxKL55NELQkSjjAA8rJoha03C5y6tBt9kKbvDn5cQ7QL';

    //gets the POI choice out of the text field element so we can use it for the POI search in the url we will query data from
    POIoption = document.getElementById("PointsOfInterest").value;
      
    //the api url to query for data for a specific POI (from the text field) based around the users current location
    queryUrl = 'https://dev.virtualearth.net/REST/v1/LocalSearch/?query=' + POIoption + '&userLocation=' + lat + ',' + lon + '&key=' + key;

    //fetch the response data from the url request, returns in text format
    //fetchs the data (from the url) and gives us a promise back
       fetch(queryUrl)
       //returns that promise and on fulfillment will resolve into the response object
       .then(response => response.text())
       //take that data then
       .then(data => {
           //parse the data into a json object, store it in the jsonData variable
           jsonData = JSON.parse(data);
           
           //call function with the json data passed as an arg
           GetPoiData(jsonData)
       })
       .catch(error => {
        //if we could not fullfill our request, display an error message
        console.log(error);
    });           
    

}//end function

function GetPoiData() {
    
    //declare variables for POI
    let poiName = [];
    let poiAddress = [];
    let poiPhoneNumber = [];
    let pointsOfInterest = [];
    let poiGeocodePoints = [];
    let poiCoordinates = [];
    let resourceSet = [];
    let poiLat = [];
    let poiLon = [];
   
    //give the variable the properties of resources inside the json data
    resourceSet = jsonData.resourceSets[0].resources;
        
    //for loop to run through the variable resourceSet (from the json object)
    for (let i=0;  i < resourceSet.length; i++) {

        //grabs the name of each POI from the json data
        poiName = resourceSet[i].name;
        //grabs the formatted address of each POI from the json data
        poiAddress = resourceSet[i].Address.formattedAddress;
        //grabs the phone number of each POI from the json data
        poiPhoneNumber = resourceSet[i].PhoneNumber;
        //grab the geocodepoints of each POI from the json data
        poiGeocodePoints = resourceSet[i].geocodePoints[0];
        //from geocodepoints we get the coordinates from the POI from the json data
        poiCoordinates = poiGeocodePoints.coordinates;
        //from the coordinates we get the lat and lon for each POI
        poiLat = poiCoordinates[0];
        poiLon = poiCoordinates[1];

        //combining all three properties of the POI's into one variable
        pointsOfInterest[i] = poiName + ' ' + poiAddress + ' ' + poiPhoneNumber + '\n';
        
        //on the map instance we use the setView method to change the view of the map based on given settings
        map.setView({
        mapTypeID: Microsoft.Maps.MapTypeId.aerial,
        //this determines the location of the pushpin
        center: new Microsoft.Maps.Location(poiLat, poiLon),
        zoom: 13,   
        });

        //returns the location of the center of the current map view (in the setView method)
        let center = map.getCenter();

        //access the pushpin class and pass in the center of the map view as arg (so pin is set to that location)
        pin = new Microsoft.Maps.Pushpin(center, {
        title: poiName,
        color: 'green',
        enableHoverStyle: true
        });

        //Add the pushpin to the map
        map.entities.push(pin);
        
        //Add a click event handler to each of the pushpins (calls the pin directions function).
        Microsoft.Maps.Events.addHandler(pin, 'click', GetPinDirections);
    }//end for 
    
    //call function
    RemovePushpin();
  
    //for loop to go through each poi 
    for (let i=0;  i < pointsOfInterest.length; i++) {
        //display each poi with their properties to the html element
        document.getElementById("PoiList").innerHTML = pointsOfInterest;
    }//end for
        
}//end function

function RemovePushpin() {

   //let input have the value of the text field
   let input = document.getElementById('PointsOfInterest');

   //remove the pushpins on the map whenever the POI is deleted (backspaced) out of the text field
   //when the user presses a key the event will fire and the function will execute
   input.onkeydown = function() { 
       //.keycode retrieves the ascii key code of the key pressed
       let key = window.event.keyCode; 
       //backspace presssed
       if( key == 8 ){ 
           //decrementing for loop to get the length of the entities in the map instance (the poi pins)
           for (let i = map.entities.getLength(); i >= 0; i--) {
               //give variable the value of # of pins on the map
               let pushpin = map.entities.get(i);
               //if the pushpins belong to the pushpin class for our map instance
               if (pushpin instanceof Microsoft.Maps.Pushpin) {
               //delete the pushpins if above conditions are true
               map.entities.removeAt(i);           
           }//end if
       }//end for

       //if backspace was pressed, return to the users lat/lon after deleting the pushpins
       UpdateMapUserLoc();
    }//end if

 };//end function

}//end function

function DrawPolygon() {

    let tools;
    let shape;
    
    //Load the DrawingTools module.
    Microsoft.Maps.loadModule('Microsoft.Maps.DrawingTools', function () {
        //Create an instance of the DrawingTools class and bind it to the map.
        tools = new Microsoft.Maps.DrawingTools(map);
    });  
    
    //Create a new polygon.
    tools.create(Microsoft.Maps.DrawingTools.ShapeType.polygon, function (shape) {});

    //add our shape to the map
    map.entities.push(shape);

    //add a click event to the delete polygon button
    document.getElementById('deletePolygon').addEventListener("click", function() {

    //disposes the instance of the drawing tools class
    tools.dispose(Microsoft.Maps.DrawingTools.ShapeType.polygon)
    });
    
}//end function

function GetDirections() {
    //load the directions module
    Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {  

        //responsible for calculating directions and displaying a route on the instance of the map
        //Create an instance of the directions manager.
        var directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map); 

        //print out to html element
        directionsManager.setRenderOptions({ itineraryContainer: document.getElementById('printoutPanel') });

        //Displays an input panel for calculating directions in the specified container.
        directionsManager.showInputPanel('directionContainer');

        //remove the 'Your location' pin from the map because the direction module will place its own when displaying direction routes
        map.entities.remove(pin);

        document.getElementById('closeDirections').addEventListener("click", function () {
        directionsManager.dispose();
    })
    });

    

}//end function

function GetPinDirections(poiLat) { 

    //alert user to tell them how to close their directions/route
    console.log('Click "Close Directions" to delete your route')

    //Load the directions module.
    Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {

    //Create an instance of the directions manager.
    directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);

    //add a new waypoint that is the users current location
    var userCurrentLoc = new Microsoft.Maps.Directions.Waypoint({ address:'Your location' , location: new Microsoft.Maps.Location(lat, lon) });
    directionsManager.addWaypoint(userCurrentLoc);

    //add a new waypoint that is the lat/lon of the clicked pin (poi).
    var pinLocation = new Microsoft.Maps.Directions.Waypoint({ location: new Microsoft.Maps.Location(poiLat.location.latitude, poiLat.location.longitude) });
    directionsManager.addWaypoint(pinLocation);

    //Sets the specified render options for the route to specified html element
    directionsManager.setRenderOptions({ itineraryContainer: document.getElementById('printoutPanel') });

    //Displays an input panel for calculating directions in the specified container.
    directionsManager.showInputPanel('directionContainer');  

    //calculate directions 
    directionsManager.calculateDirections();

    //adds a click event to the close direction button and clears the display/routes from the directions module that we loaded
    document.getElementById('closeDirections').addEventListener("click", function () {
        directionsManager.dispose();
                map.setView({
            //return the view of the center of the map (once the directions have been closed) to the users location
            center: new Microsoft.Maps.Location(lat, lon),
            //adjusts how zoomed into the map we are
            zoom: 13,
        })
    });//end function

    });//end load directions module
    
}//end function
