/*jslint node: true */
"use strict";

// API key for http://openlayers.org. Please get your own at
// http://bingmapsportal.com/ and use that instead.
var apiKey = "AqTGBsziZHIJYYxgivLBf0hVdrAk9mWO5cQcb8Yux8sW5M8c8opEC2lZqKR1ZZXf";

// initialize map when page ready
var map;
var gg = new OpenLayers.Projection("EPSG:4326");
var sm = new OpenLayers.Projection("EPSG:900913");
var accountname="boden";
var refresh;
var refresh_traffic;
var trafficlayer;
var buslayer;

var init = function (onSelectFeatureFunction) {

   /* Standard traffic style */
   var traffic_styled = new OpenLayers.Style({
      //fillColor: "white",
      // fillColor: "blue",
      //pointRadius: 1,
      //fontWeight: "normal",
      //fontColor: "#000000",
      fontSize: "9px",
      strokeColor: "${color}",
      strokeDashstyle: "${stroke}",
      strokeWidth: 6,
      strokeOpacity: 0.8,
      //strokeDashstyle: 'dot',
      //strokeLinecap: 'square',
      pointerEvents: "visiblePainted",
      fillOpacity: 0.5,
      cursor: "pointer",
      label : "${speed}Km/h",
      //fontColor: "#333333",
      labelOutlineColor: "yellow",
      labelOutlineWidth: 4,
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });

   /* Hover/select traffic style */
   var traffic_temp_styled = new OpenLayers.Style({
      fillColor: "white",
      strokeColor: "yellow",
      strokeWidth: 6,
      fontSize: "18px",
      strokeOpacity: 0.7,
      pointerEvents: "visiblePainted",
      fillOpacity: 0.6,
      cursor: "pointer",
      label : "${speed}Km/h",
      // label : "${speed}",
      strokeDashstyle: "${stroke}",
      labelOutlineColor: "white",
      labelOutlineWidth: 4,
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });

   var traffic_style = new OpenLayers.StyleMap({
      'default' : traffic_styled,
      'select' : traffic_temp_styled
   });

   var protocol_traffic = new OpenLayers.Protocol.HTTP({
         url: "http://traffic.synctrace.com/trafficgeo.json?" + Math.random(),
            format: new OpenLayers.Format.GeoJSON({
                  extractStyles: false,
                  extractAttributes: true
               })
   });

   refresh_traffic = new OpenLayers.Strategy.Refresh({force: true, active: true});

   trafficlayer = new OpenLayers.Layer.Vector("Verkeer", {
            styleMap: traffic_style,
            // minScale: 54168.1,
            // zoomOffset: 11, 
            //resolutions: [38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
            strategies: [new OpenLayers.Strategy.Fixed(), refresh_traffic],
            protocol: protocol_traffic
         });


    var vector = new OpenLayers.Layer.Vector("Vector Layer", {});

    var sprintersLayer = new OpenLayers.Layer.Vector("Sprinters", {
        styleMap: new OpenLayers.StyleMap({
            externalGraphic: "img/mobile-loc.png",
            graphicOpacity: 1.0,
            graphicWidth: 16,
            graphicHeight: 26,
            graphicYOffset: -26
        })
    });

    var lastseen_style = {
        fillOpacity: 0.1,
        fillColor: '#000',
        strokeColor: '#f00',
        strokeOpacity: 0.6
    };

   var bus_styled = new OpenLayers.Style({
      //fillColor: "white",
      //pointRadius: 1,
      //fontWeight: "normal",
      //fontColor: "#000000",
      //fontSize: "8px",
      strokeColor: "${speed_color}",
      // strokeColor: "#ff9933",
      strokeWidth: 3,
      pointerEvents: "all",
      fillOpacity: 0.6,
      cursor: "pointer",
      label : "${name}",
      labelOutlineColor: "white",
      labelOutlineWidth: 3,
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });

   /* Hover/select style */
   var bus_temp_styled = new OpenLayers.Style({
      fillColor: "white",
      strokeColor: "#ff9933",
      strokeWidth: 4,
      pointerEvents: "all",
      fillOpacity: 0.4,
      cursor: "pointer",
      label : "${name}",
      labelOutlineColor: "white",
      labelOutlineWidth: 4,
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });

   /* stylemaps */
   var lastseen_style = new OpenLayers.StyleMap({
      'default' : bus_styled,
      'temporary' : bus_temp_styled
   });

   lastseen_style.styles['default'].addRules([
      new OpenLayers.Rule({
         maxScaleDenominator: 60000000,
         minScaleDenominator: 433344,
         symbolizer: {
            fillColor: "white",
            fontColor: "#333333",
            fontWeight: "bolder",
            strokeColor: "${speed_color}",
            pointRadius: 8,
            fontSize: "11px"
            }
         }),
      new OpenLayers.Rule({
         maxScaleDenominator: 433344,
         minScaleDenominator: 54168,
         symbolizer: {
            fillColor: "orange",
            fontColor: "#333333",
            strokeColor: "${speed_color}",
            fontWeight: "bolder",
            pointRadius: 14,
            fontSize: "10px"
            }
         }),
      new OpenLayers.Rule({
         maxScaleDenominator: 54168,
         minScaleDenominator: 1,
         symbolizer: {
      cursor: "pointer",
      label : "${speed}Km/h",
      labelOutlineColor: "white",
      labelOutlineWidth: 4,
            fillColor: "#E6EA18",
            fontColor: "#333333",
            strokeColor: "${speed_color}",
            fontWeight: "bolder",
            pointRadius: 20,
            fontSize: "8px"
            }
         })
      ]);

   var protocol_bus = new OpenLayers.Protocol.HTTP({
         url: "cross/pos.php?output=kml&account=" + accountname + "&cmd=lastseen&detail=1&range=0&time=" + Math.random(),
            format: new OpenLayers.Format.KML({
                  extractStyles: false,
                  extractAttributes: true
               })
   });

    refresh = new OpenLayers.Strategy.Refresh({force: true, active: true});

    buslayer = new OpenLayers.Layer.Vector("Posities", {
            styleMap: lastseen_style,
            //zoomOffset: 11,
            strategies: [new OpenLayers.Strategy.Fixed(), refresh],
            protocol: protocol_bus
   });


    var sprinters = getFeatures();
    sprintersLayer.addFeatures(sprinters);

    var selectControl = new OpenLayers.Control.SelectFeature(sprintersLayer, {
        autoActivate:true,
        onSelect: onSelectFeatureFunction});

    var geolocate = new OpenLayers.Control.Geolocate({
        id: 'locate-control',
        geolocationOptions: {
            enableHighAccuracy: false,
            maximumAge: 0,
            timeout: 7000
        }
    });
    // create map
    map = new OpenLayers.Map({
        div: "map",
        theme: null,
        projection: gg,
	displayProjection: gg,
        numZoomLevels: 18,
        controls: [
            new OpenLayers.Control.Attribution(),
            new OpenLayers.Control.TouchNavigation({
                dragPanOptions: {
                    enableKinetic: true
                }
            }),
            geolocate,
            selectControl
        ],
        layers: [
            new OpenLayers.Layer.OSM("OSM",["http://tc.synctrace.com:80/${z}/${x}/${y}.png"], {
		transitionEffect: 'resize'
		}),
            new OpenLayers.Layer.OSM("OpenStreetMap", null, {
                transitionEffect: 'resize'
            }),
/*
            new OpenLayers.Layer.Bing({
                key: apiKey,
                type: "Road",
                // custom metadata parameter to request the new map style - only useful
                // before May 1st, 2011
                metadataParams: {
                    mapVersion: "v1"
                },
                name: "Bing Road",
                transitionEffect: 'resize'
            }),
            new OpenLayers.Layer.Bing({
                key: apiKey,
                type: "Aerial",
                name: "Bing Aerial",
                transitionEffect: 'resize'
            }),
            new OpenLayers.Layer.Bing({
                key: apiKey,
                type: "AerialWithLabels",
                name: "Bing Aerial + Labels",
                transitionEffect: 'resize'
            }),
*/
            vector,
	    buslayer,
            sprintersLayer
        ],
        center: new OpenLayers.LonLat(0, 0),
        zoom: 1
    });


  /* Antwerp bounds */
   //var lat = 51.238068;
   //var lon = 4.411526;
/* Antwerp bounds */
   //var lat = 51.238068;
   //var lon = 4.411526;
   //var bounds = new OpenLayers.Bounds();
   //bounds.extend(new OpenLayers.LonLat(3.54635, 51.53569));
   //bounds.extend(new OpenLayers.LonLat(5.47995, 50.94169));
   //var bounds = new OpenLayers.Bounds(-74.047185, 40.679648, -73.907005, 40.882078)
   //var bounds = new OpenLayers.Bounds(-74.047185, 40.679648, -73.907005, 40.882078)
   //var bounds = new OpenLayers.Bounds(3.54635, 51.53569, 5.47995, 50.94169);
   //var bounds = new OpenLayers.Bounds (50.94169, 3.54635, 51.53569, 5.47995);

   //var bounds = new OpenLayers.Bounds(-74.047185, 40.679648, -73.907005, 40.882078)
   //var bounds = new OpenLayers.Bounds(-74.047185, 40.679648, -73.907005, 40.882078)
   //var bounds = new OpenLayers.Bounds(3.54635, 51.53569, 5.47995, 50.94169);
   //var bounds = new OpenLayers.Bounds (50.94169, 3.54635, 51.53569, 5.47995);


   trafficlayer.setVisibility(true);
   map.addLayer(trafficlayer);

   sprintersLayer.setVisibility(false);
   vector.setVisibility(false);

  /* Now reload the data every 9 seconds */
  setInterval(function () {
        refresh.refresh();      

        //pan to extent
        // map.panTo(buslayer.getDataExtent().getCenterLonLat());
  },8000);

  /* Now reload the traffic data every 60 seconds */
  setInterval(function () {
        refresh_traffic.refresh();      
/*
	    var bounds = trafficlayer.getDataExtent();
        if(bounds){
            map.panTo(trafficlayer.getDataExtent().getCenterLonLat());
            map.zoomToExtent(bounds, true);
        }
*/

      map.panTo(trafficlayer.getDataExtent().getCenterLonLat());
   //map.panTo(trafficlayer.getDataExtent().getCenterLonLat());
   //map.zoomToExtent(bounds, true);

        
        //pan to extent
        //map.panTo(entrancelayer.getDataExtent().getCenterLonLat());
  },60000);

/*
	var bounds = buslayer.getDataExtent();
       		if(bounds){
        	map.panTo(buslayer.getDataExtent().getCenterLonLat());
               // map.zoomToExtent(bounds, true);
        }
*/

    var style = {
        fillOpacity: 0.1,
        fillColor: '#000',
        strokeColor: '#f00',
        strokeOpacity: 0.6
    };
    geolocate.events.register("locationupdated", this, function(e) {
        vector.removeAllFeatures();
        vector.addFeatures([
            new OpenLayers.Feature.Vector(
                e.point,
                {},
                {
                    graphicName: 'cross',
                    strokeColor: '#f00',
                    strokeWidth: 2,
                    fillOpacity: 0,
                    pointRadius: 10
                }
            ),
            new OpenLayers.Feature.Vector(
                OpenLayers.Geometry.Polygon.createRegularPolygon(
                    new OpenLayers.Geometry.Point(e.point.x, e.point.y),
                    e.position.coords.accuracy / 2,
                    50,
                    0
                ),
                {},
                style
            )
        ]);
        map.zoomToExtent(vector.getDataExtent());
    });

    function getFeatures() {
        var features = {
            "type": "FeatureCollection",
            "features": [
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [1332700, 7906300]},
                    "properties": {"Name": "Igor Tihonov", "Country":"Sweden", "City":"Gothenburg"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [790300, 6573900]},
                    "properties": {"Name": "Marc Jansen", "Country":"Germany", "City":"Bonn"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [568600, 6817300]},
                    "properties": {"Name": "Bart van den Eijnden", "Country":"Netherlands", "City":"Utrecht"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [-7909900, 5215100]},
                    "properties": {"Name": "Christopher Schmidt", "Country":"United States of America", "City":"Boston"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [-937400, 5093200]},
                    "properties": {"Name": "Jorge Gustavo Rocha", "Country":"Portugal", "City":"Braga"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [-355300, 7547800]},
                    "properties": {"Name": "Jennie Fletcher ", "Country":"Scotland", "City":"Edinburgh"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [657068.53608487, 5712321.2472725]},
                    "properties": {"Name": "Bruno Binet ", "Country":"France", "City":"Chambéry"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [667250.8958124, 5668048.6072737]},
                    "properties": {"Name": "Eric Lemoine", "Country":"France", "City":"Theys"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [653518.03606319, 5721118.5122914]},
                    "properties": {"Name": "Antoine Abt", "Country":"France", "City":"La Motte Servolex"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [657985.78042416, 5711862.6251028]},
                    "properties": {"Name": "Pierre Giraud", "Country":"France", "City":"Chambéry"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [742941.93818208, 5861818.9477535]},
                    "properties": {"Name": "Stéphane Brunner", "Country":"Switzerland", "City":"Paudex"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [736082.61064069, 5908165.4649505]},
                    "properties": {"Name": "Frédéric Junod", "Country":"Switzerland", "City":"Montagny-près-Yverdon"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [771595.97057525, 5912284.7041793]},
                    "properties": {"Name": "Cédric Moullet", "Country":"Switzerland", "City":"Payerne"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [744205.23922364, 5861277.319748]},
                    "properties": {"Name": "Benoit Quartier", "Country":"Switzerland", "City":"Lutry"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [1717430.147101, 5954568.7127565]},
                    "properties": {"Name": "Andreas Hocevar", "Country":"Austria", "City":"Graz"}},
                { "type": "Feature", "geometry": {"type": "Point", "coordinates": [-12362007.067301,5729082.2365672]},
                    "properties": {"Name": "Tim Schaub", "Country":"United States of America", "City":"Bozeman"}}
            ]
        };

        var reader = new OpenLayers.Format.GeoJSON();

        return reader.read(features);
    }

};
