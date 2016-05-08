/// <reference path="../wwwroot/lib/raphael/raphael.d.ts" />
var Charts;
(function (Charts) {
    function convolution_example(x, y, width, height, raphael) {
        var middle = 0.5 * height;
        var boxSize = width / 20;
        addGrid(raphael, x, y + boxSize, 5, boxSize, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0);
        raphael.text(boxSize * 2.5, boxSize * 6.7, "i");
        addGrid(raphael, x + 6 * boxSize, y, 3, boxSize, -0.5, -0.5, -0.5, 1, 1, 1, -0.5, -0.5, -0.5);
        raphael.text(boxSize * 7.6, boxSize * 3.6, "w");
        addGrid(raphael, x + 6 * boxSize, y + boxSize * 4, 3, boxSize, -0.5, 1, -0.5, -0.5, 1, -0.5, -0.5, 1, -0.5);
        addGrid(raphael, x + 10 * boxSize, y + boxSize, 5, boxSize, 0, 0.5, 0.5, 0.5, 0, -1, -1, -1, -1, -1, 2, 2, 2, 2, 2, -1, -1, -1, -1, -1, 0, 0.5, 0.5, 0.5, 0);
        addGrid(raphael, x + 15 * boxSize, y + boxSize, 5, boxSize, 0, -1, 2, -1, 0, 0.5, -1, 2, -1, 0.5, 0.5, -1, 2, -1, 0.5, 0.5, -1, 2, -1, 0.5, 0, -1, 2, -1, 0);
        raphael.text(boxSize * 15, boxSize * 6.7, "o");
    }
    Charts.convolution_example = convolution_example;
    function addGrid(raphael, x, y, size, boxSize) {
        var values = [];
        for (var _i = 5; _i < arguments.length; _i++) {
            values[_i - 5] = arguments[_i];
        }
        var min = 10;
        var max = -10;
        for (var i = 0; i < values.length; i++) {
            min = Math.min(min, values[i]);
            max = Math.max(max, values[i]);
        }
        var scale = 255.0 / (max - min);
        for (var i = 0; i < values.length; i++) {
            var r = Math.floor(i / size);
            var c = Math.floor(i % size);
            var v = scale * (max - values[i]);
            var textColor = v < 128 ? "#fff" : "#000";
            raphael.rect(x + c * boxSize, y + r * boxSize, boxSize, boxSize).attr("fill", "rgb(" + v + "," + v + "," + v + ")");
            raphael.text(x + (c + 0.5) * boxSize, y + (r + 0.5) * boxSize, r + "" + c).attr({ "font-size": 6, "fill": textColor });
        }
    }
})(Charts || (Charts = {}));
//# sourceMappingURL=charts.js.map