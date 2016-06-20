/*
   This file is part of Rogue Vision.

   Copyright (C) 2016 Daniel Reischl, Rene Rathmann, Peter Tan,
       Tobias Dorsch, Shefali Shukla, Vignesh Govindarajulu,
       Aleksander Penew, Abinav Puri

   Rogue Vision is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   Rogue Vision is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with Rogue Vision.  If not, see <http://www.gnu.org/licenses/>.
*/



/* This file should list all main controllers */
angular.module('app')

.controller("MainController", function(){
    var vm = this;
    vm.title = "Rogue Vision";
})

/* The side navigation should appear on button click */

.controller('sideNavController', function($scope, $mdSidenav) {
    // current state of the navigation. False means that the side navigation shows only the icons
    var state = false;

    /* Initializing butto ntext inside the navigation bar  */

    $scope.home = "";
    $scope.circleView = "";
    $scope.barView = "";
    $scope.alertView = "";
    $scope.simulation = "";
    $scope.settings = "";
    $scope.help = "";
    $scope.flexView ="";

    /* this scope will be triggered when the user wants to expand the navigation bar, The function inside will simply set the state to ture or false.
       and also the string inside the variables.
    */

    $scope.toggleSidebar = function() {
        if(state) {
            $scope.home = "";
            $scope.circleView = "";
            $scope.barView = "";
            $scope.alertView = "";
            $scope.simulation ="";
            $scope.settings = "";
            $scope.help = "";
            $scope.flexView = "";
            state = false;
        } else {
            $scope.home = "Home";
            $scope.circleView = "Circle Chart View";
            $scope.barView = "Bar Chart View";
            $scope.alertView = "Alert";
            $scope.simulation = "Simulation";
            $scope.settings = "Settings";
            $scope.help  = "Help";
            $scope.flexView = "Flexibility View";
            state = true;
        }
    }

    /* This scope will set the style, depending on the state variable. The style changes the width of the navigation sidebar */

    $scope.sideNavStyle = function() {
        var styleIcon = {"width": "50px", "height":"100%", "background-color": "#009688" }
        var styleFull = {"width": "200px", "height":"100%", "background-color": "#009688"}

        if(state) {
            return styleFull;
        } else {
             return styleIcon;
        }

    }
})

