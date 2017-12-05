(function(graphs) {
    "use strict";

    var GRAPH_DEFAULTS = {
        title: {},
        theme: "light1", // "light2", "dark1", "dark2"
        animationEnabled: true // change to true
    };

    /**
     * Graph API to work with Canvas JS
     */
    var Graph = function (id) {
        var that = this;
        this._chart = null;
        this._loading = null;

        return {
            /**
             * data must be in form [[[x1,y1], [x2,y2], [x3,y3]], [], [] ...]
             * [[[0, 5], [1, 6], [2,7]]] = one line in the chart that graphs y =  x + 5
             *
             * Graph 3 lines:
             * [
             *   [
             *      [x1,y1], [x2,y2], [x3, y3] // Series 1
             *   ],
             *   [
             *      [x1,y1], [x2,y2], [x3, y3] // Series 2
             *   ],
             *   [
             *      [x1,y1], [x2,y2], [x3, y3] // Series 3
             *   ]
             * ]
             */
            draw: function (title, data) {
                // ensure we clear loading indicator
                clearInterval(that._loading);
                var options = Object.assign({}, GRAPH_DEFAULTS);
                options.title = {
                    text: title
                };

                var plotData = [];
                var typeError = new Error("data must be called with parameter in form [[[x1,y1], [x2,y2], [x3,y3]], [], [] ...]");

                if (!Array.isArray(data)) {
                    throw typeError;
                }

                for (var i = 0; i < data.length; i++) {
                    if (!Array.isArray(data[i])) {
                        throw typeError;
                    }

                    var series = data[i];

                    var coordinates = [];
                    for (var j = 0; j < series.length; j++) {
                        coordinates.push({
                            x: series[j][0],
                            y: series[j][1]
                        })
                    }

                    plotData.push({
                        type: "line",
                        dataPoints: coordinates
                    });
                }

                options.data = plotData;

                that._chart = new CanvasJS.Chart(id, options);
                that._chart.render();
            },
            loading: function() {
                function loadingText(i) {
                    i = i % 4;
                    var text = "Loading";
                    for (; i > 0; i--) text+=".";
                    $("#" + id).html(text);
                }

                var t = 0;
                that._loading = setInterval(function() {
                    loadingText(t++);
                }, 200);
            }
        }
    };

    graphs.daily = new Graph("daily-stats-graph");
    graphs.advanced = new Graph("advanced-stats-graph");
})(window.graphs = window.graphs || {});