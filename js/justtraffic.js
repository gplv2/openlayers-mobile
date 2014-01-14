/*jslint node: true */
"use strict";

var map;
//var entrancelayer;
var buslayer;
var trafficlayer;
var wazelayer;

var myfilter = null;
var refresh = null;
var refresh_traffic = null;
var refresh_waze = null;
var filterStrategy = null;

var baselayers = {};

var mybrowser = {
	init: function () {
		this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version";
		this.OS = this.searchString(this.dataOS) || "an unknown OS";
	},
	searchString: function (data) {
		for (var i=0;i<data.length;i++)	{
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1)
					return data[i].identity;
			}
			else if (dataProp)
				return data[i].identity;
		}
	},
	searchVersion: function (dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser: [
		{
			string: navigator.userAgent,
			subString: "Chrome",
			identity: "Chrome"
		},
		{ 	string: navigator.userAgent,
			subString: "OmniWeb",
			versionSearch: "OmniWeb/",
			identity: "OmniWeb"
		},
		{
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari",
			versionSearch: "Version"
		},
		{
			prop: window.opera,
			identity: "Opera",
			versionSearch: "Version"
		},
		{
			string: navigator.vendor,
			subString: "iCab",
			identity: "iCab"
		},
		{
			string: navigator.vendor,
			subString: "KDE",
			identity: "Konqueror"
		},
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "Firefox"
		},
		{
			string: navigator.vendor,
			subString: "Camino",
			identity: "Camino"
		},
		{		// for newer Netscapes (6+)
			string: navigator.userAgent,
			subString: "Netscape",
			identity: "Netscape"
		},
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "Explorer",
			versionSearch: "MSIE"
		},
		{
			string: navigator.userAgent,
			subString: "Gecko",
			identity: "Mozilla",
			versionSearch: "rv"
		},
		{ 		// for older Netscapes (4-)
			string: navigator.userAgent,
			subString: "Mozilla",
			identity: "Netscape",
			versionSearch: "Mozilla"
		}
	],
	dataOS : [
		{
			string: navigator.platform,
			subString: "Win",
			identity: "Windows"
		},
		{
			string: navigator.platform,
			subString: "Mac",
			identity: "Mac"
		},
		{
			   string: navigator.userAgent,
			   subString: "iPhone",
			   identity: "iPhone/iPod"
	    },
		{
			string: navigator.platform,
			subString: "Linux",
			identity: "Linux"
		}
	]
};

mybrowser.init();

