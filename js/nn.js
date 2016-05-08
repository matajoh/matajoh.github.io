/// <reference path="../wwwroot/lib/raphael/raphael.d.ts" />
var NeuralNets;
(function (NeuralNets) {
    var ALPHA = 0.1;
    var BETA1 = 0.9;
    var BETA2 = 0.999;
    var EPSILON = 10e-8;
    var Net = (function () {
        function Net(raphael) {
            this.raphael = raphael;
            this.inputs = [];
        }
        Net.prototype.addInput = function (x, y, size, max, name) {
            var input = new Input(x, y, size, max, name, this.raphael);
            this.inputs.push(input);
            return input;
        };
        Net.prototype.addBias = function (x, y, size, name) {
            return new Bias(x, y, size, name, this.raphael);
        };
        Net.prototype.addLinear = function (x, y, radius, name) {
            return new Linear(x, y, radius, name, this.raphael);
        };
        Net.prototype.addSigmoid = function (input, radius, name) {
            return new Sigmoid(input, radius, name, this.raphael);
        };
        Net.prototype.addStep = function (input, radius, name) {
            return new Step(input, radius, name, this.raphael);
        };
        Net.prototype.addWeight = function (input, output, name, weightValue) {
            if (weightValue === void 0) { weightValue = sampleGaussian(); }
            return new Weight(input, output, name, weightValue, this.raphael);
        };
        Net.prototype.setSoftMax = function (x, y, width, height) {
            this.output = new SoftMax(x, y, width, height, this.raphael);
            return this.output;
        };
        Net.prototype.setPerceptron = function (x, y, width, height) {
            this.output = new Perceptron(x, y, width, height, this.raphael);
            return this.output;
        };
        Net.prototype.forward = function (display, values) {
            this.output.reset();
            if (values) {
                for (var i = 0; i < values.length; i++) {
                    this.inputs[i].setValue(values[i], display);
                }
            }
            this.output.compute(display);
            return this.output.values;
        };
        Net.prototype.present = function (display, label, values) {
            this.forward(false, values);
            this.output.backprop(label);
        };
        Net.prototype.update = function (scale) {
            this.output.update(scale);
        };
        return Net;
    }());
    NeuralNets.Net = Net;
    function sampleGaussian() {
        var x1 = 0;
        var x2 = 0;
        var w = 0;
        do {
            x1 = 2.0 * Math.random() - 1.0;
            x2 = 2.0 * Math.random() - 1.0;
            w = x1 * x1 + x2 * x2;
        } while (w >= 1.0);
        w = Math.sqrt((-2.0 * Math.log(w)) / w);
        return x1 * w;
    }
    NeuralNets.sampleGaussian = sampleGaussian;
    function getColor(percent) {
        var color = Raphael.hsl2rgb(0.33 + 0.66 * (1 - percent), 1, 0.5);
        return color.hex;
    }
    NeuralNets.getColor = getColor;
    function tanh(x) {
        var e2x = Math.exp(-2 * x);
        return (1 - e2x) / (1 + e2x);
    }
    function artanh(x) {
        return 0.5 * Math.log((1 + x) / (1 - x));
    }
    function concat(objects) {
        var result = "";
        for (var i in objects) {
            result = result + objects[i];
        }
        return result;
    }
    function cross(x, y, width, thickness) {
        width = width / 2;
        thickness = thickness / 2;
        return concat([
            "M", x - width, ",", y - thickness,
            "H", x - thickness,
            "V", y - width,
            "H", x + thickness,
            "V", y - thickness,
            "H", x + width,
            "V", y + thickness,
            "H", x + thickness,
            "V", y + width,
            "H", x - thickness,
            "V", y + thickness,
            "H", x - width,
            "Z"]);
    }
    var Converter = (function () {
        function Converter(min, max) {
            this.min = min;
            this.max = max;
            this.mult = (max - min);
            this.div = 1.0 / this.mult;
        }
        Converter.prototype.toPercent = function (value) {
            return (value - this.min) * this.div;
        };
        ;
        Converter.prototype.toValue = function (percent) {
            return (percent * this.mult) + this.min;
        };
        ;
        return Converter;
    }());
    var Input = (function () {
        function Input(x, y, size, max, name, raphael) {
            this.name = name;
            this.shape = [];
            this.shape.push(raphael.rect(x, y, size, size).attr({ fill: NeuralNets.getColor(0.5) }));
            this.label = raphael.text(x + 0.5 * size, y + 0.5 * size, name).attr({ "font-size": 16, "fill": "#fff" });
            this.label.mouseover(function (e) {
                this[0].style.cursor = "default";
            });
            this.label.mouseout(function (e) {
                this[0].style.cursor = "";
            });
            this.shape.push(this.label);
            this.name = name;
            this.value = 0;
            this.converter = new Converter(-max, max);
        }
        Input.prototype.compute = function (display) { };
        Input.prototype.backprop = function (sensitivity) { };
        Input.prototype.setValue = function (value, display) {
            this.value = value;
            var percent = this.converter.toPercent(value);
            if (display) {
                this.shape[0].attr("fill", NeuralNets.getColor(percent));
            }
        };
        Input.prototype.click = function (handler) {
            for (var i = 0; i < this.shape.length; i++) {
                this.shape[i].click(handler);
            }
        };
        Input.prototype.update = function () { };
        Input.prototype.reset = function () { };
        Input.prototype.setPercent = function (percent) {
            this.value = this.converter.toValue(percent);
            this.shape[0].attr("fill", NeuralNets.getColor(percent));
        };
        Input.prototype.getPercent = function () {
            return this.converter.toPercent(this.value);
        };
        return Input;
    }());
    var SoftMax = (function () {
        function SoftMax(x, y, width, height, raphael) {
            this.height = height;
            var halfWidth = width * 0.5;
            this.shape = [];
            this.shape.push(raphael.rect(x, y, width, height).attr({ fill: "#555" }));
            this.neg = raphael.rect(x, y, halfWidth, height).attr({ fill: "#fff", stroke: "none" });
            this.pos = raphael.rect(x + halfWidth, y, halfWidth, 0).attr({ fill: "#fff", stroke: "none" });
            this.shape.push(this.neg, this.pos);
            var xx = x + halfWidth + 0.5 * halfWidth;
            var yy = y + 0.5 * height;
            this.shape.push(raphael.path(cross(xx, yy, 8, 2)).attr({ "fill": "#000", "stroke": "#fff" }));
            xx = xx - halfWidth;
            this.shape.push(raphael.circle(xx, yy, 4).attr({ "fill": "#000", "stroke": "#fff" }));
            this.inputs = [];
            this.values = [];
            this.computeFlag = false;
        }
        SoftMax.prototype.click = function (handler) {
            for (var i = 0; i < this.shape.length; i++) {
                this.shape[i].click(handler);
            }
        };
        SoftMax.prototype.compute = function (display) {
            if (!this.computeFlag) {
                var norm = 0;
                for (var i = 0; i < this.inputs.length; i++) {
                    this.inputs[i].compute(display);
                    this.values[i] = Math.exp(this.inputs[i].value);
                    norm += this.values[i];
                }
                norm = 1.0 / norm;
                for (var i = 0; i < this.values.length; i++) {
                    this.values[i] *= norm;
                }
                if (display) {
                    this.neg.attr("height", this.values[1] * this.height);
                    this.pos.attr("height", this.values[0] * this.height);
                }
                this.computeFlag = true;
            }
        };
        SoftMax.prototype.update = function (scale) {
            for (var i = 0; i < this.inputs.length; i++) {
                this.inputs[i].update(scale);
            }
        };
        SoftMax.prototype.backprop = function (sensitivity) {
            for (var i = 0; i < this.inputs.length; i++) {
                if (i == sensitivity) {
                    this.inputs[i].backprop(this.values[i] - 1);
                }
                else {
                    this.inputs[i].backprop(this.values[i]);
                }
            }
        };
        SoftMax.prototype.reset = function () {
            if (this.computeFlag) {
                this.computeFlag = false;
                for (var i = 0; i < this.values.length; i++) {
                    this.values[i] = 0;
                    this.inputs[i].reset();
                }
            }
        };
        SoftMax.prototype.addInput = function (input) {
            this.inputs.push(input);
        };
        return SoftMax;
    }());
    var Linear = (function () {
        function Linear(x, y, radius, name, raphael) {
            this.name = name;
            this.shape = [];
            this.shape.push(raphael.circle(x + radius, y + radius, radius).attr({ fill: NeuralNets.getColor(0.5) }));
            var label = raphael.text(x + radius, y + radius, name).attr({ "font-size": 16, "fill": "#fff" });
            label.mouseover(function (e) {
                this[0].style.cursor = "default";
            });
            label.mouseout(function (e) {
                this[0].style.cursor = "";
            });
            this.shape.push(label);
            this.name = name;
            this.value = 0;
            this.converter = new Converter(-1, 1);
            this.computeFlag = false;
            this.inputs = [];
        }
        Linear.prototype.compute = function (display) {
            if (!this.computeFlag) {
                this.value = 0;
                for (var i = 0; i < this.inputs.length; i++) {
                    this.inputs[i].compute(display);
                    this.value += this.inputs[i].value;
                }
                if (display) {
                    this.shape[0].attr({ fill: NeuralNets.getColor(this.converter.toPercent(tanh(this.value))) });
                }
                this.computeFlag = true;
            }
        };
        Linear.prototype.click = function (handler) {
            for (var i = 0; i < this.shape.length; i++) {
                this.shape[i].click(handler);
            }
        };
        Linear.prototype.update = function (scale) {
            for (var i = 0; i < this.inputs.length; i++) {
                this.inputs[i].update(scale);
            }
        };
        Linear.prototype.backprop = function (sensitivity) {
            for (var i = 0; i < this.inputs.length; i++) {
                this.inputs[i].backprop(sensitivity);
            }
        };
        Linear.prototype.reset = function () {
            if (this.computeFlag) {
                this.value = 0;
                this.computeFlag = false;
                for (var i = 0; i < this.inputs.length; i++) {
                    this.inputs[i].reset();
                }
            }
        };
        Linear.prototype.addInput = function (input) {
            this.inputs.push(input);
        };
        return Linear;
    }());
    var Weight = (function () {
        function Weight(input, output, name, weightValue, raphael) {
            this.name = name;
            this.weightValue = weightValue;
            var bb = input.shape[0].getBBox();
            var x1 = bb.x + 0.5 * bb.width;
            var y1 = bb.y + bb.height;
            bb = output.shape[0].getBBox();
            var x2 = bb.x + 0.5 * bb.width;
            var y2 = bb.y;
            this.input = input;
            this.computeFlag = false;
            this.converter = new Converter(-1, 1);
            var path = concat(["M", x1, ",", y1, "L", x2, ",", y2]);
            this.shape = [];
            this.shape.push(raphael.path(path).attr({ "stroke-width": 4, "stroke": NeuralNets.getColor(this.converter.toPercent(tanh(weightValue))) }).toBack());
            output.addInput(this);
            this.value = 0;
            this.gradient = 0;
            this.firstMoment = 0;
            this.secondMoment = 0;
            this.beta1 = BETA1;
            this.beta2 = BETA2;
        }
        Weight.prototype.compute = function (display) {
            if (!this.computeFlag) {
                this.input.compute(display);
                this.value = this.input.value * this.weightValue;
                this.computeFlag = true;
            }
        };
        Weight.prototype.update = function (scale) {
            if (!this.updateFlag) {
                this.gradient *= scale;
                this.firstMoment = (BETA1 * this.firstMoment) + ((1 - BETA1) * this.gradient);
                this.secondMoment = (BETA2 * this.secondMoment) + ((1 - BETA2) * this.gradient * this.gradient);
                var alpha = ALPHA * (Math.sqrt(1 - this.beta2) / (1 - this.beta1));
                this.weightValue = this.weightValue - (alpha * (this.firstMoment / (Math.sqrt(this.secondMoment) + EPSILON)));
                this.gradient = 0;
                this.beta1 *= BETA1;
                this.beta2 *= BETA2;
                this.shape[0].attr("stroke", NeuralNets.getColor(this.converter.toPercent(tanh(this.weightValue))));
                this.input.update(scale);
                this.updateFlag = true;
            }
        };
        Weight.prototype.backprop = function (sensitivity) {
            if (this.updateFlag) {
                this.updateFlag = false;
            }
            this.gradient += sensitivity * this.input.value;
            this.input.backprop(sensitivity * this.weightValue);
        };
        Weight.prototype.reset = function () {
            if (this.computeFlag) {
                this.value = 0;
                this.computeFlag = false;
                this.input.reset();
            }
        };
        Weight.prototype.setValue = function (value, display) {
            this.weightValue = Math.exp(value);
            if (display) {
                this.shape[0].attr("stroke", NeuralNets.getColor(this.converter.toPercent(tanh(this.value))));
            }
        };
        Weight.prototype.click = function (handler) {
            this.shape[0].click(handler);
        };
        Weight.prototype.setPercent = function (percent) {
            this.weightValue = artanh(this.converter.toValue(percent));
            this.shape[0].attr("stroke", NeuralNets.getColor(percent));
        };
        Weight.prototype.getPercent = function () {
            return this.converter.toPercent(tanh(this.weightValue));
        };
        return Weight;
    }());
    var Sigmoid = (function () {
        function Sigmoid(input, radius, name, raphael) {
            this.name = name;
            var bb = input.shape[0].getBBox();
            var centerX = bb.x + 0.5 * bb.width;
            var centerY = bb.y + bb.height + radius;
            this.shape = [];
            this.shape.push(raphael.circle(centerX, centerY, radius).attr("fill", NeuralNets.getColor(0.5)));
            this.value = 0;
            this.computeFlag = false;
            this.input = input;
            this.converter = new Converter(0, 1);
            var pathX = Math.cos(Sigmoid.ANGLE) * radius * 0.8;
            var pathY = Math.sin(Sigmoid.ANGLE) * radius * 0.8;
            var path = concat([
                "M",
                centerX - pathX,
                ",",
                centerY + pathY,
                "C",
                centerX + pathX,
                ",",
                centerY + pathY,
                ",",
                centerX - pathX,
                ",",
                centerY - pathY,
                ",",
                centerX + pathX,
                ",",
                centerY - pathY]);
            this.shape.push(raphael.path(path).attr({ "stroke": "#fff", "stroke-width": 2 }));
        }
        Sigmoid.prototype.click = function (handler) {
            for (var i = 0; i < this.shape.length; i++) {
                this.shape[i].click(handler);
            }
        };
        Sigmoid.prototype.compute = function (display) {
            if (!this.computeFlag) {
                this.input.compute(display);
                if (this.input.value < -45.0) {
                    this.value = 0;
                }
                else if (this.input.value > 45.0) {
                    this.value = 1.0;
                }
                else
                    this.value = 1.0 / (1.0 + Math.exp(-this.input.value));
                if (display) {
                    this.shape[0].attr({ fill: NeuralNets.getColor(this.converter.toPercent(this.value)) });
                }
                this.computeFlag = true;
            }
        };
        Sigmoid.prototype.update = function (scale) {
            this.input.update(scale);
        };
        Sigmoid.prototype.backprop = function (sensitivity) {
            this.input.backprop(sensitivity * this.value * (1 - this.value));
        };
        Sigmoid.prototype.reset = function () {
            if (this.computeFlag) {
                this.value = 0;
                this.computeFlag = false;
                this.input.reset();
            }
        };
        Sigmoid.ANGLE = Math.PI * 0.25;
        return Sigmoid;
    }());
    var Bias = (function () {
        function Bias(x, y, size, name, raphael) {
            this.name = name;
            this.shape = [];
            this.shape.push(raphael.rect(x, y, size, size).attr({ fill: "#000" }));
            var label = raphael.text(x + 0.5 * size, y + 0.5 * size, name).attr({ "font-size": 10, "fill": "#fff" });
            label.mouseover(function (e) {
                this[0].style.cursor = "default";
            });
            label.mouseout(function (e) {
                this[0].style.cursor = "";
            });
            this.value = 1;
        }
        Bias.prototype.click = function (handler) {
            for (var i = 0; i < this.shape.length; i++) {
                this.shape[i].click(handler);
            }
        };
        Bias.prototype.compute = function (display) { };
        Bias.prototype.backprop = function (sensitivity) { };
        Bias.prototype.update = function () { };
        Bias.prototype.reset = function () { };
        return Bias;
    }());
    var Step = (function () {
        function Step(input, radius, name, raphael) {
            this.name = name;
            var bb = input.shape[0].getBBox();
            var centerX = bb.x + 0.5 * bb.width;
            var centerY = bb.y + bb.height + radius;
            this.shape = [];
            this.shape.push(raphael.circle(centerX, centerY, radius).attr("fill", NeuralNets.getColor(0.5)));
            this.value = 0;
            this.computeFlag = false;
            this.input = input;
            this.converter = new Converter(-1, 1);
            var pathX = Math.cos(Sigmoid.ANGLE) * radius * 0.8;
            var pathY = Math.sin(Sigmoid.ANGLE) * radius * 0.8;
            var path = concat([
                "M",
                centerX - pathX,
                ",",
                centerY + pathY,
                "H",
                centerX,
                "V",
                centerY - pathY,
                "H",
                centerX + pathX]);
            this.shape.push(raphael.path(path).attr({ "stroke": "#fff", "stroke-width": 2 }));
        }
        Step.prototype.compute = function (display) {
            if (!this.computeFlag) {
                this.input.compute(display);
                if (this.input.value < 0) {
                    this.value = -1.0;
                }
                else {
                    this.value = 1.0;
                }
                if (display) {
                    this.shape[0].attr({ fill: NeuralNets.getColor(this.converter.toPercent(this.value)) });
                }
                this.computeFlag = true;
            }
        };
        Step.prototype.click = function (handler) {
            for (var i = 0; i < this.shape.length; i++) {
                this.shape[i].click(handler);
            }
        };
        Step.prototype.update = function () {
        };
        Step.prototype.backprop = function (sensitivity) {
        };
        Step.prototype.reset = function () {
            if (this.computeFlag) {
                this.value = 0;
                this.computeFlag = false;
                this.input.reset();
            }
        };
        Step.ANGLE = Math.PI * 0.25;
        return Step;
    }());
    var Perceptron = (function () {
        function Perceptron(x, y, width, height, raphael) {
            this.height = height;
            var halfWidth = width * 0.5;
            this.shape = [];
            this.shape.push(raphael.rect(x, y, width, height).attr({ fill: "#555" }));
            this.neg = raphael.rect(x, y, halfWidth, height).attr({ fill: "#fff", stroke: "none" });
            this.pos = raphael.rect(x + halfWidth, y, halfWidth, 0).attr({ fill: "#fff", stroke: "none" });
            this.shape.push(this.neg, this.pos);
            var xx = x + halfWidth + 0.5 * halfWidth;
            var yy = y + 0.5 * height;
            this.shape.push(raphael.path(cross(xx, yy, 8, 2)).attr({ "fill": "#000", "stroke": "#fff" }));
            xx = xx - halfWidth;
            this.shape.push(raphael.circle(xx, yy, 4).attr({ "fill": "#000", "stroke": "#fff" }));
            this.values = [];
            this.computeFlag = false;
        }
        Perceptron.prototype.compute = function (display) {
            if (!this.computeFlag) {
                this.input.compute(display);
                if (this.input.value == -1) {
                    this.values[0] = 1;
                    this.values[1] = 0;
                }
                else {
                    this.values[0] = 0;
                    this.values[1] = 1;
                }
                if (display) {
                    this.neg.attr("height", this.values[1] * this.height);
                    this.pos.attr("height", this.values[0] * this.height);
                }
                this.computeFlag = true;
            }
        };
        Perceptron.prototype.click = function (handler) {
            for (var i = 0; i < this.shape.length; i++) {
                this.shape[i].click(handler);
            }
        };
        Perceptron.prototype.update = function () {
        };
        Perceptron.prototype.backprop = function (sensitivity) {
        };
        Perceptron.prototype.reset = function () {
            if (this.computeFlag) {
                this.computeFlag = false;
                this.input.reset();
                for (var i = 0; i < this.values.length; i++) {
                    this.values[i] = 0;
                }
            }
        };
        Perceptron.prototype.addInput = function (input) {
            this.input = input;
        };
        return Perceptron;
    }());
    var Point = (function () {
        function Point(x, y, shape) {
            this.x = x;
            this.y = y;
            this.shape = shape;
        }
        return Point;
    }());
    var Grid = (function () {
        function Grid(x, y, width, height, rows, columns, raphael) {
            this.x = x;
            this.y = y;
            this.height = height;
            this.rows = rows;
            this.columns = columns;
            this.raphael = raphael;
            this.cells = [];
            this.posPoints = [];
            this.negPoints = [];
            this.scaleX = width / 2;
            this.scaleY = height / 2;
            this.rowScale = 2.0 / rows;
            this.columnScale = 2.0 / columns;
            raphael.rect(x, y, width, height);
            var cellWidth = width / columns;
            var cellHeight = height / columns;
            for (var r = 0; r < rows; r++) {
                for (var c = 0; c < columns; c++) {
                    this.cells.push(raphael.rect(cellWidth * c + x, cellHeight * r + y, cellWidth, cellHeight).attr({ "fill": "#fff", "stroke": "none" }));
                }
            }
        }
        Grid.prototype.addPosPoint = function (x, y) {
            var xx = (x + 1) * this.scaleX + this.x;
            var yy = (this.height - ((y + 1) * this.scaleY)) + this.y;
            var shape = this.raphael.path(cross(xx, yy, 8, 2)).attr({ "fill": "#000", "stroke": "#fff" });
            var point = new Point(x, y, shape);
            this.posPoints.push(point);
            return point;
        };
        Grid.prototype.addNegPoint = function (x, y) {
            var xx = (x + 1) * this.scaleX + this.x;
            var yy = (this.height - ((y + 1) * this.scaleY)) + this.y;
            var shape = this.raphael.circle(xx, yy, 4).attr({ "fill": "#000", "stroke": "#fff" });
            var point = new Point(x, y, shape);
            this.negPoints.push(point);
            return point;
        };
        Grid.prototype.presentBatch = function (net) {
            var i = 0;
            var originalValues = [];
            for (i = 0; i < net.inputs.length; i++) {
                originalValues[i] = net.inputs[i].value;
            }
            for (var i_1 = 0; i_1 < this.posPoints.length; i_1++) {
                var input = this.posPoints[i_1];
                net.present(false, 1, [input.x, input.y]);
            }
            for (var i_2 = 0; i_2 < this.negPoints.length; i_2++) {
                var input = this.negPoints[i_2];
                net.present(false, 0, [input.x, input.y]);
            }
            net.update(1.0 / (this.posPoints.length + this.negPoints.length));
            net.forward(true, originalValues);
        };
        Grid.prototype.classify = function (net) {
            var i = 0;
            var originalValues = [];
            for (i = 0; i < net.inputs.length; i++) {
                originalValues[i] = net.inputs[i].value;
            }
            var values = [];
            for (var r = 0, i_3 = 0; r < this.rows; r++) {
                values[1] = 1 - (r + 0.5) * this.rowScale;
                for (var c = 0; c < this.columns; c++, i_3++) {
                    values[0] = (c + 0.5) * this.columnScale - 1;
                    var result = net.forward(false, values);
                    if (result[0] > result[1]) {
                        this.cells[i_3].attr("fill", "#555");
                    }
                    else {
                        this.cells[i_3].attr("fill", "#fff");
                    }
                }
            }
            for (var i_4 = 0; i_4 < this.posPoints.length; i_4++) {
                var input = this.posPoints[i_4];
                var result = net.forward(false, [input.x, input.y]);
                if (result[0] > result[1]) {
                    input.shape.attr("stroke", "#f00");
                }
                else {
                    input.shape.attr("stroke", "none");
                }
            }
            for (var i_5 = 0; i_5 < this.negPoints.length; i_5++) {
                var input = this.negPoints[i_5];
                var result = net.forward(false, [input.x, input.y]);
                if (result[1] > result[0]) {
                    input.shape.attr("stroke", "#f00");
                }
                else {
                    input.shape.attr("stroke", "none");
                }
            }
            net.forward(true, originalValues);
        };
        return Grid;
    }());
    NeuralNets.Grid = Grid;
})(NeuralNets || (NeuralNets = {}));
//# sourceMappingURL=nn.js.map