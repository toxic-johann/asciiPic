'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node, CommonJS之类的
        module.exports = factory();
    } else {
        // 浏览器全局变量(root 即 window)
        root = root || window;
        root.photoshop = factory();
    }
})(undefined, function () {
    'use strict';

    function Photoshop(opt) {
        var _this = this,
            _arguments = arguments;

        var _events = {};
        this.adjustContrast = function (imageData, coefficient) {
            var self = _this;
            if (!_this._isUint8ClampedArray(imageData)) {
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            coefficient = coefficient || 0;
            var average = _this._getAverageOfRGB(imageData);
            imageData = _this._testArrayMap(imageData);
            imageData = imageData.map(function (each, index) {
                // 排除透明度
                if ((index + 1) % 4 == 0) {
                    return each;
                }
                var delta = each - average;
                var ans = each + delta * coefficient;
                // 作防护性处理
                if (ans > 255) {
                    ans = 255;
                } else if (ans < 0) {
                    ans = 0;
                }
                return ans;
            });
            self.trigger("contrastAdjusted");
            return imageData;
        },
        // 因为需要宽高，因此直接引入imageData
        this.sketch = function (imageData, radius) {
            var self = _this;
            if (!self._isImageData(imageData)) {
                throw new Error("imageData need to be an ImageData");
            }
            if (!radius && radius != 0) {
                radius = 20;
            }
            radius = parseInt(radius);
            var pixels = imageData.data;
            var grayscale = self._getGrayscaleImage(pixels);
            var anticolor = self._getAntiColorImage(grayscale);
            var gaussblur = self._getGaussianBlurImage(anticolor, imageData.width, imageData.height, radius);
            var lastimage = self._getDodgeImage(grayscale, gaussblur);
            self.trigger("sketched");

            return lastimage;
        }, this._getAverageOfRGB = function (imageData) {
            if (!_this._isUint8ClampedArray(imageData)) {
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            var num = imageData.length * 0.75;
            if (num <= 0) {
                return 0;
            }
            imageData = _this._testArrayReduce(imageData);
            var sum = imageData.reduce(function (prev, curr, index) {
                // 判断是否是透明度
                if ((index + 1) % 4 == 0) {
                    return prev;
                }
                return prev + curr;
            }, 0);
            return sum / num;
        },
        // 得到灰度图
        this._getGrayscaleImage = function (imageData) {
            if (!_this._isUint8ClampedArray(imageData)) {
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            var length = imageData.length;
            if (length <= 0) {
                throw new Error("could not handle a empty Uint8ClampedArray");
            }
            var grayArr = [];
            for (var i = 0; i < length; i = i + 4) {
                var gray = imageData[i] * 0.3 + imageData[i + 1] * 0.59 + imageData[i + 2] * 0.11;
                grayArr.push(gray, gray, gray, imageData[i + 3]);
            }
            return _this._generateUint8ClampedArray(grayArr);
        },
        // 得到反色图
        this._getAntiColorImage = function (imageData) {
            if (!_this._isUint8ClampedArray(imageData)) {
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            var length = imageData.length;
            if (length <= 0) {
                throw new Error("could not handle a empty Uint8ClampedArray");
            }
            imageData = _this._testArrayMap(imageData);
            var antiArr = imageData.map(function (each, index) {
                if ((index + 1) % 4 == 0) {
                    return each;
                }
                return 255 - each;
            });
            return _this._generateUint8ClampedArray(antiArr);
        },
        // 得到高斯模糊处理后的图像
        // 原理就是利用正态分布处理均值
        this._getGaussianBlurImage = function (imageData, width, height, radius, sigma) {
            var self = _this;
            if (!_this._isUint8ClampedArray(imageData)) {
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            var length = imageData.length;
            if (length <= 0) {
                throw new Error("could not handle a empty Uint8ClampedArray");
            }
            if (imageData.length != width * height * 4) {
                throw new Error("imageData像素数目与宽高不一致");
            }
            radius = parseInt(radius) || 3;
            sigma = sigma || radius / 3;

            var gaussArr = _this._oneGaussianOp(imageData, width, height, radius, sigma);
            return _this._generateUint8ClampedArray(gaussArr);
        }, this._getOneGaussianMatrix = function (radius, sigma) {
            var gaussMatrix = [];
            var gaussSum = 0;
            // 计算矩阵计算系数
            var a = 1 / (Math.sqrt(2 * Math.PI) * sigma);
            var b = -1 / (2 * sigma * sigma);

            // 生成高斯矩阵
            for (var x = -radius; x <= radius; x++) {
                var tmp = a * Math.exp(b * x * x);
                gaussMatrix.push(tmp);
                gaussSum = gaussSum + tmp;
            }

            // 归一化，确保高斯矩阵的最终的和值在0/1之间

            gaussMatrix = gaussMatrix.map(function (each) {
                return each / gaussSum;
            });

            return {
                matrix: gaussMatrix,
                sum: gaussSum
            };
        }, this._oneGaussianOp = function (imageData, width, height, radius, sigma, alpha) {
            var self = _this;
            var gauss = self._getOneGaussianMatrix(radius, sigma);
            var length = imageData.length;
            imageData = _this._testArrayMap(imageData);
            // x方向进行高斯运算
            var ximage = imageData.map(function (each, index) {
                // 获取各个位置
                var pos = index % 4;
                var hei = ~ ~(index / 4 / width);
                var wid = ~ ~(index / 4 % width);
                // 不处理透明度
                if (!alpha && index % 4 == 3) {
                    return each;
                }
                var sum = 0;
                for (var r = -radius; r <= radius; r++) {
                    var data = imageData[((width + wid + r) % width + width * hei) * 4 + pos];
                    var gdata = gauss.matrix[r + radius] * data;
                    sum = sum + gdata;
                }
                return sum;
            });
            // y方向进行高斯运算，在X处理后
            var yimage = ximage.map(function (each, index) {
                var pos = index % 4;
                var hei = ~ ~(index / 4 / width);
                var wid = ~ ~(index / 4 % width);
                // 不处理透明度
                if (!alpha && index % 4 == 3) {
                    return each;
                }
                var sum = 0;
                for (var r = -radius; r <= radius; r++) {
                    var data = ximage[((height + hei + r) % height * width + wid) * 4 + pos];
                    var gdata = gauss.matrix[r + radius] * data;
                    sum = sum + gdata;
                }
                return sum;
            });

            return yimage;
        }, this._twoGaussianOp = function (imageData, width, height, radius, sigma, alpha) {},
        // 减淡算法
        this._getDodgeImage = function (a, b) {
            if (!_this._isUint8ClampedArray(a) || !_this._isUint8ClampedArray(b)) {
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            if (a.length != b.length) {
                throw new Error("参数数目不对，无法减淡");
            }
            a = _this._testArrayMap(a);
            var dodge = a.map(function (each, index) {
                if (index % 4 == 3) {
                    return each;
                }
                return Math.min(each + each * b[index] / (255 - b[index]), 255);
            });
            return _this._generateUint8ClampedArray(dodge);
        }, this._isUint8ClampedArray = function (arr) {
            arr = arr || 0;
            var cons = arr.constructor.toString();
            if (cons.match("Uint8ClampedArray")) {
                return true;
            }
            return false;
        }, this._isImageData = function (obj) {
            obj = obj || 0;
            var cons = obj.constructor.toString();
            if (cons.match("ImageData")) {
                return true;
            }
            return false;
        }, this._testArrayMap = function (arr) {
            if (!arr.map) {
                return Array.prototype.slice.call(arr);
            }
            return arr;
        }, this._testArrayReduce = function (arr) {
            if (!arr.reduce) {
                return Array.prototype.slice.call(arr);
            }
            return arr;
        };
        this._generateUint8ClampedArray = function (arr) {
            if (_this._isUint8ClampedArray(arr)) {
                return arr;
            }
            if (!Array.isArray(arr)) {
                throw new Error("could only generate Uint8ClampedArray from an array");
                return;
            }
            // 特性判断
            if (!Uint8ClampedArray.from) {
                return new Uint8ClampedArray(arr);
            }
            return Uint8ClampedArray.from(arr);
        };
        // 生成uuid
        this._guid = function () {
            function S4() {
                return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
            }
            return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
        },
        // 内置事件方法
        // 绑定
        this.on = function (type, listener) {
            if (!type || !listener) {
                throw new Error("事件绑定参数不全");
                return;
            }
            var self = _this;
            var id = self._guid();
            var anEvent = {
                type: type,
                listener: listener,
                id: self.id
            };
            if (!_events[type]) {
                _events[type] = [anEvent];
            } else {
                _events[type].push(listener);
            }
            return id;
        },
        // 取消绑定
        this.off = function (type, id) {
            if (!type) {
                throw new Error("事件解绑必须规定事件类型");
                return;
            }
            if (!id) {
                _events[type] = null;
            } else {
                _events[type] = _events[type].filter(function (each) {
                    if (each.id == id) {
                        return false;
                    }
                    return true;
                });
            };
        },
        // 触发
        this.trigger = function (type) {
            var self = _this;
            if (!type) {
                throw new Error("事件触发需申明事件类型");
            }
            if (!_events[type]) {
                console.warn("该类型没有绑定事件");
                return;
            }
            var args = [].slice.call(_arguments, 1);
            _events[type].forEach(function (each) {
                each.listener.apply(self, args);
            });
        };
        return this;
    };
    // 暴露公共方法
    return Photoshop;
});