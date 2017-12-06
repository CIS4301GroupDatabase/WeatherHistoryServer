(function(graphs) {
    "use strict";

    var QUERY_URL = "http://localhost:8080/weatherdata?data=";

    function init() {
        $.when(populateDates(), populateLocations()).done(dailyStats.displaySelected);

        graphs.advanced.loading();
    }

    // --------------------------------------------------------------------
    // DATE LOGIC
    // --------------------------------------------------------------------

    function populateDates() {
        // TODO POPULATE MIN / MAX DATE
        // var query = "SELECT * FROM daily_condition WHERE rownum = 1";
        // return $.getJSON(QUERY_URL + query)
        //     .done(function(result) {
        //         populateYears(2008, 2017);
        //         populateMonths();
        //     });

        populateYears(2008, 2017);
        populateMonths();

        // TODO Remove with above is fixed
        return $.Deferred().resolve();
    }

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
            $select.append($("<option />").val(i < 10 ? ("0" + String(i)) : i).text(monthNames[i-1]));
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
            $select.append($("<option />").val(i < 10 ? ("0" + String(i)) : i).text(i));
        }
    }

    $("[name='day']").each(function(i, element) {
        populateDays($(element));
    });

    $("[name='month'], [name='year']").change(function(event) {
        populateDays($(event.target));
    });

    // --------------------------------------------------------------------
    // LOCATIONS
    // --------------------------------------------------------------------


    function populateLocations() {
        var query = "SELECT * FROM weather_station";
        query += " JOIN location ON weather_station.id = location.id";
        return $.getJSON(QUERY_URL + query)
            .done(function(result) {
                var $select = $("[name='weather-station']");
                $select.empty();

                for (var i = 0; i < result.length; i++) {
                    $select.append($("<option />").val(result[i].ID).text(result[i].NAME));
                }
            });
    }

    // --------------------------------------------------------------------
    // DAILY STATS
    // --------------------------------------------------------------------

    var _dailyStatsLoader = null;
    function DailyStats() {
        var that = this;
        this._lastAirport = null;
        return {
            updateLat: function (lat) {
                // ensure we clear loading indicator
                clearInterval(_dailyStatsLoader);

                $(".latitude").text(lat);
            },
            updateLong: function (long) {
                // ensure we clear loading indicator
                clearInterval(_dailyStatsLoader);

                $(".longitude").text(long);
            },
            updateSunrise: function (time) {
                // ensure we clear loading indicator
                clearInterval(_dailyStatsLoader);

                time = new Date(time);
                var timeString = time.getHours() < 9 ? ("0" + time.getHours()) : time.getHours();
                timeString += ":";
                timeString += time.getMinutes() < 9 ? ("0" + time.getMinutes()) : time.getMinutes();

                $(".sunrise").text(timeString);
            },
            updateSunset: function (time) {
                // ensure we clear loading indicator
                clearInterval(_dailyStatsLoader);

                time = new Date(time);
                var timeString = time.getHours() < 9 ? ("0" + time.getHours()) : time.getHours();
                timeString += ":";
                timeString += time.getMinutes() < 9 ? ("0" + time.getMinutes()) : time.getMinutes();

                $(".sunset").text(timeString);
            },
            loading: function() {
                function loadingText(i) {
                    i = i % 4;
                    var text = "";
                    for (; i > 0; i--) text+=".";

                    if (!that._lastAirport) {
                        $(".latitude, .longitude").html(text);
                    }
                    $(".sunrise, .sunset").html(text);
                }

                var t = 0;
                _dailyStatsLoader = setInterval(function() {
                    loadingText(t++);
                }, 200);
            },
            displaySelected: function() {
                graphs.daily.loading();
                dailyStats.loading();

                var selected = getDailySelected();

                // Lat / Long
                // We only need Lat / Long if location has changed
                if (selected.airport !== that._lastAirport) {
                    var query = "SELECT * FROM location";
                    query += " WHERE id='" + selected.airport + "'";

                    // query our server
                    $.getJSON(QUERY_URL + query)
                        .done(function (result) {
                            result = result[0];

                            dailyStats.updateLat(result["LATITUDE"]);
                            dailyStats.updateLong(result["LONGITUDE"]);

                            that._lastAirport = selected.airport;
                        });
                }

                var date = selected.day + "-" + selected.month + "-" + selected.year;

                // Sunrise / Sunset
                var query = "SELECT * FROM daily_condition";
                query += " WHERE id='" + selected.airport + "'";
                query += " AND condition_date = TO_DATE('" + date + "', 'dd-mm-yyyy')";
                $.getJSON(QUERY_URL + query)
                    .done(function (result) {
                        result = result[0];

                        dailyStats.updateSunrise(result["SUNRISE_TIME"]);
                        dailyStats.updateSunset(result["SUNSET_TIME"]);
                    });

                // graph
                var query = "SELECT time," + selected.graphType;
                query += " FROM HOURLY_CONDITION";
                query += " WHERE id='" + selected.airport + "'";
                query += " AND condition_date = TO_DATE('" + date + "', 'dd-mm-yyyy')";
                $.getJSON(QUERY_URL + query)
                    .done(function (result) {
                        console.log(result);

                        var data = [[]];
                        var series = data[0];
                        for (var i = 0; i < result.length; i++) {
                            series.push([new Date(result[i]["TIME"], result[i][selected.graphType.toUpperCase()])])
                        }


                        // Check graphs.js -- draw function for what param 2 format should be
                        graphs.daily.draw("Title Text", [[[0, 5], [1, 6], [2, 7]]]);
                    });
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
    $(".daily-stats select").change(dailyStats.displaySelected);

    init();
})(window.graphs = window.graphs || {});