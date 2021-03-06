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
                'ReLU': Transition.ReLU,
                undefined: Transition.Linear
            };
            var layerFactory = {
                'FullyConnected': function (layerInfo) { return new FullyConnected(layerInfo['nodeCount'], transitions[layerInfo['transition']]); },
                'Input': function (layerInfo) { return new Input(layerInfo['nodeCount'], transitions[layerInfo['transition']]); },
                'Convolutional': function (layerInfo) { return new Convolutional(layerInfo['nodeCount'], layerInfo['width'], layerInfo['height'], layerInfo['size'], layerInfo['stride'], layerInfo['padding'], transitions[layerInfo['transition']]); },
                'Input2D': function (layerInfo) { return new Input2D(layerInfo['channels'], layerInfo['width'], layerInfo['height'], transitions[layerInfo['transition']]); },
                'Pooling': function (layerInfo) { return new Pooling(layerInfo['op'], layerInfo['channels'], layerInfo['width'], layerInfo['height'], layerInfo['size'], layerInfo['stride'], layerInfo['padding'], transitions[layerInfo['transition']]); },
                "ResBlock": function (layerInfo) { return new ResBlock(layerInfo['nodeCount'], layerInfo['width'], layerInfo['height'], layerInfo['stride'], transitions[layerInfo['transition']]); },
                "BatchNormalization": function (layerInfo) { return new BatchNormalization(layerInfo['channels'], layerInfo['width'], layerInfo['height'], transitions[layerInfo['transition']]); },
            };
            this.layers = [];
            var layerNames = [];
            var layerWeightSrc = [];
            var maxOutput = 0;
            for (var i = 0; i < networkInfo['layers'].length; i++) {
                var layerInfo = networkInfo['layers'][i];
                var layer_1 = layerFactory[layerInfo['type']](layerInfo);
                this.layers.push(layer_1);
                layerNames.push(layerInfo['name']);
                layerWeightSrc.push(prefix + layerInfo['name'] + "_weights.png");
                maxOutput = Math.max(layer_1.output, maxOutput);
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
            var dockHeight = 0;
            if (successSamples.length > 0) {
                var sampleSize = (width - (successSamples.length + 1) * LayerDiagram.SAMPLE_SPACING - 20) / successSamples.length;
                this.layoutSampleDock(successSamples, "#0f0", x + 10, y, width - 20, sampleSize + 2 * LayerDiagram.SAMPLE_SPACING);
                this.layoutSampleDock(failureSamples, "#f00", x + 10, y + sampleSize + 4 * LayerDiagram.SAMPLE_SPACING, width - 20, sampleSize + 2 * LayerDiagram.SAMPLE_SPACING);
                dockHeight = 2 * sampleSize + 7 * LayerDiagram.SAMPLE_SPACING;
            }
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
            var unitCount = 0;
            for (var i = 0; i < this.layers.length; i++) {
                if (this.layers[i] instanceof ResBlock) {
                    unitCount += ResBlock.UNIT_COUNT;
                }
                else {
                    unitCount++;
                }
            }
            var transitionWidth = (width - (layerWidth * unitCount)) / (this.layers.length - 1);
            var transitionHeight = 0.5 * layerWidth;
            var layerHeight = heightScale * Math.log(this.layers[0].output);
            var layer = this.layers[0];
            layer.layout(x, y + 0.5 * (height - layerHeight), layerWidth, layerHeight, 0, raphael);
            x += layerWidth + transitionWidth;
            var ty = y + 0.5 * (height - transitionHeight);
            for (var i = 1; i < this.layers.length; i++) {
                layerHeight = heightScale * Math.log(this.layers[i].output);
                layer = this.layers[i];
                var prev = this.layers[i - 1];
                prev.thumbnail = raphael.image("", x - 0.5 * transitionWidth - 8, y + 0.5 * (height + 2.5 * transitionHeight), 16, 16);
                prev.thumbnail.hide();
                if (layer instanceof ResBlock) {
                    layer.layout(x, y + 0.5 * (height - layerHeight), ResBlock.UNIT_COUNT * layerWidth, layerHeight, i, raphael);
                    this.layoutTransition(prev.transition, x - transitionWidth, ty - transitionHeight, layer.topInput.x, layer.topInput.y, transitionHeight);
                    this.layoutTransition(prev.transition, x - transitionWidth, ty + transitionHeight, layer.bottomInput.x, layer.bottomInput.y, transitionHeight);
                    x += ResBlock.UNIT_COUNT * layerWidth;
                }
                else {
                    layer.layout(x, y + 0.5 * (height - layerHeight), layerWidth, layerHeight, i, raphael);
                    this.layoutTransition(prev.transition, x - transitionWidth, ty, x, ty, transitionHeight);
                    x += layerWidth;
                }
                x += transitionWidth;
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
                var layer_2 = this_1.layers[i];
                if (layer_2.thumbnail) {
                    layer_2.thumbnail.click(function () {
                        self.setPreview(layer_2.thumbnail.attr('src'), previewX, previewY, width, previewHeight);
                    });
                }
                layer_2.click(function () {
                    self.setPreview(layerWeightSrc[i], previewX, previewY, width, previewHeight);
                });
            };
            var this_1 = this;
            for (var i = 0; i < this.layers.length; i++) {
                _loop_3(i);
            }
        }
        LayerDiagram.prototype.layoutTransition = function (transition, x1, y1, x2, y2, height) {
            var dir = new Vector2(x1, y1, x2, y2);
            this.raphael.path(arrow(dir, height)).attr({ "fill": LayerDiagram.ARROW_FILL, "stroke": "none" });
            switch (transition) {
                case Transition.Sigmoid:
                    this.layoutSigmoid(dir, height);
                    break;
                case Transition.ReLU:
                    this.layoutReLU(dir, height);
                    break;
            }
        };
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
        LayerDiagram.prototype.layoutSigmoid = function (direction, height) {
            var ANGLE = Math.PI * 0.25;
            var center = direction.getPoint(0.5);
            var cx = center[0];
            var cy = center[1];
            var radius = height;
            this.raphael.circle(cx, cy, radius).attr({ "fill": LayerDiagram.TRANSITION_FILL, "stroke": LayerDiagram.TRANSITION_STROKE });
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
            this.raphael.path(path).attr({ "stroke": "#000", "stroke-width": 1 });
        };
        LayerDiagram.prototype.layoutReLU = function (direction, height) {
            var ANGLE = Math.PI * 0.25;
            var center = direction.getPoint(0.5);
            var cx = center[0];
            var cy = center[1];
            var radius = height;
            this.raphael.circle(cx, cy, radius).attr({ "fill": LayerDiagram.TRANSITION_FILL, "stroke": LayerDiagram.TRANSITION_STROKE });
            var pathX = Math.cos(ANGLE) * radius * 0.7;
            var pathY = Math.sin(ANGLE) * radius * 0.7;
            var path = concat([
                "M", cx - radius * 0.7, ",", cy,
                "H", cx,
                "L", cx + pathX, ",", cy - pathY]);
            this.raphael.path(path).attr({ "stroke": "#000", "stroke-width": 1 });
        };
        LayerDiagram.FONT_SIZE = 10;
        LayerDiagram.MAX_NODES = 10;
        LayerDiagram.NODE_SIZE_SCALE = 0.7;
        LayerDiagram.SAMPLE_SPACING = 4;
        LayerDiagram.LAYER_STROKE = "#7f7f7f";
        LayerDiagram.LAYER_FILL = "#e1e1e1";
        //static LAYER_FILL = "#fff";
        LayerDiagram.NODE_FILL = "#5b9bd5";
        //static NODE_FILL = "#fff";
        LayerDiagram.NODE_STROKE = "#41719c";
        //static NODE_STROKE = "#000";        
        LayerDiagram.ACTION_FILL = "#5b9bd5";
        //static ACTION_FILL = "#000";
        LayerDiagram.TEXT_FILL = "#6868b6";
        //static TEXT_FILL = "#000";
        LayerDiagram.ARROW_FILL = "#ddd";
        LayerDiagram.TRANSITION_FILL = "#fff";
        LayerDiagram.TRANSITION_STROKE = "#818181";
        return LayerDiagram;
    }());
    Viewer.LayerDiagram = LayerDiagram;
    var Vector2 = (function () {
        function Vector2(x1, y1, x2, y2) {
            this.x1 = x1;
            this.y1 = y1;
            this.x2 = x2;
            this.y2 = y2;
            this.dx = x2 - x1;
            this.dy = y2 - y1;
            this.length = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
            this.dx /= this.length;
            this.dy /= this.length;
        }
        Vector2.prototype.perp = function () {
            if (this.dx != 0) {
                return new Vector2(0, 0, this.dy, -this.dx);
            }
            else {
                return new Vector2(0, 0, -this.dy, this.dx);
            }
        };
        Vector2.prototype.getPoint = function (distance) {
            return [this.x1 + distance * this.length * this.dx, this.y1 + distance * this.length * this.dy];
        };
        return Vector2;
    }());
    function arrow(dir, height) {
        var start = dir.getPoint(0.05);
        var end = dir.getPoint(0.95);
        var perp = dir.perp();
        var x1 = start[0];
        var y1 = start[1];
        var x2 = end[0];
        var y2 = end[1];
        var arrowHeight = 0.9 * height;
        var barHeight = 0.5 * height;
        var barLength = 0.9 * dir.length - arrowHeight;
        var x = x1;
        var y = y1;
        x += barHeight * perp.dx;
        y += barHeight * perp.dy;
        var path = "M" + x + "," + y;
        x += barLength * dir.dx;
        y += barLength * dir.dy;
        path += "L" + x + "," + y;
        x += (arrowHeight - barHeight) * perp.dx;
        y += (arrowHeight - barHeight) * perp.dy;
        path += "L" + x + "," + y;
        path += "L" + x2 + "," + y2;
        x -= (arrowHeight * 2) * perp.dx;
        y -= (arrowHeight * 2) * perp.dy;
        path += "L" + x + "," + y;
        x += (arrowHeight - barHeight) * perp.dx;
        y += (arrowHeight - barHeight) * perp.dy;
        path += "L" + x + "," + y;
        x -= barLength * dir.dx;
        y -= barLength * dir.dy;
        path += "L" + x + "," + y;
        path += "Z";
        return path;
    }
    function concat(objects) {
        var result = "";
        for (var i in objects) {
            result = result + objects[i];
        }
        return result;
    }
    function attachTop(raphael, middle, top, text) {
        var element = raphael.text(0, 0, text).attr({ "font-size": 6, 'fill': LayerDiagram.TEXT_FILL });
        var bbox = element.getBBox();
        element.attr({ x: middle, y: top - 0.7 * bbox.height });
        return element;
    }
    function attachBottom(raphael, middle, bottom, text) {
        var element = raphael.text(0, 0, text).attr({ "font-size": 6, 'fill': LayerDiagram.TEXT_FILL });
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
        Transition[Transition["ReLU"] = 2] = "ReLU";
        Transition[Transition["Identity"] = 3] = "Identity";
    })(Transition || (Transition = {}));
    var Layer = (function () {
        function Layer(output, transition) {
            this.output = output;
            this.transition = transition;
            this.shape = [];
        }
        Layer.prototype.layout = function (x, y, width, height, index, raphael) {
            this.shape.push(raphael.rect(x, y, width, height).attr({ 'fill': LayerDiagram.LAYER_FILL, 'stroke': LayerDiagram.LAYER_STROKE }));
        };
        Layer.prototype.setThumbnail = function (src) {
            if (this.thumbnail) {
                this.thumbnail.attr('src', src);
                this.thumbnail.show();
            }
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
            raphael.text(x + 0.5 * width, y + 0.5 * height, "input").rotate(-90).attr({ "font-size": 8, 'fill': LayerDiagram.ACTION_FILL });
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
            raphael.text(x + 0.5 * width, y + 0.5 * height, "input").rotate(-90).attr({ "font-size": 8, 'fill': LayerDiagram.ACTION_FILL });
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
                this.shape.push(raphael.circle(cx, cy, nodeRadius).attr({ 'fill': LayerDiagram.NODE_FILL, 'stroke': LayerDiagram.NODE_STROKE }));
                cy += (2 * nodeRadius) + whiteSpace;
            }
            attachTop(raphael, x + 0.5 * width, y, "F" + index);
            attachBottom(raphael, x + 0.5 * width, y + height, this.output + "");
        };
        return FullyConnected;
    }(Layer));
    var Convolutional = (function (_super) {
        __extends(Convolutional, _super);
        function Convolutional(nodeCount, width, height, size, stride, padding, transition) {
            if (stride === void 0) { stride = 1; }
            if (padding === void 0) { padding = 0; }
            if (transition === void 0) { transition = Transition.Linear; }
            _super.call(this, 0, transition);
            this.nodeCount = nodeCount;
            this.width = width;
            this.height = height;
            this.size = size;
            this.stride = stride;
            this.padding = padding;
            this.transition = transition;
            this.outputWidth = Math.floor((width + 2 * padding - size) / stride) + 1;
            this.outputHeight = Math.floor((height + 2 * padding - size) / stride) + 1;
            this.output = this.outputWidth * this.outputHeight * nodeCount;
        }
        Convolutional.prototype.layout = function (x, y, width, height, index, raphael) {
            _super.prototype.layout.call(this, x, y, width, height, index, raphael);
            this.shape[0].attr('r', 4);
            var nodeSize = width * LayerDiagram.NODE_SIZE_SCALE;
            var nodeWidth = 0.7 * nodeSize;
            var displayCount = Math.floor(height / nodeSize);
            var whiteSpace = height - (displayCount * nodeWidth);
            whiteSpace /= displayCount + 1;
            var yy = y + whiteSpace;
            var xx = x + 0.5 * (width - nodeWidth);
            for (var i = 0; i < displayCount; i++) {
                this.shape.push(raphael.rect(xx, yy, nodeWidth, nodeWidth).attr({ 'fill': LayerDiagram.NODE_FILL, 'stroke': LayerDiagram.NODE_STROKE }));
                yy += nodeWidth + whiteSpace;
            }
            attachTop(raphael, x + 0.5 * width, y, "C" + index + "[" + this.size + "x" + this.size + (this.stride > 1 ? "@" + this.stride : "") + "]");
            attachBottom(raphael, x + 0.5 * width, y + height, this.nodeCount + "x" + this.outputWidth + "x" + this.outputHeight);
        };
        return Convolutional;
    }(Layer));
    var Pooling = (function (_super) {
        __extends(Pooling, _super);
        function Pooling(op, channels, width, height, size, stride, padding, transition) {
            if (stride === void 0) { stride = 1; }
            if (padding === void 0) { padding = 0; }
            if (transition === void 0) { transition = Transition.Linear; }
            _super.call(this, 0, transition);
            this.op = op;
            this.channels = channels;
            this.width = width;
            this.height = height;
            this.size = size;
            this.stride = stride;
            this.padding = padding;
            this.transition = transition;
            this.outputWidth = Math.floor((width + 2 * padding - size) / stride) + 1;
            this.outputHeight = Math.floor((height + 2 * padding - size) / stride) + 1;
            this.output = channels * this.outputWidth * this.outputHeight;
        }
        Pooling.prototype.layout = function (x, y, width, height, index, raphael) {
            _super.prototype.layout.call(this, x, y, width, height, index, raphael);
            raphael.text(x + 0.5 * width, y + 0.5 * height, this.op).rotate(-90).attr({ "font-size": 8, 'fill': LayerDiagram.ACTION_FILL });
            attachTop(raphael, x + 0.5 * width, y, "P" + index + "[" + this.size + "x" + this.size + (this.stride > 1 ? "@" + this.stride : "") + "]");
            attachBottom(raphael, x + 0.5 * width, y + height, this.channels + "x" + this.outputWidth + "x" + this.outputHeight);
        };
        return Pooling;
    }(Layer));
    var ResBlock = (function (_super) {
        __extends(ResBlock, _super);
        function ResBlock(nodeCount, width, height, stride, transition) {
            if (stride === void 0) { stride = 1; }
            if (transition === void 0) { transition = Transition.Linear; }
            _super.call(this, 0, transition);
            this.nodeCount = nodeCount;
            this.width = width;
            this.height = height;
            this.stride = stride;
            this.transition = transition;
            this.outputWidth = width / stride;
            this.outputHeight = height / stride;
            this.output = this.outputWidth * this.outputHeight * nodeCount;
        }
        ResBlock.prototype.layout = function (x, y, width, height, index, raphael) {
            var unit = width / ResBlock.UNIT_COUNT;
            var nodeSize = unit * LayerDiagram.NODE_SIZE_SCALE;
            var subHeight = 0.5 * height - 0.25 * unit;
            var nodeWidth = 0.7 * nodeSize;
            var displayCount = Math.floor(subHeight / nodeSize);
            var whiteSpace = subHeight - (displayCount * nodeWidth);
            whiteSpace /= displayCount + 1;
            // add top
            // register input
            raphael.rect(x + unit, y, unit, subHeight, 4).attr({ 'fill': LayerDiagram.LAYER_FILL, 'stroke': LayerDiagram.LAYER_STROKE });
            this.topInput = { x: x + unit, y: y + 0.5 * subHeight };
            var yy = y + whiteSpace;
            var xx = x + unit + 0.5 * (unit - nodeWidth);
            for (var r = 0; r < displayCount; r++) {
                this.shape.push(raphael.rect(xx, yy, nodeWidth, nodeWidth).attr({ 'fill': LayerDiagram.NODE_FILL, 'stroke': LayerDiagram.NODE_STROKE }));
                yy += nodeWidth + whiteSpace;
            }
            // add bottom
            // register input
            var botY = y + subHeight + 0.25 * unit;
            var botX = x;
            this.bottomInput = { x: botX, y: botY + 0.5 * subHeight };
            xx = botX + 0.5 * (unit - nodeWidth);
            raphael.rect(botX, botY, unit, subHeight, 4).attr({ 'fill': LayerDiagram.LAYER_FILL, 'stroke': LayerDiagram.LAYER_STROKE });
            yy = y + subHeight + 0.25 * unit + whiteSpace;
            for (var r = 0; r < displayCount; r++) {
                this.shape.push(raphael.rect(xx, yy, nodeWidth, nodeWidth).attr({ 'fill': LayerDiagram.NODE_FILL, 'stroke': LayerDiagram.NODE_STROKE }));
                yy += nodeWidth + whiteSpace;
            }
            botX += 1.1 * unit;
            raphael.rect(botX, botY, .3 * unit, subHeight).attr({ 'fill': LayerDiagram.LAYER_FILL, 'stroke': LayerDiagram.LAYER_STROKE });
            botX += .4 * unit;
            raphael.rect(botX, botY, unit, subHeight, 4).attr({ 'fill': LayerDiagram.LAYER_FILL, 'stroke': LayerDiagram.LAYER_STROKE });
            xx += 1.5 * unit;
            yy = y + subHeight + 0.25 * unit + whiteSpace;
            for (var r = 0; r < displayCount; r++) {
                this.shape.push(raphael.rect(xx, yy, nodeWidth, nodeWidth).attr({ 'fill': LayerDiagram.NODE_FILL, 'stroke': LayerDiagram.NODE_STROKE }));
                yy += nodeWidth + whiteSpace;
            }
            botX += 1.1 * unit;
            raphael.rect(botX, botY, 0.3 * unit, subHeight).attr({ 'fill': LayerDiagram.LAYER_FILL, 'stroke': LayerDiagram.LAYER_STROKE });
            botX += 0.3 * unit;
            // add combination bit
            raphael.rect(x + 5.5 * unit, y + 0.5 * (height - subHeight), 0.5 * unit, subHeight).attr({ 'fill': LayerDiagram.LAYER_FILL, 'stroke': LayerDiagram.LAYER_STROKE });
            raphael.text(x + 5.75 * unit, y + 0.5 * height, "add").rotate(-90).attr({ "font-size": 8, 'fill': LayerDiagram.ACTION_FILL });
            var topDir = new Vector2(x + 2.1 * unit, y + 0.5 * subHeight, x + 5.5 * unit, y + 0.5 * (height - unit));
            raphael.path(arrow(topDir, 0.5 * unit)).attr({ "fill": LayerDiagram.ARROW_FILL, "stroke": "none" });
            var center = topDir.getPoint(0.5);
            raphael.circle(center[0], center[1], 0.5 * unit).attr({ "fill": LayerDiagram.TRANSITION_FILL, "stroke": LayerDiagram.TRANSITION_STROKE });
            raphael.text(center[0], center[1], "I").attr({ "font-family": "serif", "font-size": 14 });
            var bottomDir = new Vector2(botX + 0.1 * unit, botY + 0.5 * subHeight, x + 5.5 * unit, y + 0.5 * (height + unit));
            raphael.path(arrow(bottomDir, 0.5 * unit)).attr({ "fill": LayerDiagram.ARROW_FILL, "stroke": "none" });
            center = bottomDir.getPoint(0.5);
            raphael.circle(center[0], center[1], 0.5 * unit).attr({ "fill": LayerDiagram.TRANSITION_FILL, "stroke": LayerDiagram.TRANSITION_STROKE });
            raphael.text(center[0], center[1], "I").attr({ "font-family": "serif", "font-size": 14 });
            attachTop(raphael, x + 1.5 * unit, y, "R" + index + (this.stride > 1 ? "@ " + this.stride : ""));
            attachBottom(raphael, x + 1.5 * unit, y + height, this.nodeCount + "x" + this.outputWidth + "x" + this.outputHeight);
        };
        ResBlock.UNIT_COUNT = 6;
        return ResBlock;
    }(Layer));
    var BatchNormalization = (function (_super) {
        __extends(BatchNormalization, _super);
        function BatchNormalization(channels, width, height, transition) {
            if (transition === void 0) { transition = Transition.Linear; }
            _super.call(this, channels * width * height, transition);
            this.channels = channels;
            this.width = width;
            this.height = height;
            this.transition = transition;
        }
        BatchNormalization.prototype.layout = function (x, y, width, height, index, raphael) {
            _super.prototype.layout.call(this, x, y, width, height, index, raphael);
            raphael.text(x + 0.5 * width, y + 0.5 * height, "bn").rotate(-90).attr({ "font-size": 8, 'fill': LayerDiagram.ACTION_FILL });
            attachTop(raphael, x + 0.5 * width, y, "B" + index);
            attachBottom(raphael, x + 0.5 * width, y + height, this.channels + "x" + this.width + "x" + this.height);
        };
        return BatchNormalization;
    }(Layer));
})(Viewer || (Viewer = {}));
//# sourceMappingURL=viewer.js.map