/* controller for the compareGraph. Should display the comparison chart with all the carriers the user wants to compare*/
.controller('compareCircleGraph', function($scope, carrierService, percentageService) {


    // Get the array with the carriers that were selected from the carrierService
    var carrierCompareList = carrierService.getCarrier();

    // y-Axis labels for the dimensions
    var yAxisLabels = {'energyConsumption': 'Energy Consumption in W',
		       'positionAbsolute' : 'Position in mm',
		       'speed': 'Speed in m/s',
		       'acceleration': 'Acceleration in m/s*s',
		       'drive': 'Drive'};

    var units = {'energyConsumption': 'W',
		       'positionAbsolute' : 'mm',
		       'speed': 'm/s',
		       'acceleration': 'm/s*s',
		       'drive': 'Drive'};

    // make percentage service available in html-view
    // not very nice, try to refactor if possible
    $scope.percentageService = percentageService;
    
    // default value for the dimension and yAxislabel
    var selectedDimension = "energyConsumption"; // remove this later
    $scope.selectedDimension = "energyConsumption";
    var yAxisLabel = yAxisLabels[selectedDimension];

    // default value for the selected Iterations
    var selectedIteration = "last"; // remove this later
    $scope.selectedIteration = "last";

    // the session requested from the database. For now it is fixed.
    var session = 1;

    //a string, which tells the database how many carrier the user is requesting.
    var carriersRequested = "";

    // Get the maxAmount of Carriers from the database and save it in a variable called amountOfCarriers
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", 'django/dataInterface/values.request?session='+session+'&carrier=1&iteration=1&value=amountOfCarriers', false );
    xmlHttp.send(null);
    var amountOfCarriers = xmlHttp.responseText;

    // Get the last iteration database and save it
    var xmlHttp2 = new XMLHttpRequest();
    xmlHttp2.open( "GET", 'django/dataInterface/values.request?session='+session+'&carrier=1&iteration=1&value=lastIteration', false );
    xmlHttp2.send(null);
    var amountOfIterations = xmlHttp2.responseText;

    //create an array depending on the amount of carriers. The items of the array will be used to initialize the checkboxes.
    $scope.carriers = [];
    for (var idCounter = 1; idCounter <= amountOfCarriers;idCounter++) {
	var currentSelected = carrierService.hasCarrier(idCounter);
        $scope.carriers.push({id:idCounter, selected:currentSelected});
    }

    //
    // Start of $scope
    //
    //Updates the current timestamp
    $scope.ts = new Date();

    $scope.dimensions = [
        {name : "Energy Consumption", id: 'energyConsumption'},
        {name : "Position", id: 'positionAbsolute'},
	{name : "Speed", id: 'speed'},
	{name : "Acceleration", id: 'acceleration'},
	{name : "drive", id : 'drive'},
    ]

    $scope.iterationDimensions = [
        {name : 'Last', id : 'last'},
	{name : 'Last 3', id : 'lastThree'},
        {name : "Last 10", id: 'lastTen'},
        {name : "All", id: 'all'}
    ]

    // Creates the dygraph from a data source and applies options to them
    $scope.createCompareGraph = function() {

        //ensure that the variable is empty, before saving the new request path into it
        //var carriersRequested = "";

	$scope.carriersRequested = function() {
	    // filter for the selected carriers
	    var selected = $scope.carriers.filter(function(carrier){return carrier.selected;});

	    //join them with commas
	    
	    return selected.map(function(carrier){return carrier.id.toString();}).join();
	}

        // the url which should be requested will be defined in requestedUrl
        // to allow to export the csv file the variable is defined as a $scope variable
        $scope.requestedUrl = 'django/dataInterface/continuousData.csv?carriers='+ $scope.carriersRequested() + '&iterations=' + $scope.getSelectedIterationsString() + '&dimension=' + $scope.selectedDimension + '&session=1';

        graph = new Dygraph(
	        document.getElementById("compareGraph"),$scope.requestedUrl,
	            {title: yAxisLabels[$scope.selectedDimension],
	            ylabel: yAxisLabels[$scope.selectedDimension]+' in '+units[$scope.selectedDimension],
	            xlabel: 'time in ms',
	            labelsSeparateLines: true,
	            highlightSeriesOpts: {strokeWidth: 4, strokeBorderWidth: 1, highlightCircleSize: 5},
	            legend: "always",
	            /*labelDiv looks for an element with the given id and puts the legend into this element.
	            Therefore the legend will not bis displayed inside the graph */
	            labelsDiv: document.getElementById("compareGraphLegend"),
	            /* formatting the x axis label in the legend. Now it will display not only the value but also a text */
	            axes: {
	                x: {
                         valueFormatter: function(x) {
                            return x + ' ms';
                        },
                    },
                }
	            });

        $scope.ts = new Date();

    }

    $scope.getListStyle = function(index) {
	if (index % 5 == 1) {
            return {'clear': 'left'};
	}
	else {
            return {};
	}
    }
    


    // This function empties the carriers in the comparison on page leave.
    // If the user leaves the current html snippet/template then,
    // this function will notice that and trigger the function "emptyCarrierArray"
    $scope.$on("$destroy", function() {
        carrierService.emptyCarrierArray();
    });

    //
    // Start of function
    //

    $scope.getSelectedIterationsString = function() {
        var selectedIterations = [];
	var selectedNumber;
	// TODO: add the possibility to select individual iterations
	switch ($scope.selectedIteration) {
	case "last":
	    selectedNumber = 1;
	    break;
	case "lastThree":
	    selectedNumber = 3;
	    break;
	case "lastTen":
	    selectedNumber = 10;
	    break;
	default:
	    selectedNumber = 1;
	}
	
	for (var i = amountOfIterations; i > amountOfIterations - selectedNumber && i >= 1; i--) {
	    selectedIterations.push(i);
	}
	// join with comma and return
	return selectedIterations.join();
    }

})