$(document).ready(function () {
   $.ajaxSetup({
      cache: false,
      type: "POST"
   });


    $( "#searchfilter" ).keydown(function( event ) {
    if ( event.which == 13 ) {
            event.preventDefault();
            $('#okfilt').click();
        }
    });


   // pink tile avoidance
   OpenLayers.IMAGE_RELOAD_ATTEMPTS = 2;

/* I really need to know what browser since some return values mess up the 
 * flow on chrome in particular, even in strict mode
 * */

   /*
   OpenLayers.IMAGE_RELOAD_ATTEMPTS = 2;

   // pink tile avoidance
   OpenLayers.IMAGE_RELOAD_ATTEMPTS = 2;
   // make OL compute scale according to WMS spec
   OpenLayers.DOTS_PER_INCH = 25.4 / 0.28;
   */

   // html > body > div#olcontent > div > div.olblock > div#map.olMap > div#OpenLayers.Map_11_OpenLayers_ViewPort.olMapViewport.olControlMousePositionActive.olControlNavToolbarActive.olControlDragPanActive.olControlZoomBoxActive.olControlPinchZoomActive.olControlNavigationActive.olControlSelectFeatureActive > div#OpenLayers.Control.Panel_34.olControlNavToolbar.olControlNoSelect
   //


   $(window).resize(function () {
      //$('#log').append('<div>Handler for .resize() called.</div>');
         var canvasheight=$('#map').parent().css('height');
         var canvaswidth=$('#map').parent().css('width');

         $('#map').css("height", canvasheight);
         $('#map').css("width", canvaswidth);

         $('#left').css("height", canvasheight);
         $('#right').css("height", canvasheight);

   });

   jQuery("#okfilt").click( function() {
        var filterstring=$('#searchfilter').val();
        var propertysearch='name';
        if (filterstring.length > 0) {
        $('body').css('cursor', 'wait');
       
        $('#selectable > li').each(function(i, id){
            if ($(this).hasClass('ui-selected')) {
                //console.log(this.innerText.toLowerCase());
                //console.debug(this);
                // console.debug(mybrowser);
                if (mybrowser.browser == 'Firefox') {
                    if(this.innerHTML.toLowerCase() == 'label') {
                        propertysearch='name';
                    }
                    if(this.innerHTML.toLowerCase() == 'imei') {
                        propertysearch='imei';
                    }
                } else {
                    if(this.innerText.toLowerCase() == 'label') {
                        propertysearch='name';
                    }
                    if(this.innerText.toLowerCase() == 'imei') {
                        propertysearch='imei';
                    }
                }
            }
        });

        myfilter = new OpenLayers.Filter.Comparison({
            type: OpenLayers.Filter.Comparison.LIKE,
            // property: "imei",
            property: propertysearch,
            value: filterstring
        });
        
        if (filterstring.length<=0) {
            filterStrategy.setFilter(null);
        } else {
            filterStrategy.setFilter(myfilter);
            // console.log(myfilter);
            refresh.refresh();

            var bounds = buslayer.getDataExtent();
            if(bounds){ 
               map.panTo(buslayer.getDataExtent().getCenterLonLat());
               // map.zoomToExtent(bounds, true);
            }
        }

        $('body').css('cursor', 'default');
       } else {
        filterStrategy.setFilter(null);
        refresh.refresh();
        return true;
       }
   });

   $( "#selectable" ).selectable();
if(loadpoi) {
    includeJs("js/poilayer.js");
}

});

