(function(graphs) {
    "use strict";

    function init() {
        populateYears(1930, 2017);
        populateMonths();

        graphs.daily.draw("Title Text", [[[0, 5], [1, 6], [2,7]]]);
    }

    // --------------------------------------------------------------------
    // DATE LOGIC
    // --------------------------------------------------------------------

    /**
     * Populate valid months
     */
    function populateMonths() {
        var monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        var $select = $("[name='month']");
        $select.empty();

        for (var i = 1; i <= 12; i++) {
            $select.append($("<option />").val(i).text(monthNames[i-1]));
        }
    }

    /**
     * Populate the years on the page with the year range we support
     */
    function populateYears(min, max) {
        var $select = $("[name='year']");
        $select.empty();

        for (var i = min; i <= max; i++) {
            $select.append($("<option />").val(i).text(i));
        }
    }

    /**
     * Populate the amount of days in the select month, year
     */
    function populateDays($input) {
        var $select = $input.parent().find("[name='day']");
        $select.empty();

        var month = $select.parent().find("[name='month']").val();
        var year = $select.parent().find("[name='year']").val();
        var daysInMonth = new Date(year, month, 0).getDate();

        for (var i = 1; i <= daysInMonth; i++) {
            $select.append($("<option />").val(i).text(i));
        }
    }

    $("[name='day']").each(function(i, element) {
        populateDays($(element));
    });

    $("[name='month'], [name='year']").change(function(event) {
        populateDays($(event.target));
    });

    // --------------------------------------------------------------------
    // DAILY STATS
    // --------------------------------------------------------------------

    function DailyStats() {
        var that = this;
        this._loading = null;
        return {
            updateLat: function (lat) {
                // ensure we clear loading indicator
                clearInterval(that._loading);

                $(".latitude").text(lat);
            },
            updateLong: function (long) {
                // ensure we clear loading indicator
                clearInterval(that._loading);

                $(".longitude").text(long);
            },
            updateSunrise: function (time) {
                // ensure we clear loading indicator
                clearInterval(that._loading);

                $(".sunrise").text(time);
            },
            updateSunset: function (time) {
                // ensure we clear loading indicator
                clearInterval(that._loading);

                $(".sunset").text(time);
            },
            loading: function() {
                function loadingText(i) {
                    i = i % 4;
                    var text = "";
                    for (; i > 0; i--) text+=".";
                    $(".latitude, .longitude, .sunrise, .sunset").html(text);
                }

                var t = 0;
                that._loading = setInterval(function() {
                    loadingText(t++);
                }, 200);
            }
        }
    }

    function getDailySelected() {
        var selected = {
            airport: $(".daily-stats").find("[name='weather-station'] option:selected").val(),
            month: $(".daily-stats").find("[name='month'] option:selected").val(),
            day: $(".daily-stats").find("[name='day'] option:selected").val(),
            year: $(".daily-stats").find("[name='year'] option:selected").val(),
            graphType: $(".daily-stats").find("[name='graphType'] option:selected").val(),


        };

        return selected;
    }

    var dailyStats = new DailyStats();
    $(".daily-stats select").change(function() {

        graphs.daily.loading();
        dailyStats.loading();


        var selected = getDailySelected();
        console.log(selected);

        // Format: selected = { weatherStation: "gville", month: 1, day, 12, year: 2017, graphType: "temperature" }
        // console.log(selected) if you want to view contents

        // TODO: WORK ON BELOW WITH QUERY LOGIC USING selected
        var query = "SELECT * FROM TABLE";
        query = "SELECT total_precipitation, condition_date FROM daily_condition WHERE total_precipitation > '2.0' AND peak_wind_speed > '5.0'"; // A test query to make sure it works
        
        // query our server
        $.ajax({  
         	type: "GET",
         	url: "http://localhost:8080/weatherdata?data=" + query, 
         	dataType: "json",
         	success: function(result) {
                // result should contain the SQL results
                console.log(result); //result it in json format, should be easy to lookup what we need based on our schema
				
                // TODO: fill in below with results
                dailyStats.updateLat(20);
                dailyStats.updateLong(80);
                dailyStats.updateSunrise("6:00AM");
                dailyStats.updateSunset("8:00PM");

                // Check graphs.js -- draw function for what param 2 format should be
                graphs.daily.draw("Title Text", [[[0, 5], [1, 6], [2,7]]]);
            },
            error: (function(error) {
                console.error(error);
            });


        // TODO: REMOVE THIS ONCE QUERYING IS SETUP.
        // TODO: THIS IS JUST TO SHOW LOADING FEATURE
        setTimeout(function() {
            graphs.daily.draw("Title Text", [[[0, 5], [1, 6], [2,7]]]);
            dailyStats.updateLat(20);
            dailyStats.updateLong(80);
            dailyStats.updateSunrise("6:00AM");
            dailyStats.updateSunset("8:00PM");
        }, 2000);
    });

    init();
})(window.graphs = window.graphs || {});