/* controller for the AverageEnergyConsumption Chart. This chart will display the data over iterations. The user can select
which kind of data he wants to see. The default value is average energy consumption.*/
    .controller('AverageEnergyConsumptionChart', function($scope, carrierService, percentageService) {

    // get the array with the carriers the user wants to see in the graph.
    var carrierCompareList = carrierService.getCarrier();

    // y-Axis labels for different dimensions
    var yAxisLabels = {'energyConsumptionAverage' : 'Average Energy Consumption',
		       'accelerationAverage' : 'Average Acceleration',
		       'speedAverage': 'Average Speed',
		       'energyConsumptionTotal': 'Total Energy Consumption' };

    var units = {'energyConsumptionAverage': 'W',
		 'accelerationAverage' : '?',
		 'speedAverage': '?',
		 'energyConsumptionTotal': 'W' };

    // Sets the initial time for the time stamp
    $scope.ts = new Date();

    // default value for the dimension and yAxislabel
    $scope.selectedDimension = "energyConsumptionAverage";
    

    $scope.selectedIteration = "last10";

    // the session requested from the database. For now it is fixed.
    var session = 1;

    //a string, which tells the database how many carrier the user is requesting.
    var carriersRequested = "";

    // Get the maxAmount of Carriers from the database and save it in a variable called amountOfCarriers
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", 'django/dataInterface/values.request?session='+session+'&carrier=1&iteration=1&value=amountOfCarriers', false );
    xmlHttp.send(null);
    var amountOfCarriers = xmlHttp.responseText;

    //create an array depending on the amount of carriers. The items of the array will be used to initialize the checkboxes.
    $scope.carriers = [];
    for (var idCounter = 1; idCounter <= amountOfCarriers;idCounter++) {
	var currentSelected = carrierService.hasCarrier(idCounter);
        $scope.carriers.push({id:idCounter, selected:currentSelected});
    }
    
    /**
    var arrayCarrier = [];
    var idCounter = 1;
    while(arrayCarrier.length < amountOfCarriers ) {
        arrayCarrier.push(idCounter);
        idCounter++;
    }
    */
    
    /* Filling the Dropdown menues with the items of the array. The number of checkboxes depend on the amount of carriers in the database*/
    //$scope.arrayCarrier = arrayCarrier;

    // showCheckBoxes is at startup false, because the checkboxes should be hidden.
    //$scope.showCheckBoxes = false;

    // When the user clicks on the Button, showCheckBoxes changes to true/false, depending on the previous state.
    //$scope.toggle = function(){
    //    $scope.showCheckBoxes = !$scope.showCheckBoxes;
    //}

    // This function is called, when a change is made in the checkbox field.

    /*
    $scope.changeCarrierToCompare = function(event) {
        //if the carrier is already inside the comparison array, then it will be removed.
        if(!carrierService.addCarrier(event.target.id)) {
            carrierService.deleteCarrier(event.target.id);
            document.getElementById(event.target.id).checked = false;
        } else {
            document.getElementById(event.target.id).checked = true;
        }
    }
    */

    // create the dropdown menu for iterations. the id is corresponding to the key word used in the database to extract the dimension.
    $scope.iterationDimensions = [
        {name : "Last 10 Iterations", id : 'last10'},
        {name : "Last 3 Iterations", id : 'last3'},
        {name : "All", id : 'all'}
    ]

    // create the dropdown menu for dimensions. the id is corresponding to the key word used in the database to extract the dimension.
    $scope.dimensions = [
        {name : "Average Energy Consumption", id : 'energyConsumptionAverage'},
        {name : "Average Acceleration", id : 'accelerationAverage'},
	{name : "Average Speed", id: 'speedAverage'},
	{name : "Total Energy Consumption", id: 'energyConsumptionTotal'}
    ]

    // make percentage service available in html-view
    // not very nice, try to refactor if possible
    $scope.percentageService = percentageService;

     // This function receives the changes from the dropDown menu "dimensions" and changes the yAxis name of the graph and requests the needed data by changing the string name.
    // $scope.changeDimension = function() {
    //	    selectedDimension = $scope.selectedDimension;
    //	 }

    /* this functions creates the dygraph  from a data source and applies options to them*/

    $scope.createAverageEnergyConsumptionChart = function() {

        //ensure that the variable is empty, before saving the new request path into it
        //carriersRequested = "";
        /* these loops have the purpose to see what carriers the user wants to compare
        and change request String path for the database. It will also set all checkboxes to true, which are corresponding to the carriers
        in the compare array */
	/*
        if(carrierCompareList.length != 0) {
            for (var i = 0; i < carrierCompareList.length; i++) {
                for (var carrier = 1; carrier <= amountOfCarriers; carrier++) {
                    if (carrierCompareList[i].carrierNumber == carrier) {
                        if(carriersRequested === "") {
                            carriersRequested+=carrier;
                        } else {
                            carriersRequested+= ","+carrier+"";
                        }
                        break;
                    } else {
                    }
                }
            }
        } else {
            alert("You did not chose any Carriers to compare")
        }
	*/

	$scope.carriersRequested = function() {
	    // filter for the selected carriers
	    var selected = $scope.carriers.filter(function(carrier){return carrier.selected;});

	    //join them with commas
	    
	    return selected.map(function(carrier){return carrier.id.toString();}).join();
	}
	
        // create the graph with the parameters set. The request path for the database depends on 3 parameters: session, carrierRequested, selectedDimension and type
        // the url which should be requested wil be defined in requestedUrl
        // to allow to export the csv file the variable is defined as a $scope variable
        $scope.requestedUrl = 'django/dataInterface/averageEnergyConsumption.csv?session='+session+'&carriers='+$scope.carriersRequested()+'&dimension='+$scope.selectedDimension+'&type=last10';

        graph = new Dygraph(
	       document.getElementById("AverageEnergyConsumptionChart"),$scope.requestedUrl ,
	                                                                                     {title: yAxisLabels[$scope.selectedDimension],
	                                                                                      ylabel: yAxisLabels[$scope.selectedDimension]+' in '+units[$scope.selectedDimension],
	                                                                                      xlabel: 'Iteration',
	                                                                                      labelsSeparateLines: true,
	                                                                                      highlightSeriesOpts: {strokeWidth: 4, strokeBorderWidth: 1, highlightCircleSize: 5},
	                                                                                      legend: "always",
	                                                                                      /*labelDiv looks for an element with the given id and puts the legend into this element.
	                                                                                       Therefore the legend will not bis displayed inside the graph */
	                                                                                      labelsDiv: document.getElementById("compareAverageEnergyConsumptionGraphLegend"),
	                                                                                      /* formatting the x axis label in the legend. Now it will display not only the value but also a text */
	                                                                                      axes: {
	                                                                                        x: {
                                                                                                valueFormatter: function(x) {
                                                                                                    return 'Iteration ' + x;
                                                                                                },
                                                                                            },
                                                                                          }
	                                                                                      });

	$scope.getListStyle = function(index) {
	    if (index % 5 == 1) {
		return {'clear': 'left'};
	    }
	    else {
		return {};
	    }
	}
        // After the graph has been plotted, the compareCarrier Array will be emptied and the checkboxes reseted.
        //carrierService.emptyCarrierArray();
        //uncheckAllCheckboxes();

        // Updates the  time for the time stamp
        $scope.ts = new Date();
    }

    /*
    function uncheckAllCheckboxes() {
        var checkboxElements = document.getElementsByTagName('input');
        for (var i = 0; i < checkboxElements.length; i++) {
            if(checkboxElements[i].type == 'checkbox') {
                 checkboxElements[i].checked = false;
            }
        }
    }
    */
     /* This function empties the carriers in the comparison on page leave.
     If the user leaves the current html snippet/template then, this function will notice that and trigger the function "emptyyCarrierArray" */
    $scope.$on("$destroy", function(){
         carrierService.emptyCarrierArray();
     });

})
   