function load() {

   //var canvassize=$('#map').parent().attr('width');

   var canvasheight=$('#map').parent().css('height');
   var canvaswidth=$('#map').parent().css('width');

   $('#map').css("height", canvasheight);
   $('#map').css("width", canvaswidth);

   // Show hide Trip report section by attaching a toggle event (how cool is this ... )
   $('#showhidetriprepsec').toggle(function () {
         $('#map').hide();
         $('#showhidetriprepsec a').removeClass("icon_colapse");
         $('#showhidetriprepsec a').addClass("icon_expand");
   }, function(){
         $('#map').show();
         $('#showhidetriprepsec a').removeClass("icon_expand");
         $('#showhidetriprepsec a').addClass("icon_colapse");
   });

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
   //

   //$('#map').css("height",canvasheight);
   //$('#map').css("width",canvaswidth);

	//Creation of a custom panel with a ZoomBox control with the alwaysZoom option sets to true				
   OpenLayers.Control.CustomNavToolbar = OpenLayers.Class(OpenLayers.Control.Panel, {

         /**
          * Constructor: OpenLayers.Control.NavToolbar 
          * Add our two mousedefaults controls.
          *
          * Parameters:
          * options - {Object} An optional object whose properties will be used
          *     to extend the control.
          */
      initialize: function(options) {
         OpenLayers.Control.Panel.prototype.initialize.apply(this, [options]);
         this.addControls([
            new OpenLayers.Control.Navigation(),
            //Here it come
            new OpenLayers.Control.ZoomBox({alwaysZoom:true})
         ]);
         // To make the custom navtoolbar use the regular navtoolbar style
         this.displayClass = 'olControlNavToolbar'
      },

      /**
      * Method: draw 
      * calls the default draw, and then activates mouse defaults.
      */
      draw: function() {
         var div = OpenLayers.Control.Panel.prototype.draw.apply(this, arguments);
         this.defaultControl = this.controls[0];
         return div;
      }
   });


   /* Style maps 
   var style = new OpenLayers.StyleMap({ 'default': { label: "${name}", fontSize: "12px", fontFamily: "Courier New, monospace", fontWeight: "bold" } });
   */
   var bounds = new OpenLayers.Bounds (3.54635, 49.94169, 5.47995, 51.53569);

   /* Now the var map itself  */
   map = new OpenLayers.Map({
      controls: [
         //new OpenLayers.Control.Navigation(),
         new OpenLayers.Control.MousePosition(),
         new OpenLayers.Control.LayerSwitcher(),
         new OpenLayers.Control.ScaleLine(),
         new OpenLayers.Control.OverviewMap(),
         new OpenLayers.Control.Attribution(),
         new OpenLayers.Control.Zoom({
          zoomInId: "customZoomIn",
          zoomOutId: "customZoomOut"
         }),
         new OpenLayers.Control.ZoomBox({alwaysZoom:true}),
         new OpenLayers.Control.PanZoomBar({ panIcons: false }),
         //new OpenLayers.Control.Permalink(),
         new OpenLayers.Control.ScaleLine()
         //new OpenLayers.Control.OverviewMap()
        ],
        //resolutions: [152.87405654907226, 76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
        //maxResolution: 19.109257068634033,
        //numZoomLevels: 8,
        //maxScale: 433344.01634946937,
        //restrictedExtent: bounds,
        units: 'm',
        maxExtent: bounds,
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
        div: "map",
        allOverlays: false,
        layers: [
        //new OpenLayers.Layer.OSM()
        new OpenLayers.Layer.OSM("OSM",["http://tc.synctrace.com:80/${z}/${x}/${y}.png"])
      ]
   });

   /*
   var url = "http://tc.synctrace.com:88";
   var name = "TileCache";
   var layername = "osm";
   var options = {'type':'png'}; 
   var tclayer = new OpenLayers.Layer.TileCache(name, url, layername, options);

   baselayers.mapnik = new OpenLayers.Layer.OSM.Mapnik("Mapnik", {
      lid: "mapnik"
   });
   */

   /*
   baselayers.cyclemap = new OpenLayers.Layer.OSM.CycleMap("CycleMap", {
      lid: "cyclemap"
   });

   baselayers.pubtrans = new OpenLayers.Layer.XYZ("Public Transport (EU only)", "http://tile.xn--pnvkarte-m4a.de/tilegen/${z}/${x}/${y}.png", {
      lid: "pubtrans"
   });

   map.addLayers([baselayers.cyclemap]);
   */


   var panel = new OpenLayers.Control.CustomNavToolbar();
   map.addControl(panel);

   // Small hack to hide the select box but keep zoom workign
   $('.olControlNavToolbar').css("display", 'none');

   map.zoomToExtent(bounds);

   // Hack the zoomout
   //map.numZoomLevels = null;

   // http://wiki.openstreetmap.org/wiki/MinScaleDenominator
   /* normal bus style map */
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
      /* labelAlign: "${align}",
      // labelXOffset: "${xOffset}",
      // labelYOffset: "${yOffset}",
      //externalGraphic: "${image_url}",
      // label : "${name}",
      /*
      
   /* Standard traffic style */
   var traffic_styled = new OpenLayers.Style({
      //fillColor: "white",
      //pointRadius: 1,
      //fontWeight: "normal",
      //fontColor: "#000000",
      //fontSize: "8px",
      strokeColor: "${color}",
      strokeDashstyle: "${stroke}",
      strokeWidth: 4,
      strokeOpacity: 0.8,
      //strokeDashstyle: 'dot',
      //strokeLinecap: 'square',
      pointerEvents: "visiblePainted",
      fillOpacity: 0.6,
      cursor: "pointer",
      // label : "${speed}Km/h",
      labelOutlineColor: "white",
      labelOutlineWidth: 4,
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });

   /* Hover/select traffic style */
   var traffic_temp_styled = new OpenLayers.Style({
      fillColor: "white",
      strokeColor: "yellow",
      strokeWidth: 6,
      strokeOpacity: 0.7,
      pointerEvents: "visiblePainted",
      fillOpacity: 0.6,
      cursor: "pointer",
      label : "${speed}",
      strokeDashstyle: "${stroke}",
      labelOutlineColor: "white",
      labelOutlineWidth: 4,
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });

   /* Entrance style */
   var entrance_styled = new OpenLayers.Style({
      fillColor: "red",
      fillOpacity: 0.6,
      fontColor: "#000000",
      fontWeight: "light",
      pointRadius: 8,
      fontSize: "11px",
      strokeColor: "#ff9963",
      strokeWidth: 3,
      // externalGraphic: "${image_url}",
      pointerEvents: "all",
      //graphicName: 'star',
      labelOutlineColor: "white",
      labelOutlineWidth: 8,
      labelAlign: "cm",
      cursor: "pointer",
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });

   /* Entrance select hover style */
   var entrance_temp_styled = new OpenLayers.Style({
      fillColor: "red",
      fontColor: "#000000",
      fontWeight: "normal",
      pointRadius: 8,
      fontSize: "11px",
      strokeColor: "#ff9933",
      strokeWidth: 2,
      // externalGraphic: null,
      pointerEvents: "all",
      fillOpacity: 0.3,
      label : "${name}",
      labelOutlineColor: "white",
      labelAlign: "rb",
      labelOutlineWidth: 8,
      cursor: "pointer",
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });

   /* stylemaps */
   var lastseen_style = new OpenLayers.StyleMap({
      'default' : bus_styled,
      'temporary' : bus_temp_styled
   });

   var entrance_style = new OpenLayers.StyleMap({
      'default' : entrance_styled,
      'temporary' : entrance_temp_styled
   });

   var traffic_style = new OpenLayers.StyleMap({
      'default' : traffic_styled,
      'temporary' : traffic_temp_styled
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
            fillColor: "#E6EA18",
            fontColor: "#333333",
            strokeColor: "${speed_color}",
            fontWeight: "bolder",
            pointRadius: 20,
            fontSize: "8px"
            }
         })
      ]);

      /* Style the halte layer acc to res */
   entrance_style.styles['default'].addRules([
      new OpenLayers.Rule({
         maxScaleDenominator: 60000000,
         minScaleDenominator: 215000,
         symbolizer: {
            fillColor: "red",
            fillOpacity: 0.6,
            fontColor: "#000000",
            fontWeight: "light",
            pointRadius: 2,
            fontSize: "11px",
            strokeColor: "#ff9963",
            strokeWidth: 1,
            pointerEvents: "all",
            labelOutlineColor: "white",
            labelOutlineWidth: 8,
            labelAlign: "cm",
            cursor: "pointer",
            fontFamily: "sans-serif"
            }
         }),
      new OpenLayers.Rule({
         maxScaleDenominator: 215000,
         minScaleDenominator: 27000,
         symbolizer: {
            fillColor: "red",
            fillOpacity: 0.6,
            fontColor: "#000000",
            fontWeight: "light",
            pointRadius: 4,
            fontSize: "11px",
            strokeColor: "#ff9963",
            strokeWidth: 2,
            pointerEvents: "all",
            labelOutlineColor: "white",
            labelOutlineWidth: 8,
            labelAlign: "cm",
            cursor: "pointer",
            fontFamily: "sans-serif"

            }
         }),
      new OpenLayers.Rule({
         maxScaleDenominator: 27000,
         minScaleDenominator: 3384,
         symbolizer: {
            fillColor: "red",
            fillOpacity: 0.6,
            fontColor: "#000000",
            fontWeight: "light",
            pointRadius: 10,
            fontSize: "11px",
            strokeColor: "#ff9963",
            strokeWidth: 3,
            pointerEvents: "all",
            labelOutlineColor: "white",
            labelOutlineWidth: 8,
            labelAlign: "cm",
            cursor: "pointer",
            fontFamily: "sans-serif"

            }
         }),
      new OpenLayers.Rule({
         maxScaleDenominator: 3384,
         minScaleDenominator: 1,
         symbolizer: {
            fillColor: "red",
            fillOpacity: 0.6,
            fontColor: "#000000",
            fontWeight: "light",
            pointRadius: 10,
            fontSize: "11px",
            strokeColor: "#ff9963",
            strokeWidth: 3,
            label : "${name}",
            labelAlign: "cm",
            //labelAlign: "cm",
            pointerEvents: "all",
            labelOutlineColor: "white",
            labelOutlineWidth: 8,
            cursor: "pointer",
            fontFamily: "sans-serif"
            }
         })
      ]);



   /* Protocols 
   var protocol_entrance = new OpenLayers.Protocol.HTTP({
            url: "js/entrances.geojson?" + Math.random(),
            format: new OpenLayers.Format.GeoJSON({
                  extractStyles: false, 
                  extractAttributes: true
               })
            });
    * */

   var protocol_bus = new OpenLayers.Protocol.HTTP({
         url: "CrossProxy/basekmlproxy.php?output=kml&account=" + accountname + "&cmd=lastseen&detail=1&range=0&time=" + Math.random(),
            format: new OpenLayers.Format.KML({
                  extractStyles: false, 
                  extractAttributes: true
               })
   });

   var protocol_traffic = new OpenLayers.Protocol.HTTP({
         // url: "output/testgeo.json?output=geojson&account=auto&cmd=traffic&time=" + Math.random(),
         url: "CrossProxy/trafficproxy.php?" + Math.random(),
         // url: "http://traffic.synctrace.com/trafficgeo.json?" + Math.random(),
            format: new OpenLayers.Format.GeoJSON({
                  extractStyles: false, 
                  extractAttributes: true
               })
   });

   /* Strategies */
   refresh = new OpenLayers.Strategy.Refresh({force: true, active: true});
   refresh_traffic = new OpenLayers.Strategy.Refresh({force: true, active: true});
   // var cluster = new OpenLayers.Strategy.Cluster({distance: 100, threshold: 3});

   /* Layers 
   entrancelayer = new OpenLayers.Layer.Vector("Haltes", {
            styleMap: entrance_style,
            //minScale: 54168.1,
            strategies: [new OpenLayers.Strategy.Fixed()],
            //zoomOffset: 9, resolutions: [152.87405654907226, 76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
            zoomOffset: 10, resolutions: [76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
            //zoomOffset: 11,
            protocol: protocol_entrance
         });

   */
   trafficlayer = new OpenLayers.Layer.Vector("Verkeer", {
            styleMap: traffic_style,
            // minScale: 54168.1,
            // zoomOffset: 11, 
            //resolutions: [38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
            strategies: [new OpenLayers.Strategy.Fixed(), refresh_traffic],
            protocol: protocol_traffic
         });

   filterStrategy = new OpenLayers.Strategy.Filter({});

   buslayer = new OpenLayers.Layer.Vector("Posities", {
            styleMap: lastseen_style,
            //zoomOffset: 11,
            strategies: [filterStrategy, new OpenLayers.Strategy.Fixed(), refresh],
            protocol: protocol_bus
         });


   var highlightbus = new OpenLayers.Control.SelectFeature([buslayer], {
      hover: true,
      //autoActivate:true,
      highlightOnly: true,
      toggle: false,
      renderIntent: "temporary" ,
      eventListeners: {
         //beforefeaturehighlighted : destroyPopups,
         featurehighlighted: onFeatureSelect,
         featureunhighlighted: onFeatureUnselect
      }
   });

   /* Enable events for the layers(this seems not to be needed ...)  
   entrancelayer.events.on({
         "featureselected": report,
         "featureunselected": report
         });
   buslayer.events.on({
         "beforefeaturehighlighted": destroyPopups,
         "featureselected": onFeatureSelect,
         "featureunselected": onFeatureUnselect
         });
    */

   map.addLayer(buslayer);
   //map.addLayer(entrancelayer);
   trafficlayer.setVisibility(false);
   map.addLayer(trafficlayer);

   var lat = 51.238068;
   var lon = 4.411526;
   var lonLat = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
   //var lonLat = new OpenLayers.LonLat(lon, lat).transform(new OpenLayers.Projection("EPSG:4326"));
   //map.setCenter (lonLat, 11);
   //
   // var c1 = new OpenLayers.LonLat(3.54635, 50.94169, 5.47995, 51.53569);

   //var bounds = new OpenLayers.Bounds (3.54635, 50.94169 , 5.47995, 51.53569);
   bounds.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
   //bounds.toBBOX(); 
   map.zoomToExtent(bounds);

   // map.zoomToExtent(entrancelayer.getDataExtent());

   // map.numZoomLevels = null; //explicit nullification

   /* Enable highlighting  */
   map.addControl(highlightbus);
   highlightbus.activate();   

   /* The center of the world (Antwerpen) 51.238068,4.411526 , the rest is parking */
  // map.zoomToMaxExtent(lonLat);
  //
  //

  map.events.register('zoomend', this, function (event) {
    displaymsg("Scale: " + map.getScale() + " / ZoomLevel: " + map.getZoom() + " / Resolution: " + map.getResolution());
    /*
    var x = map.getZoom();

    if( x < 15) {
         //map.zoomTo(15);
    }*/
  });



  /* Now reload the data every 9 seconds */
  setInterval(function () {
        refresh.refresh();      
        //pan to extent
        //map.panTo(entrancelayer.getDataExtent().getCenterLonLat());
  },15000);

  /* Now reload the traffic data every 60 seconds */
  setInterval(function () {
        refresh_traffic.refresh();      
        //pan to extent
        //map.panTo(entrancelayer.getDataExtent().getCenterLonLat());
  },60000);

    if(loadpoi) {
        //includeJs("js/poilayer.js");
        getpoilayer();
    }

}
/* LIB */

