(function(graphs) {
    "use strict";

    var QUERY_URL = "http://localhost:8080/weatherdata?data=";

    function init() {
        $.when(populateDates(), populateLocations()).done(function () {
            dailyStats.displaySelected();
            displayAdvancedSelected();
        });
    }

    // --------------------------------------------------------------------
    // DATE LOGIC
    // --------------------------------------------------------------------

    function populateDates() {
        var query = "select max(EXTRACT(year from condition_date)) as max, min(EXTRACT(year from condition_date)) as min";
        query += " from DAILY_CONDITION";
        return $.getJSON(QUERY_URL + query)
            .done(function(result) {
                result = result[0];
                populateYears(result.MIN+1, result.MAX);
                populateMonths();
            });
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
                        var data = [[]];
                        var series = data[0];
                        for (var i = 0; i < result.length; i++) {
                            series.push([new Date(result[i]["TIME"]).getTime(), result[i][selected.graphType.toUpperCase()]])
                        }

                        var titleText = getDailyGraphTitle();

                        graphs.daily.draw(titleText, data);
                    });
            }
        }
    }

    function getDailyGraphTitle() {
        var selected = $(".daily-stats option:selected");
        var title = "";

        selected.each(function() {
            title += " - " + $( this ).text().substr(0, 20);
        });

        return title.substr(2, title.length - 2);
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

    // --------------------------------------------------------------------
    // ADVANCED STATS
    // --------------------------------------------------------------------

    function getAdvancedSelected() {
        var selected = {
            airport: $(".advanced-stats").find("[name='weather-station'] option:selected").val(),
            from: {
                month: $(".advanced-stats .from-date").find("[name='month'] option:selected").val(),
                day: $(".advanced-stats .from-date").find("[name='day'] option:selected").val(),
                year: $(".advanced-stats .from-date").find("[name='year'] option:selected").val()
            },
            to: {
                month: $(".advanced-stats .to-date").find("[name='month'] option:selected").val(),
                day: $(".advanced-stats .to-date").find("[name='day'] option:selected").val(),
                year: $(".advanced-stats .to-date").find("[name='year'] option:selected").val(),
            },
            average: $(".advanced-stats").find("[name='average']").is(':checked'),
            min: $(".advanced-stats").find("[name='min']").is(':checked'),
            max: $(".advanced-stats").find("[name='max']").is(':checked'),
            graphType: $(".advanced-stats").find("[name='graphType'] option:selected").val(),
            stepSize: $(".advanced-stats").find("[name='stepSize'] option:selected").val()


        };

        return selected;
    }

    function getAdvancedGraphTitle() {
        var selected = $(".advanced-stats option:selected");
        var title = "";

        selected.each(function() {
            title += " - " + $( this ).text().substr(0, 20);
        });

        return title.substr(2, title.length - 2);
    }

    var advancedLoadingInterval = null;
    function displayAdvancedSelected() {
        if (!advancedLoadingInterval) {
            advancedLoadingInterval = graphs.advanced.loading();
        }

        var selected = getAdvancedSelected();

        if (!selected.max && !selected.min && !selected.average) {
            clearInterval(advancedLoadingInterval);
            advancedLoadingInterval = null;

            $("#advanced-stats-graph").html("No AGGREGATE selected...");
            return;
        }

        var fromDate = selected.from.day + "-" + selected.from.month + "-" + selected.from.year;
        var toDate = selected.to.day + "-" + selected.to.month + "-" + selected.to.year;

        var query = "SELECT ";

        if (selected.stepSize === "daily") {
            query += "condition_date as time";
        } else if (selected.stepSize === "monthly") {
            query += "EXTRACT(month FROM condition_date) \"MONTH\"";
            query += ", EXTRACT(year FROM condition_date) \"YEAR\"";
        } else if (selected.stepSize === "yearly") {
            query += "EXTRACT(year FROM condition_date) \"YEAR\"";
        } else {
            throw new Error("Bad stepSize selected. got:" + selected.stepSize);
        }

        if (selected.max) {
            query += ", Max(" + selected.graphType + ") as max";
        }

        if (selected.min) {
            query += ", Min(" + selected.graphType + ") as min";
        }

        if (selected.average) {
            query += ", Avg(" + selected.graphType + ") as avg";
        }

        query += " FROM hourly_condition";
        query += " WHERE id='" + selected.airport + "'";
        query += " AND condition_date >= TO_DATE('" + fromDate + "', 'dd-mm-yyyy')";
        query += " AND condition_date <= TO_DATE('" + toDate + "', 'dd-mm-yyyy')";

        if (selected.stepSize === "daily") {
            query += " GROUP BY condition_date";
            query += " ORDER BY condition_date ASC";
        } else if (selected.stepSize === "monthly") {
            query += " GROUP BY EXTRACT(MONTH FROM condition_date), EXTRACT(YEAR FROM condition_date)";
            query += " ORDER BY YEAR, MONTH ASC";
        } else if (selected.stepSize === "yearly") {
            query += " GROUP BY EXTRACT(YEAR FROM condition_date)";
            query += " ORDER BY YEAR ASC";
        } else {
            throw new Error("Bad stepSize selected. got:" + selected.stepSize);
        }

        $.getJSON(QUERY_URL + query)
            .done(function (result) {
                var seriesMax = [];
                var seriesMin = [];
                var seriesAvg = [];

                for (var i = 0; i < result.length; i++) {
                    var x;

                    if (selected.stepSize === "daily") {
                        x = new Date(result[i]["TIME"]).getTime();
                    } else if (selected.stepSize === "monthly") {
                        x = new Date(result[i]["YEAR"], result[i]["MONTH"]-1).getTime();
                    } else if (selected.stepSize === "yearly") {
                        x = new Date(result[i]["YEAR"], 0, 1).getTime();
                    } else {
                        throw new Error("Bad stepSize selected. got:" + selected.stepSize);
                    }

                    if (selected.max) {
                        seriesMax.push([x, result[i]["MAX"]]);
                    }

                    if (selected.min) {
                        seriesMin.push([x, result[i]["MIN"]]);
                    }

                    if (selected.average) {
                        seriesAvg.push([x, result[i]["AVG"]]);
                    }
                }

                var data = [];
                var labels = [];
                if (selected.max) {
                    data.push(seriesMax);
                    labels.push("MAX");
                }

                if (selected.average) {
                    data.push(seriesAvg);
                    labels.push("AVG");
                }

                if (selected.min) {
                    data.push(seriesMin);
                    labels.push("MIN");
                }

                var titleText = getAdvancedGraphTitle();

                graphs.advanced.draw(titleText, data, labels);
                advancedLoadingInterval = null;
            });
    }

    $(".advanced-stats select, .advanced-stats input").change(displayAdvancedSelected);

    // --------------------------------------------------------------------
    // INITIALIZE
    // --------------------------------------------------------------------

    init();
})(window.graphs = window.graphs || {});