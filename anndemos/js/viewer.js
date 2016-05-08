/// <reference path="../wwwroot/lib/raphael/raphael.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Viewer;
(function (Viewer) {
    var LayerDiagram = (function () {
        function LayerDiagram(prefix, networkInfo, aspectRatio, x, y, width, height, raphael) {
            this.prefix = prefix;
            this.raphael = raphael;
            var transitions = {
                'Sigmoid': Transition.Sigmoid,
                'Linear': Transition.Linear,
                undefined: Transition.Linear
            };
            var layerFactory = {
                'FullyConnected': function (layerInfo) { return new FullyConnected(layerInfo['nodeCount'], transitions[layerInfo['transition']]); },
                'Input': function (layerInfo) { return new Input(layerInfo['nodeCount'], transitions[layerInfo['transition']]); },
                'Convolutional': function (layerInfo) { return new Convolutional(layerInfo['nodeCount'], layerInfo['width'], layerInfo['height'], layerInfo['size'], layerInfo['stride'], transitions[layerInfo['transition']]); },
                'Input2D': function (layerInfo) { return new Input2D(layerInfo['channels'], layerInfo['width'], layerInfo['height'], transitions[layerInfo['transition']]); }
            };
            this.layers = [];
            var layerNames = [];
            var layerWeightSrc = [];
            var maxOutput = 0;
            for (var i = 0; i < networkInfo['layers'].length; i++) {
                var layerInfo = networkInfo['layers'][i];
                var layer = layerFactory[layerInfo['type']](layerInfo);
                this.layers.push(layer);
                layerNames.push(layerInfo['name']);
                layerWeightSrc.push(prefix + layerInfo['name'] + "_weights.png");
                maxOutput = Math.max(layer.output, maxOutput);
            }
            var successSamples = [];
            var failureSamples = [];
            for (var id in networkInfo['success']) {
                var sampleInfo = networkInfo['success'][id];
                successSamples.push(new Sample(id, sampleInfo['output'], prefix, layerNames, raphael));
            }
            for (var id in networkInfo['failure']) {
                var sampleInfo = networkInfo['failure'][id];
                failureSamples.push(new Sample(id, sampleInfo['output'], prefix, layerNames, raphael));
            }
            this.layoutSampleDock(successSamples, "#0f0", x + 10, y, width - 20, 30);
            this.layoutSampleDock(failureSamples, "#f00", x + 10, y + 35, width - 20, 30);
            var dockHeight = 75;
            // layout the rest of the network
            var networkHeight = width / aspectRatio;
            var distHeight = 25;
            var dist = this.dist = new Distribution(x + 0.5 * (width - 100), y + dockHeight + networkHeight, 100, distHeight, networkInfo['categoryCount'], raphael);
            var previewX = x;
            var previewY = y + dockHeight + networkHeight + distHeight + 5;
            var previewHeight = height - previewY;
            var preview = this.preview = raphael.image("", x, previewY, width, previewHeight);
            preview.hide();
            // layout the network
            y = dockHeight;
            height = networkHeight;
            var measure = raphael.text(-100, -100, "1000").attr("font-size", LayerDiagram.FONT_SIZE);
            var bbox = measure.getBBox();
            var textSpace = bbox.height;
            height -= 2 * textSpace;
            y += textSpace;
            var heightScale = height / Math.log(maxOutput);
            var nodeSize = height / LayerDiagram.MAX_NODES;
            var layerWidth = nodeSize / LayerDiagram.NODE_SIZE_SCALE;
            var transitionWidth = (width - (layerWidth * this.layers.length)) / (this.layers.length - 1);
            for (var i = 0; i < this.layers.length; i++) {
                var layerHeight = heightScale * Math.log(this.layers[i].output);
                this.layers[i].layout(x, y + 0.5 * (height - layerHeight), layerWidth, layerHeight, i, raphael);
                x += layerWidth;
                if (i < this.layers.length - 1) {
                    if (this.layers[i].transition == Transition.Sigmoid) {
                        this.layoutSigmoid(x, y + 0.5 * (height - 0.5 * layerWidth), transitionWidth, 0.5 * layerWidth);
                    }
                    else {
                        this.layoutLinear(x, y + 0.5 * (height - 0.5 * layerWidth), transitionWidth, 0.5 * layerWidth);
                    }
                    x += transitionWidth;
                }
            }
            // add click handlers
            var layers = this.layers;
            var _loop_1 = function(i) {
                var sample = successSamples[i];
                sample.shape.click(function () {
                    for (var i_1 = 0; i_1 < successSamples.length; i_1++) {
                        successSamples[i_1].unselect();
                    }
                    for (var i_2 = 0; i_2 < failureSamples.length; i_2++) {
                        failureSamples[i_2].unselect();
                    }
                    sample.select();
                    dist.setValues(sample.output);
                    for (var i_3 = 0; i_3 < layers.length; i_3++) {
                        layers[i_3].setThumbnail(sample.layers[i_3]);
                    }
                });
            };
            for (var i = 0; i < successSamples.length; i++) {
                _loop_1(i);
            }
            var _loop_2 = function(i) {
                var sample = failureSamples[i];
                sample.shape.click(function () {
                    for (var i_4 = 0; i_4 < failureSamples.length; i_4++) {
                        failureSamples[i_4].unselect();
                    }
                    for (var i_5 = 0; i_5 < successSamples.length; i_5++) {
                        successSamples[i_5].unselect();
                    }
                    sample.select();
                    dist.setValues(sample.output);
                    for (var i_6 = 0; i_6 < layers.length; i_6++) {
                        layers[i_6].setThumbnail(sample.layers[i_6]);
                    }
                });
            };
            for (var i = 0; i < failureSamples.length; i++) {
                _loop_2(i);
            }
            var self = this;
            var _loop_3 = function(i) {
                var layer = this_1.layers[i];
                layer.thumbnail.click(function () {
                    self.setPreview(layer.thumbnail.attr('src'), previewX, previewY, width, previewHeight);
                });
                layer.click(function () {
                    self.setPreview(layerWeightSrc[i], previewX, previewY, width, previewHeight);
                });
            };
            var this_1 = this;
            for (var i = 0; i < this.layers.length; i++) {
                _loop_3(i);
            }
        }
        LayerDiagram.prototype.setPreview = function (src, previewX, previewY, previewWidth, previewHeight) {
            var measure = new Image();
            var preview = this.preview;
            measure.onload = function () {
                var width = this.width;
                var height = this.height;
                var aspectRatio = height / width;
                width = Math.min(width, previewWidth);
                height = width * aspectRatio;
                if (height > previewHeight) {
                    height = previewHeight;
                    width = height / aspectRatio;
                }
                var x = previewX + 0.5 * (previewWidth - width);
                var y = previewY;
                preview.attr({ 'src': src, x: x, y: y, width: width, height: height });
                preview.show();
            };
            measure.src = src;
        };
        LayerDiagram.prototype.arrow = function (x, y, width, height) {
            var endX = x + 0.9 * width;
            var endY = y + 0.5 * height;
            var arrowHeight = 0.9 * height;
            var barHeight = 0.5 * height;
            return concat([
                "M", endX, ",", endY,
                "L", endX - arrowHeight, ",", endY - arrowHeight,
                "V", endY - barHeight,
                "H", x + 0.1 * width,
                "V", endY + barHeight,
                "H", endX - arrowHeight,
                "V", endY + arrowHeight,
                "Z"]);
        };
        LayerDiagram.prototype.layoutSampleDock = function (samples, color, x, y, width, height) {
            this.raphael.rect(x, y, width, height, 4).attr({ "stroke": color });
            var sampleSize = (width - (samples.length + 1) * LayerDiagram.SAMPLE_SPACING) / samples.length;
            var sx = x + LayerDiagram.SAMPLE_SPACING;
            var sy = y + 0.5 * (height - sampleSize);
            for (var i = 0; i < samples.length; i++) {
                samples[i].layout(sx, sy, sampleSize, sampleSize);
                sx += sampleSize + LayerDiagram.SAMPLE_SPACING;
            }
        };
        LayerDiagram.prototype.layoutLinear = function (x, y, width, height) {
            this.raphael.path(this.arrow(x, y, width, height)).attr({ "fill": "#ddd", "stroke": "none" });
        };
        LayerDiagram.prototype.layoutSigmoid = function (x, y, width, height) {
            var ANGLE = Math.PI * 0.25;
            this.raphael.path(this.arrow(x, y, width, height)).attr({ "fill": "#ddd", "stroke": "none" });
            this.raphael.circle(x + 0.5 * width, y + 0.5 * height, height).attr({ "fill": "#fff", "stroke": "#818181" });
            var cx = x + 0.5 * width;
            var cy = y + 0.5 * height;
            var radius = height;
            var pathX = Math.cos(ANGLE) * radius * 0.8;
            var pathY = Math.sin(ANGLE) * radius * 0.8;
            var path = concat([
                "M",
                cx - pathX,
                ",",
                cy + pathY,
                "C",
                cx + pathX,
                ",",
                cy + pathY,
                ",",
                cx - pathX,
                ",",
                cy - pathY,
                ",",
                cx + pathX,
                ",",
                cy - pathY]);
            this.raphael.path(path).attr({ "stroke": "#000", "stroke-width": 2 });
        };
        LayerDiagram.FONT_SIZE = 10;
        LayerDiagram.MAX_NODES = 10;
        LayerDiagram.NODE_SIZE_SCALE = 0.7;
        LayerDiagram.SAMPLE_SPACING = 4;
        return LayerDiagram;
    }());
    Viewer.LayerDiagram = LayerDiagram;
    function concat(objects) {
        var result = "";
        for (var i in objects) {
            result = result + objects[i];
        }
        return result;
    }
    function attachTop(raphael, middle, top, text) {
        var element = raphael.text(0, 0, text).attr({ "font-size": 8, 'fill': '#6868b6' });
        var bbox = element.getBBox();
        element.attr({ x: middle, y: top - 0.5 * bbox.height });
        return element;
    }
    function attachBottom(raphael, middle, bottom, text) {
        var element = raphael.text(0, 0, text).attr({ "font-size": 8, 'fill': '#6868b6' });
        var bbox = element.getBBox();
        element.attr({ x: middle, y: bottom + 0.7 * bbox.height });
        return element;
    }
    var Sample = (function () {
        function Sample(id, output, prefix, layerNames, raphael) {
            this.id = id;
            this.output = output;
            this.input = prefix + id + "_input.png";
            this.layers = [];
            for (var i = 0; i < layerNames.length; i++) {
                this.layers.push(prefix + id + "_" + layerNames[i] + ".png");
            }
            this.shape = raphael.image(this.input, 0, 0, 16, 16);
            this.highlight = raphael.rect(0, 0, 16, 16).attr('stroke', 'none');
        }
        Sample.prototype.layout = function (x, y, width, height) {
            this.shape.attr({ x: x, y: y, width: width, height: height });
            this.highlight.attr({ x: x, y: y, width: width, height: height });
        };
        Sample.prototype.select = function () {
            this.highlight.attr({ 'stroke': '#f0f', 'stroke-width': 2 });
        };
        Sample.prototype.unselect = function () {
            this.highlight.attr({ 'stroke': 'none' });
        };
        return Sample;
    }());
    var Transition;
    (function (Transition) {
        Transition[Transition["Linear"] = 0] = "Linear";
        Transition[Transition["Sigmoid"] = 1] = "Sigmoid";
    })(Transition || (Transition = {}));
    var Layer = (function () {
        function Layer(output, transition) {
            this.output = output;
            this.transition = transition;
            this.shape = [];
        }
        Layer.prototype.layout = function (x, y, width, height, index, raphael) {
            this.shape.push(raphael.rect(x, y, width, height).attr({ 'fill': '#e1e1e1', 'stroke': '#7f7f7f' }));
            this.thumbnail = raphael.image("", x + width + 2, y + 0.75 * height, 16, 16);
            this.thumbnail.hide();
        };
        Layer.prototype.setThumbnail = function (src) {
            this.thumbnail.attr('src', src);
            this.thumbnail.show();
        };
        Layer.prototype.click = function (handler) {
            for (var i = 0; i < this.shape.length; i++) {
                this.shape[i].click(handler);
            }
        };
        return Layer;
    }());
    var Input = (function (_super) {
        __extends(Input, _super);
        function Input(nodeCount, transition) {
            if (transition === void 0) { transition = Transition.Linear; }
            _super.call(this, nodeCount, transition);
            this.nodeCount = nodeCount;
        }
        Input.prototype.layout = function (x, y, width, height, index, raphael) {
            _super.prototype.layout.call(this, x, y, width, height, index, raphael);
            this.shape[0].attr("stroke-dasharray", "- ");
            raphael.text(x + 0.5 * width, y + 0.5 * height, "input").rotate(-90).attr({ "font-size": 8, 'fill': '#5b9bd5' });
            attachBottom(raphael, x + 0.5 * width, y + height, this.nodeCount + "");
        };
        return Input;
    }(Layer));
    var Distribution = (function () {
        function Distribution(x, y, width, height, categoryCount, raphael) {
            this.height = height;
            this.bars = [];
            var barWidth = width / categoryCount;
            raphael.rect(x, y, width, height).attr({ 'fill': '#555' });
            var barHeight = (1 - (1 / categoryCount)) * height;
            for (var i = 0; i < categoryCount; i++) {
                raphael.text(x + (i + 0.5) * barWidth, y + 0.5 * height, i.toString()).attr({ 'fill': '#fff' });
                this.bars.push(raphael.rect(x + i * barWidth, y, barWidth, barHeight).attr({ fill: "#fff", stroke: "none" }));
            }
        }
        Distribution.prototype.setValues = function (values) {
            var norm = 0;
            var dist = [];
            for (var i = 0; i < values.length; i++) {
                var value = Math.exp(values[i]);
                dist.push(value);
                norm += value;
            }
            norm = 1.0 / norm;
            for (var i = 0; i < this.bars.length; i++) {
                this.bars[i].attr('height', (1 - norm * dist[i]) * this.height);
            }
        };
        return Distribution;
    }());
    var Input2D = (function (_super) {
        __extends(Input2D, _super);
        function Input2D(channels, width, height, transition) {
            if (transition === void 0) { transition = Transition.Linear; }
            _super.call(this, channels * width * height, transition);
            this.channels = channels;
            this.width = width;
            this.height = height;
        }
        Input2D.prototype.layout = function (x, y, width, height, index, raphael) {
            _super.prototype.layout.call(this, x, y, width, height, index, raphael);
            this.shape[0].attr("stroke-dasharray", "- ");
            raphael.text(x + 0.5 * width, y + 0.5 * height, "input").rotate(-90).attr({ "font-size": 8, 'fill': '#5b9bd5' });
            ;
            attachBottom(raphael, x + 0.5 * width, y + height, this.channels + "x" + this.width + "x" + this.height);
        };
        return Input2D;
    }(Layer));
    var FullyConnected = (function (_super) {
        __extends(FullyConnected, _super);
        function FullyConnected(nodeCount, transition) {
            if (transition === void 0) { transition = Transition.Linear; }
            _super.call(this, nodeCount, transition);
            this.nodeCount = nodeCount;
        }
        FullyConnected.prototype.layout = function (x, y, width, height, index, raphael) {
            _super.prototype.layout.call(this, x, y, width, height, index, raphael);
            this.shape[0].attr('r', 4);
            var nodeSize = width * LayerDiagram.NODE_SIZE_SCALE;
            var nodeRadius = 0.35 * nodeSize;
            var displayCount = Math.floor(height / nodeSize);
            var whiteSpace = height - (displayCount * 2 * nodeRadius);
            whiteSpace /= displayCount + 1;
            var cy = y + whiteSpace + nodeRadius;
            var cx = x + 0.5 * width;
            for (var i = 0; i < displayCount; i++) {
                this.shape.push(raphael.circle(cx, cy, nodeRadius).attr({ 'fill': '#5b9bd5', 'stroke': '#41719c' }));
                cy += (2 * nodeRadius) + whiteSpace;
            }
            attachTop(raphael, x + 0.5 * width, y, "F" + index);
            attachBottom(raphael, x + 0.5 * width, y + height, this.output + "");
        };
        return FullyConnected;
    }(Layer));
    var Convolutional = (function (_super) {
        __extends(Convolutional, _super);
        function Convolutional(nodeCount, width, height, size, stride, transition) {
            if (stride === void 0) { stride = 1; }
            if (transition === void 0) { transition = Transition.Linear; }
            _super.call(this, 0, transition);
            this.nodeCount = nodeCount;
            this.width = width;
            this.height = height;
            this.size = size;
            this.stride = stride;
            this.transition = transition;
            this.outputWidth = Math.ceil((width - size) / stride) + 1;
            this.outputHeight = Math.ceil((height - size) / stride) + 1;
            this.output = this.outputWidth * this.outputHeight * nodeCount;
        }
        Convolutional.prototype.layout = function (x, y, width, height, index, raphael) {
            _super.prototype.layout.call(this, x, y, width, height, index, raphael);
            this.shape.push(raphael.rect(x, y, width, height, 4));
            var nodeSize = width * LayerDiagram.NODE_SIZE_SCALE;
            var nodeWidth = 0.7 * nodeSize;
            var displayCount = Math.floor(height / nodeSize);
            var whiteSpace = height - (displayCount * nodeWidth);
            whiteSpace /= displayCount + 1;
            var yy = y + whiteSpace;
            var xx = x + 0.5 * (width - nodeWidth);
            for (var i = 0; i < displayCount; i++) {
                this.shape.push(raphael.rect(xx, yy, nodeWidth, nodeWidth).attr({ 'fill': '#5b9bd5', 'stroke': '#41719c' }));
                yy += nodeWidth + whiteSpace;
            }
            attachTop(raphael, x + 0.5 * width, y, "C" + index + "[" + this.size + "x" + this.size + (this.stride > 0 ? "@" + this.stride : "") + "]");
            attachBottom(raphael, x + 0.5 * width, y + height, this.nodeCount + "x" + this.outputWidth + "x" + this.outputHeight);
        };
        return Convolutional;
    }(Layer));
})(Viewer || (Viewer = {}));
//# sourceMappingURL=viewer.js.map