function getwazelayer() {

   /* waze traffic alert style */
   var waze_styled = new OpenLayers.Style({
      //fillColor: "white",
      pointRadius: 5,
      //fontWeight: "normal",
      //fontColor: "#000000",
      //fontSize: "8px",
      //strokeColor: "${color}",
      //strokeDashstyle: "${stroke}",
      //externalGraphic: "${image_url}",
      externalGraphic: "/images/hazard-ed111f132551125f297b76ef4cca9101.png",
      strokeWidth: 4,
      strokeOpacity: 0.8,
      //strokeDashstyle: 'dot',
      //strokeLinecap: 'square',
      pointerEvents: "visiblePainted",
      fillOpacity: 0.6,
      cursor: "pointer",
      // label : "${speed}Km/h",
      labelOutlineColor: "white",
      labelOutlineWidth: 4,
      fontFamily: "sans-serif"
      //fontFamily: "Courier New, monospace"
   });

   var waze_style = new OpenLayers.StyleMap({
      'default' : waze_styled
   });

   refresh_waze = new OpenLayers.Strategy.Refresh({force: true, active: true});

   map.addLayer(wazelayer);

   wazelayer = new OpenLayers.Layer.Vector("Info", {
            // styleMap: traffic_style,
            // minScale: 54168.1,
            // zoomOffset: 11, 
            //resolutions: [38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508, 2.388657133579254, 1.194328566789627, 0.5971642833948135],
            strategies: [ new OpenLayers.Strategy.Fixed(), new OpenLayers.Strategy.BBOX(), refresh_waze],
            protocol: protocol_waze
         });
   /*
    */


/*
   var protocol_waze = new OpenLayers.Protocol.HTTP({
       url: "CrossProxy/waze.php",
       format: new OpenLayers.Format.GeoJSON({
            extractAttributes: true
       }),
       callback: jsonhandler
   });
*/
        new OpenLayers.Layer.Vector("Info2", {
            strategies: [new OpenLayers.Strategy.BBOX()],
            protocol: new OpenLayers.Protocol.Script({
                url: "CrossProxy/waze.php",
                callbackKey: "format_options",
                callbackPrefix: "callback:",
/*
                filterToParams: function(filter, params) {
                    // example to demonstrate BBOX serialization
                    if (filter.type === OpenLayers.Filter.Spatial.BBOX) {
                        params.bbox = filter.value.toArray();
                        if (filter.projection) {
                            params.bbox.push(filter.projection.getCode());
                        }
                    }
                    return params;
                }
*/
            })
        })

  /* Now reload the waze info every 120 seconds */
  setInterval(function () {
        refresh_waze.refresh();      
        //pan to extent
        //map.panTo(entrancelayer.getDataExtent().getCenterLonLat());
  },20000);
  /*
  */
}