/* Refresh the circle Page. The purpose of this controller is listen to the Button
 and upon receiving an event, it should trigger the update circle button*/
.controller('circleGraphController', function($scope, $compile, $mdDialog, $mdMedia, $timeout, $mdSidenav, carrierService) {
    // Initializes time stamp
    $scope.ts = new Date();
/* This function will highlight the carrier and save the id of the carrier inside the comaprison arrary in app.service.js*/
    $scope.selectCarrier = function(event) {
        // id = carrier x
        var id = event.target.id;
        // This method is necessary, because the string is "carrier x" To extract x, I need to get the subsstring
        var carrierId = id.substr(7, 8);

        //var circle = document.getElementById("carrier " + carrierId);
        var canvas = document.getElementById(id);
        var context = canvas.getContext('2d');
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        var radius = 70;

        //check if carrier is already in list.
        if(!carrierService.addCarrier(carrierId)) {
            //Already in the list, remove the highlight
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            context.lineWidth = 9;
            context.strokeStyle = "#ECEFF1";
            context.stroke();

            //If it exists delete the carrier
            carrierService.deleteCarrier(carrierId);
        } else {
            //Not in the list, highlight
            context.beginPath();
            context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            context.lineWidth = 7;
            context.strokeStyle = "#003300";
            context.stroke();
        }
    }

    $scope.refresh = function() {
        // Redraw circles
        circleGraph();
        //Update the timestamp
        $scope.ts = new Date();
    }

/* create the circle page upon page load. */
    $scope.circleGraph = function() {
    /* open connection to the REST API from the middleware and get the amount of carriers.
       After receiving the data, the integer variable will be saved inside of amountOfCarriers
    */
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", 'django/dataInterface/values.request?session=1&carrier=1&iteration=1&value=amountOfCarriers', false );
    xmlHttp.send(null);
    var amountOfCarriers = xmlHttp.responseText;
    /* ID of first Carrier */
    var idCounter = 1;
    // the array variable where the converted content from the csv file will be.
    var carrierPercentageData;
    // get the csv files with the percentages from the middleware, extract the exact array and save it into a variable.
    Papa.parse('django/dataInterface/percentages_creeping.csv?session=1', { download: true,
                                                                   dynamicTyping: true,
                                                                   complete: function(results) {
                                                                       carrierPercentageData =results.data[1];
                                                                   }
                                                                  }
    )

    //delay the creation of the circles by 1 second, so that the percentage data can be loaded into the function.
    $timeout(createCarrierHTML, 1000);

    // function to create HTML circle fragments dynamically
    function createCarrierHTML() {

        /* for every carrier in the database, create a new code fragment to be injected into the html file. Each fragment is the base for a circle */
        while (amountOfCarriers > 0) {
            var circleId = "carrier " + idCounter;
            var fragmenthtml = '<canvas class="circleDashboard" id="'+circleId+'" ng-click="selectCarrier($event)"></canvas>';
            var temp = $compile(fragmenthtml)($scope);

            // get the element in the html page, on which the new fragment should be appended to
            angular.element(document.getElementById('circleGraphs')).append(temp);

            // call the circle drawing method to paint the circles. It will get the ID of the carrier, as well as the percentage data
            createCircle(circleId, carrierPercentageData[idCounter - 1]);

            idCounter = idCounter+1;
            amountOfCarriers = amountOfCarriers -1;
        }
    }

    /*  This function will create the circles, depending on the input parameters from the database*/
    function createCircle(carrier, percentageOfEnergy) {
        var canvas = document.getElementById(carrier);
        var context = canvas.getContext('2d');
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
        var radius = 60;

        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.lineWidth = 2;
        context.strokeStyle = '#003300';
        context.stroke();

        /* Logic of the color: if the percentage of a carrier is above 1.05 it will be coded red,
           because the energy consumption of the last iteration is too high in comparison to the
           first iteration. If the value is < 1.025, then the color will be green, because the energy
           consumption is not really increasing much.
           Any value between is coded yellow, because it should warn the user, that the energy
           is higher than the very first iteration.
         */
        if(percentageOfEnergy > 1.05) {
            context.fillStyle = '#FF1744';
        } else if(percentageOfEnergy <= 1.025 ) {
            context.fillStyle = '#00BFA5';
        } else {
            context.fillStyle = "#FFFF8D";
        }

        context.fill();
        context.lineWidth = 5;
        context.lineWidth = 1;
        context.fillStyle = "#212121";
        context.lineStyle = "#212121";
        context.font = "15px sans-serif";
        // textAllign center will allign the text relative to the borders of the canvas
        context.textAlign = 'center';
        context.fillText(carrier, centerX, centerY - 7);
        context.fillText((percentageOfEnergy*100).toFixed() + "%", centerX, centerY + 12);
    }
}

})

