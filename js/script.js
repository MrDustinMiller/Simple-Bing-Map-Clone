//global variables 
var map;
var userLat; 
var userLon;
var currentShape;
var polyonCoords;
var directionsManager;
var resourceSet;
var poiLat;
var poiLon;
var poiName;
var route = false;
const key = 'AlWrmFsuKIg2hnt-aOJ2mxKL55NELQkSjjAA8rJoha03C5y6tBt9kKbvDn5cQ7QL'; 

function LoadMapScenario() {
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
        userLat = position.coords.latitude;
        userLon = position.coords.longitude;
    
        //call function
        UpdateMapUserLoc();
    }//end function
    
    function UpdateMapUserLoc() {
      
        //on the map instance use the setView method to change the view of the map based on given settings
        map.setView({
            //specify the type of map style that should be displayed (aerial)
            mapTypeID: Microsoft.Maps.MapTypeId.aerial,
            //set center of the map to given location (devices current location)
            center: new Microsoft.Maps.Location(userLat, userLon),
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
    
    function QueryApi() {
        
        //gets the POI choice out of the text field element so we can use it for the POI search in the url we will query data from
        POIoption = document.getElementById("PointsOfInterest").value;
    
        //append all of our details for our API url
        bingUrl = 'https://dev.virtualearth.net/';
        restAPI = 'REST/v1/';
        searchAPI = 'LocalSearch/'
        query = '?query=' + POIoption;
        userLocation = '&userLocation=' + userLat + ',' + userLon;
        bingKey = '&key=' + key;
    
        //the api url to query for data for a specific POI (from the text field) based around the users current location
        queryUrl = bingUrl + restAPI + searchAPI + query + userLocation + bingKey;
    
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
        let poiAddress = [];
        let poiPhoneNumber = [];
        let pointsOfInterest = [];
        let poiGeocodePoints = [];
        let poiCoordinates = [];
       
        //give the variable the properties of resources inside the json data
        resourceSet = jsonData.resourceSets[0].resources;
            
        //for loop to run through the variable resourceSet (from the json object)
        for (let i=0;  i < resourceSet.length; i++) {
    
            poiName = resourceSet[i].name;
            poiAddress = resourceSet[i].Address.formattedAddress;
            poiPhoneNumber = resourceSet[i].PhoneNumber;
            poiGeocodePoints = resourceSet[i].geocodePoints[0];
            poiCoordinates = poiGeocodePoints.coordinates;
            poiLat = poiCoordinates[0];
            poiLon = poiCoordinates[1];
    
            //combining all three properties of the POI's into one variable
            pointsOfInterest[i] = poiName;
    
            SetPushpins(poiLat, poiLon, poiName)
            
        }//end for 
    
        DisplayResults(resourceSet);
       
    }//end function
    
    function SetPushpins() {
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
        RemovePushpin();
        //Add a click event handler to each of the pushpins (calls the pin directions function).
        Microsoft.Maps.Events.addHandler(pin, 'click', GetPinDirections);
    
    }//end function
    
    function DisplayResults() {
    
        for (let i = 0; i < resourceSet.length; i++) {
            //display our results in a list inside the text area
            var li = document.createElement('li');
            li.innerHTML = resourceSet[i].name;  
            document.getElementById('resultsList').appendChild(li);   
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
                   let pin = map.entities.get(i);
                   //if the pushpins belong to the pushpin class for our map instance
                   if (pin instanceof Microsoft.Maps.Pushpin) {
                   //delete the pushpins if above conditions are true
                   map.entities.removeAt(i);   
                   //when poi option is removed remove its display data along with it
                   document.getElementById('resultsList').innerHTML = ""   
                   directionsManager.clearAll();     
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
        tools.create(Microsoft.Maps.DrawingTools.ShapeType.polygon, function (shape) {
            currentShape = shape
        });
    
        //add our shape to the map
        map.entities.push(shape); 
    
        //add a click event to the filer polygon button
        document.getElementById('filterPolygon').addEventListener("click", function() {
            //call function
           FilterByPolygon(currentShape)
           
        })
     
        //add a click event to the delete polygon button
        document.getElementById('deletePolygon').addEventListener("click", function() {
    
        //disposes the instance of the drawing tools class
        tools.dispose(Microsoft.Maps.DrawingTools.ShapeType.polygon)
        });
    
    }//end function
    
    function GetPinDirections(poiLat) { 
    
        //each time a pin is clicked we will make a new instance of our direction manager class. we can check if this has happened with our route boolean
        //if true, we have a direction manager instance and a route on the map. We clear those out, and continue making a new route for each newly clicked pin.
        if (route == true) {
            directionsManager.clearAll();
        }//end if
    
        //Load the directions module.
        Microsoft.Maps.loadModule('Microsoft.Maps.Directions', function () {
    
        //Create an instance of the directions manager.
        directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);
    
        //add a new waypoint that is the users current location
        var userCurrentLoc = new Microsoft.Maps.Directions.Waypoint({ location: new Microsoft.Maps.Location(userLat, userLon) });
        directionsManager.addWaypoint(userCurrentLoc);
    
        //add a new waypoint that is the lat/lon of the clicked pin (poi).
        var pinLocation = new Microsoft.Maps.Directions.Waypoint({ location: new Microsoft.Maps.Location(poiLat.location.latitude, poiLat.location.longitude) });
        directionsManager.addWaypoint(pinLocation);
    
        //Sets the specified render options for the route to specified html element
        directionsManager.setRenderOptions({ itineraryContainer: document.getElementById('printoutPanel') });  
    
        //calculate directions 
        directionsManager.calculateDirections();
    
        });//end load directions module
        
        //update our boolean variable
        route =  true;
    
    }//end function
    
    function CloseDirections() {
    
            directionsManager.clearAll();
            document.getElementById('resultsList').innerHTML = ""
            
            map.setView({
            //return the view of the center of the map (once the directions have been closed) to the users location
            center: new Microsoft.Maps.Location(userLat, userLon),
            //adjusts how zoomed into the map we are
            zoom: 13,
            })
    
    }//end function