function jsonhandler (request) {
            console.log(request);
/*
            var  json = new OpenLayers.Format.JSON ();
            var  response = json.read (request.responseText);
            var layer_data = response.layers
            for (var i in layer_data) {
                var layer_name = layer_data[i].title;
                //alert(layer_name);
                var layer_url = layer_data[i].url;
                //alert(layer_url);
                var layer_style = layer_data[i].style;
                //alert (layer_style);
                layer = new OpenLayers.Layer.Vector(layer_name, {
                    strategies: [new OpenLayers.Strategy.Fixed()],
                    protocol: new OpenLayers.Protocol.HTTP({
                        url: layer_url,
                        format: new OpenLayers.Format.GeoJSON({
                        })
                    }),
                    //...load stylemap
                });
                //turn layer off
                layer.styleMap = mh_style_map;
                layer.setVisibility(false);
                map.addLayer(layer);
            }
            //alert (response);
*/
        };    
  
   function onPopupClose(evt) {
      highlightbus.unselectAll();
   }

   function strcmp (str1, str2) {
     // http://kevin.vanzonneveld.net
     // +   original by: Waldo Malqui Silva
     // +      input by: Steve Hilder
     // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
     // +    revised by: gorthaur
     // *     example 1: strcmp( 'waldo', 'owald' );
     // *     returns 1: 1
     // *     example 2: strcmp( 'owald', 'waldo' );
     // *     returns 2: -1
     return ((str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1));
   }

   function onFeatureSelect(event) {
      destroyPopups(event);
      /*
      while( map.popups.length ) {
         map.removePopup(map.popups[0]);
      }
      */
      var feature = event.feature;
      if ( strcmp ('Haltes', feature.layer.name) == 0 ) {
         //console.log(feature.layer.name);
         // console.log(browser);  WTF is this, FF needs diff ret val than chrome ? 
         /*
         console.log(mybrowser.browser);  
         if ( strcmp ('Chrome', mybrowser.browser) == 0 ) {
            return false;
         } else {
            return true;
         }*/
       return true;
      }

      if ( strcmp ('Routes (DP)', feature.layer.name) == 0 ) {
       return true;
      }
      if ( strcmp ('Routes (VM)', feature.layer.name) == 0 ) {
       return true;
      }
      if ( strcmp ('Ingangen', feature.layer.name) == 0 ) {
        //console.log(this);
       return true;
      }

      var fulldetails = getdetails(feature.attributes.raw_http_data);

      var myimage = getCompassImage(feature.attributes.heading);

      var content = '<div id="plopper"><fieldset>' + "<legend>"+encHTML(feature.attributes.name) + '</legend><img src="'+ myimage +'"/><ul id="atlist">' 
         // '<li>' + encHTML(feature.attributes.description) 
         + "<li>Tijd event  : "+ feature.attributes.gps_date_local +"</li>" 
         + "<li>Snelheid    : "+ feature.attributes.speed +"</li>" 
         + fulldetails 
         + "<li>Tijd server : "+ feature.attributes.server_time +"</li>" 
         + "</ul></fieldset></div>";

      var popup = new OpenLayers.Popup.FramedCloud("chicken", 
            feature.geometry.getBounds().getCenterLonLat(),
            new OpenLayers.Size(200,200),
            content,
            null, false, onPopupClose);

      feature.popup = popup;
      popup.closeOnMove = false;

      /* TODO disable flickering */
      map.addPopup(popup);

      // $('#atlist').append("<li>" + feature.attributes.gps_date_local + "</li>");
      /*
         $('#plopper').empty();
         $('#plopper').addClass("ablock");
         $('#plopper').addClass("sectionhead");
         $('#plopper').append('<div id="details"></div>');
         $('#details').append(content);

         $('.plopper').css('background-image', image );
         $('.plopper').css('text-align','left' );
         $('.plopper').css('width','100%' );
         $('.plopper').css('height','100%' );
       */
      return 0;
   }

   function onFeatureUnselect(event) {
      var feature = event.feature;
      if(feature.popup) {
         map.removePopup(feature.popup);
         feature.popup.destroy();
         delete feature.popup;
      }
   }

   function destroyPopups(event) {
         while( map.popups.length ) {
            map.removePopup(map.popups[0]);
         }
   }


   //console.log(myfilter);
   // entrancelayer.setVisibility(false);

   /* Now the map itself 
   var map = new OpenLayers.Map({
      controls: [
         new OpenLayers.Control.Navigation(),
         new OpenLayers.Control.MousePosition(),
         new OpenLayers.Control.LayerSwitcher(),
         new OpenLayers.Control.PanZoomBar(),
         new OpenLayers.Control.Attribution(),
         new OpenLayers.Control.Permalink(),
         new OpenLayers.Control.ScaleLine(),
         new OpenLayers.Control.OverviewMap(),
        ],
        units: 'm',
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
      div: "map",
      allOverlays: false,
      layers: [
         new OpenLayers.Layer.OSM(),
         entrancelayer, buslayer
      ]
   });
   */