.controller('sessionDataTable', function($scope, $http) {
    $http.get("django/dataInterface/rawData.json?table=sessiondata")
    .then(function (response) {$scope.names = response.data.records;});
})

/* bar chart View controller */

.controller('barGraphController',function($scope,$timeout, carrierService) {
    $scope.barGraph = function() {


        // Requesting the number of carriers from the REST API
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", 'django/dataInterface/values.request?session=1&carrier=1&iteration=1&value=amountOfCarriers', false );
        xmlHttp.send(null);
        // the variable where the amount of carriers is saved to
        var amountOfCarriers = xmlHttp.responseText;
        // the array variable where the converted content from the csv file will be.
        var carrierPercentageData;
        // get the csv files with the percentages from the middleware, extract the exact array and save it into a variable.
        Papa.parse('django/dataInterface/percentages_creeping.csv?session=1', { download: true,
                                                                       dynamicTyping: true,
                                                                       complete: function(results) {
                                                                           carrierPercentageData =results.data[1];
                                                                       }
                                                                      }
        )

        // this array saves the percentage of each bar column/carrier
        var carrierPercentageDataRounded = [];
        // this array saves the color of each bar column/carrier
        var carrierColorArray = [];
        // this array saves the names of each bar column/carrier
        var carrierArray = [];
        /* ID of first Carrier */
        var idCounter = 1;

        // timer is set to 1 second. this wait time is needed to fetch all data from the database
        $timeout(createBarChartView, 1300);

        function createBarChartView() {
            // This while loop will fill the carrierArray with carrier names for the chart label
            while (amountOfCarriers > 0) {
                carrierArray.push("carrier " + idCounter)
                idCounter = idCounter+1;
                amountOfCarriers = amountOfCarriers -1;
            }

            /*  This for loop will round the percentage data and save it into a new array.
                It will also fill the color array with the color, corresponding to the percentage of
                the carrier. E.g. green is up to 102,5% , yellow is up 102,5 to 105% and everything above is red
            */
            for(i = 0; i < carrierPercentageData.length; i++) {
                if(carrierPercentageData[i] > 1.05) {
                    carrierColorArray.push('rgba(255,23,68, 0.8)')
                    carrierPercentageDataRounded.push((carrierPercentageData[i]*100).toFixed())
                } else if(carrierPercentageData[i] <= 1.025 ) {
                    carrierColorArray.push('rgba(0,191,165, 0.8)')
                    carrierPercentageDataRounded.push((carrierPercentageData[i]*100).toFixed())
                } else {
                    carrierColorArray.push('rgba(255,255,141, 0.8)')
                    carrierPercentageDataRounded.push((carrierPercentageData[i]*100).toFixed())
                }
            }

            /*  get the element where the bar chart should be displayed and
                create the chart with different parameters.
            */
            var ctx = document.getElementById("barChart");
            var myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: carrierArray,
                        datasets: [{
                            label: 'Energy Consumption in %',
                            data: carrierPercentageDataRounded,
                            backgroundColor: carrierColorArray,
                            borderColor: '(31,27,28, 0.8)',
                            borderWidth: 1,
                        }]
                },
                options: {
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero:true
                            }
                        }]
                    },
                }
            });
        }
    }
})

