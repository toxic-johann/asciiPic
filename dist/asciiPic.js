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
    root.AsciiPic = factory();
  }
})(undefined, function () {
  'use strict';

  function AsciiPic() {
    var _this = this,
        _arguments = arguments;

    // 生成映射图
    this._initCharMaps = function () {
      var chars = ['@', 'w', '#', '$', 'k', 'd', 't', 'j', 'i', '.', '&nbsp;'];
      var step = 25,
          map = {};
      for (var i = 0; i < 256; i++) {
        var index = ~ ~(i / 25);
        map[i] = chars[index];
      };
      return map;
    };

    // 获得平均灰度的粒子
    this._getParticle = function (arr) {
      var sum = arr.reduce(function (prev, next) {
        return prev + next;
      });
      var ans = sum / arr.length;
      return ans;
    };

    // 粒子化结果
    this._particlize = function (arr, parlen, width, height) {
      var newOne = [];
      arr = _this._liftDimension(arr, width);
      var temp = arr[0].length;
      for (var row = 0; row < arr.length; row += parlen) {
        for (var col = 0; col < arr[row].length; col += parlen) {
          var tmp = [];
          for (var r = 0; r < parlen; r++) {
            for (var c = 0; c < parlen; c++) {
              if (arr[row + r]) {
                if (arr[row + r][col + c] || arr[row + r][col + c] == 0) {
                  tmp.push(arr[row + r][col + c]);
                }
              }
            }
          }
          if (tmp.length > 0) {
            newOne.push(map[~ ~_this._getParticle(tmp)]);
          }
        }
        newOne.push("\r\n");
      }
      return newOne;
    };

    // 将一位数组转化为二维数组
    this._liftDimension = function (arr, width) {
      var ret = [];
      var row = -1;
      for (var i = 0; i < arr.length; i++) {
        if (i % width == 0) {
          row++;
          ret.push([]);
        }
        ret[row].push(arr[i]);
      }
      return ret;
    };

    // 图片ascii码化
    this.ascii = function (particle, canvas, img) {
      var context = void 0;
      if (canvas.getContext) {
        context = canvas.getContext('2d');
      } else {
        throw new Error("你的canvas真麻烦");
      }
      var iWidth = img.width;
      var iHeight = img.height;
      context.clearRect(0, 0, iWidth, iHeight);
      canvas.width = iWidth;
      canvas.height = iHeight;
      context.drawImage(img, 0, 0); // 设置对应的图像对象，以及它在画布上的位置

      // 提取灰度数据
      var imageData = context.getImageData(0, 0, iWidth, iHeight);
      var pixels = imageData.data;
      var alevel = [];
      for (var i = 0; i < pixels.length; i += 4) {
        // let tmp = pixels[i]+pixels[i+1]+pixels[i+2];
        var tmp = ~ ~(pixels[i] * 0.3 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.11);
        // ~~ (R * 0.3 + G * 0.59 + B * 0.11);
        alevel.push(tmp);
      }

      // 获取粒子化后的数据
      var blevel = _this._particlize(alevel, particle, iWidth, iHeight);

      return blevel.join("");
    };

    this.asciiFromCanvas = function (particle, canvas) {
      var context = void 0;
      var self = _this;
      particle = parseInt(particle);
      if (canvas.getContext) {
        context = canvas.getContext('2d');
      } else {
        throw new Error("你的canvas真麻烦");
      }
      var iWidth = canvas.width;
      var iHeight = canvas.height;

      // 提取灰度数据
      var imageData = context.getImageData(0, 0, iWidth, iHeight);
      var pixels = imageData.data;
      var alevel = [];
      for (var i = 0; i < pixels.length; i += 4) {
        // let tmp = pixels[i]+pixels[i+1]+pixels[i+2];
        var tmp = ~ ~(pixels[i] * 0.3 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.11);
        // ~~ (R * 0.3 + G * 0.59 + B * 0.11);
        alevel.push(tmp);
      };

      // 获取粒子化后的数据
      var blevel = _this._particlize(alevel, particle, iWidth, iHeight);
      self.trigger("asciiedFromCanvas");
      return blevel.join("");
    };

    this.asciiFromImagedata = function (particle, imageData) {
      var context = void 0;
      var self = _this;
      particle = parseInt(particle);
      var iWidth = imageData.width;
      var iHeight = imageData.height;

      // 提取灰度数据
      var pixels = imageData.data;
      var alevel = [];
      for (var i = 0; i < pixels.length; i += 4) {
        // let tmp = pixels[i]+pixels[i+1]+pixels[i+2];
        var tmp = ~ ~(pixels[i] * 0.3 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.11);
        // ~~ (R * 0.3 + G * 0.59 + B * 0.11);
        alevel.push(tmp);
      };

      // 获取粒子化后的数据
      var blevel = _this._particlize(alevel, particle, iWidth, iHeight);
      self.trigger("asciiedFromImagedata");
      return blevel.join("");
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
        _events[type].push(anEvent);
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
        return;
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

    var map = this._initCharMaps();
    var _events = {};
    return this;
  };
  // 暴露公共方法
  return AsciiPic;
});