jQuery.fn.encHTML = function () { 
return this.each(function(){ 
   var me   = jQuery(this); 
   var html = me.html(); 
   me.html(html.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')); 
   }); 
}; 

jQuery.fn.decHTML = function () { 
return this.each(function(){ 
   var me   = jQuery(this); 
   var html = me.html(); 
   me.html(html.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')); 
   }); 
}; 

jQuery.fn.isEncHTML = function (str) { 
   if(str.search(/&amp;/g) != -1 || str.search(/&lt;/g) != -1 || str.search(/&gt;/g) != -1) {
      return true; 
   } else {
      return false; 
   }
}; 

function isEncHTML(str) {
   if(str.search(/&amp;/g) != -1 || str.search(/&lt;/g) != -1 || str.search(/&gt;/g) != -1) {
      return true;
   } else {
      return false;
   }
}

function decHTMLifEnc(str){
   if(isEncHTML(str)) {
      return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
   }
   return str;
}

function encHTML(str) {
   return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
}

/* $(".dec_if_enc").decHTMLifEnc(); */
jQuery.fn.decHTMLifEnc = function () { 
   return this.each(function () { 
      var me   = jQuery(this); 
      var html = me.html(); 
      if(jQuery.fn.isEncHTML(html)) {
         me.html(html.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')); 
      }
   }); 
};

function displaymsg(message) {
   document.getElementById("mmessage").innerHTML = message;
}

function getCompassImage(azimuth) {
      if ((azimuth >= 337 && azimuth <= 360) || (azimuth >= 0 && azimuth < 23))
      { return "images/compassN.jpg"; }
      if (azimuth >= 23 && azimuth < 68)
      { return "images/compassNE.jpg"; }
      if (azimuth >= 68 && azimuth < 113)
      { return "images/compassE.jpg"; }
      if (azimuth >= 113 && azimuth < 158)
      { return "images/compassSE.jpg"; }
      if (azimuth >= 158 && azimuth < 203)
      { return "images/compassS.jpg"; }
      if (azimuth >= 203 && azimuth < 248)
      { return "images/compassSW.jpg"; }
      if (azimuth >= 248 && azimuth < 293)
      { return "images/compassW.jpg"; }
      if (azimuth >= 293 && azimuth < 337)
      { return "images/compassNW.jpg"; }
      return "";
}

function includeJs(jsFilePath) {
    var js = document.createElement("script");

    js.type = "text/javascript";
    js.src = jsFilePath;

    document.body.appendChild(js);
}

/*
onAvailable('map', function () {
      //$('#map').on('click', function () { console.log('test'); return false; });
      //setTimeout("loadMarkers();", 3000);
      //setTimeout("loadPoiMarkers();", 3500);
});
*/