.controller('simulationPageController', function($scope, $http) {

    // This saves all Data File Names that are stored on the server
    $scope.dataFileNames = getArrayOfDataFiles();

    // Standard Values
    $scope.amountOfCarriers = 15;
    $scope.waitForCompression = 0;
    $scope.waitForFirstDataLoad = 30;
    $scope.waitForDataReload = 30;
    $scope.keepEveryXRows = 100

    //Starts the simulation by calling the website link
    $scope.startSimulation = function() {
           var urlString = 'django/dataInterface/simulation.start?wtSimulation=' + $scope.waitForCompression + '&wtFirstDataload=' + $scope.waitForFirstDataLoad + '&wtDataReload=' + $scope.waitForDataReload + '&amountOfCarriers=' + $scope.amountOfCarriers + '&fileName=InitialData/' + $scope.selectedDataFile  + '&keepEveryXRows=' + $scope.keepEveryXRows
           var xmlHttp = new XMLHttpRequest();
           xmlHttp.open( "GET", urlString, false);
           xmlHttp.send(null);
           var returnString  = xmlHttp.responseText;

           alert("Simulation started!");

    };

    // This gets all Data File Names that are stored on the server
    function getArrayOfDataFiles() {

        // Gets the full string of all datapaths of all data files on the server
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", 'django/dataInterface/simulation.files', false);
        xmlHttp.send(null);
        var string  = xmlHttp.responseText;

        // Seperates the comma seperated data files string to an array
        var arraySimulationFileNames = string.split(',');

        // Delets the file path for every file name so that only the file name is displayed
        for (var i = 0; i < arraySimulationFileNames.length; i++) {
            arraySimulationFileNames[i] = arraySimulationFileNames[i].substring(32);
        }

        // returns an array with all FileNames
        return arraySimulationFileNames;

    }
})