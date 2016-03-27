(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node, CommonJS之类的
        module.exports = factory();
    } else {
        // 浏览器全局变量(root 即 window)
        root = root || window;
        root.photoshop = factory();
    }
}(this, function () {
    'use strict'

    function Photoshop (opt) {
        let _events = {};
        this.adjustContrast = (imageData,coefficient)=>{
            let self = this;
            if(!this._isUint8ClampedArray(imageData)){
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            coefficient = coefficient || 0;
            let average = this._getAverageOfRGB(imageData);
            imageData = this._testArrayMap(imageData);
            imageData = imageData.map((each,index)=>{
                // 排除透明度
                if((index+1)%4 == 0){
                    return each;
                }
                let delta = each-average;
                let ans = each+delta*coefficient;
                // 作防护性处理
                if(ans > 255){
                    ans = 255;
                } else if(ans < 0 ){
                    ans = 0;
                }
                return ans;
            });
            self.trigger("contrastAdjusted");
            return imageData;
        },
        // 因为需要宽高，因此直接引入imageData
        this.sketch = (imageData,radius)=>{
            let self = this;
            if(!self._isImageData(imageData)){
                throw new Error("imageData need to be an ImageData");
            }
            if(!radius && radius != 0){
                radius = 20;
            }
            radius = parseInt(radius)
            let pixels = imageData.data;
            let grayscale = self._getGrayscaleImage(pixels);
            let anticolor = self._getAntiColorImage(grayscale);
            let gaussblur = self._getGaussianBlurImage(anticolor,imageData.width,imageData.height,radius);
            let lastimage = self._getDodgeImage(grayscale,gaussblur);
            self.trigger("sketched");

            return lastimage;
        },
        this._getAverageOfRGB = (imageData)=>{
            if(!this._isUint8ClampedArray(imageData)){
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            let num = imageData.length*0.75;
            if(num <= 0 ){
                return 0;
            }
            imageData = this._testArrayReduce(imageData);
            let sum = imageData.reduce((prev,curr,index)=>{
                // 判断是否是透明度
                if((index+1)%4 == 0){
                    return prev;
                }
                return prev+curr;
            },0);
            return sum/num;
        },
        // 得到灰度图
        this._getGrayscaleImage = (imageData)=>{
            if(!this._isUint8ClampedArray(imageData)){
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            let length = imageData.length;
            if(length<=0){
                throw new Error("could not handle a empty Uint8ClampedArray");
            }
            let grayArr = [];
            for(let i=0;i<length;i=i+4){
                let gray = imageData[i]*0.3+imageData[i+1]* 0.59+imageData[i+2]*0.11;
                grayArr.push(gray,gray,gray,imageData[i+3]);
            }
            return this._generateUint8ClampedArray(grayArr);
        },
        // 得到反色图
        this._getAntiColorImage = (imageData)=>{
            if(!this._isUint8ClampedArray(imageData)){
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            let length = imageData.length;
            if(length<=0){
                throw new Error("could not handle a empty Uint8ClampedArray");
            }
            imageData = this._testArrayMap(imageData);
            let antiArr = imageData.map((each,index)=>{
                if((index+1)%4 == 0){
                    return each;
                }
                return 255-each;
            });
            return this._generateUint8ClampedArray(antiArr);
        },
        // 得到高斯模糊处理后的图像
        // 原理就是利用正态分布处理均值
        this._getGaussianBlurImage = (imageData,width,height,radius,sigma)=>{
            let self = this;
            if(!this._isUint8ClampedArray(imageData)){
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            let length = imageData.length;
            if(length<=0){
                throw new Error("could not handle a empty Uint8ClampedArray");
            }
            if(imageData.length != width*height*4){
                throw new Error("imageData像素数目与宽高不一致")
            }
            radius = parseInt(radius) || 3;
            sigma = sigma || radius/3;

            let gaussArr = this._oneGaussianOp(imageData,width,height,radius,sigma);
            return this._generateUint8ClampedArray(gaussArr);
        },
        this._getOneGaussianMatrix = (radius,sigma)=>{
            let gaussMatrix = [];
            let gaussSum = 0;
            // 计算矩阵计算系数
            let a = 1/(Math.sqrt(2*Math.PI)*sigma);
            let b = -1/(2*sigma*sigma);

            // 生成高斯矩阵
            for(let x = -radius;x<=radius;x++){
                let tmp = a*Math.exp(b*x*x);
                gaussMatrix.push(tmp);
                gaussSum = gaussSum + tmp;
            }

            // 归一化，确保高斯矩阵的最终的和值在0/1之间

            gaussMatrix = gaussMatrix.map(each=>{
                return each/gaussSum;
            });

            return {
                matrix:gaussMatrix,
                sum:gaussSum
            };
        },
        this._oneGaussianOp = (imageData,width,height,radius,sigma,alpha)=>{
            let self = this;
            let gauss = self._getOneGaussianMatrix(radius,sigma);
            let length = imageData.length;
            imageData = this._testArrayMap(imageData);
            // x方向进行高斯运算
            let ximage= imageData.map((each,index)=>{
                // 获取各个位置
                let pos = index%4;
                let hei = ~~(index/4/width);
                let wid = ~~(index/4%width);
                // 不处理透明度
                if(!alpha && index%4 == 3){
                    return each;
                }
                let sum=0;
                for(let r=-radius;r<=radius;r++){
                    let data  = imageData[((width+wid+r)%width+width*(hei))*4+pos];
                    let gdata = gauss.matrix[r+radius]*data; 
                    sum = sum+gdata;
                }
                return sum;
            });
            // y方向进行高斯运算，在X处理后
            let yimage= ximage.map((each,index)=>{
                let pos = index%4;
                let hei = ~~(index/4/width);
                let wid = ~~(index/4%width);
                // 不处理透明度
                if(!alpha && index%4 == 3){
                    return each;
                }
                let sum=0;
                for(let r=-radius;r<=radius;r++){
                    let data  = ximage[((height+hei+r)%height*width+wid)*4+pos];
                    let gdata = gauss.matrix[r+radius]*data; 
                    sum = sum+gdata;
                }
                return sum;
            });

            return yimage;
        },
        this._twoGaussianOp = (imageData,width,height,radius,sigma,alpha)=>{
            
        },
        // 减淡算法
        this._getDodgeImage = (a,b)=>{
            if(!this._isUint8ClampedArray(a) || !this._isUint8ClampedArray(b)){
                throw new Error("imageData need to be an Uint8ClampedArray");
            }
            if(a.length != b.length){
                throw new Error("参数数目不对，无法减淡");
            }
            a = this._testArrayMap(a);
            let dodge = a.map((each,index)=>{
                if(index%4 == 3){
                    return each;
                }
                return Math.min((each+(each*b[index])/(255-b[index])),255);
            });
            return this._generateUint8ClampedArray(dodge);
        },
        this._isUint8ClampedArray = arr=>{
            arr = arr || 0;
            let cons = arr.constructor.toString();
            if(cons.match("Uint8ClampedArray")){
                return true;
            }
            return false;
        },
        this._isImageData = obj=>{
            obj = obj || 0;
            let cons = obj.constructor.toString();
            if(cons.match("ImageData")){
                return true;
            }
            return false;
        },
        this._testArrayMap = (arr)=>{
            if(!arr.map){
                return Array.prototype.slice.call(arr);
            }
            return arr;
        },
        this._testArrayReduce = (arr)=>{
            if(!arr.reduce){
                return Array.prototype.slice.call(arr);
            }
            return arr;
        }
        this._generateUint8ClampedArray = arr=>{
            if(this._isUint8ClampedArray(arr)){
                return arr;
            }
            if(!Array.isArray(arr)){
                throw new Error("could only generate Uint8ClampedArray from an array");
                return;
            }
            // 特性判断
            if(!Uint8ClampedArray.from){
                return new Uint8ClampedArray(arr);
            }
            return Uint8ClampedArray.from(arr);
            
        }
        // 生成uuid
        this._guid = ()=>{
            function S4() {
               return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
            }
            return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
        },
        // 内置事件方法
        // 绑定
        this.on = (type,listener)=>{
            if(!type || !listener){
                throw new Error("事件绑定参数不全")
                return;
            }
            let self = this;
            let id  = self._guid();
            let anEvent = {
                type:type,
                listener:listener,
                id:self.id,
            }
            if(!_events[type]){
                _events[type] = [anEvent];
            } else {
                _events[type].push(listener);
            }
            return id;
        },
        // 取消绑定
        this.off = (type,id)=>{
            if(!type){
                throw new Error("事件解绑必须规定事件类型")
                return;
            }
            if(!id){
                _events[type] = null;
            } else {
                _events[type] = _events[type].filter(each=>{
                    if(each.id == id){
                        return false;
                    }
                    return true;
                })
            };
        },
        // 触发
        this.trigger = (type)=>{
            let self = this;
            if(!type){
                throw new Error("事件触发需申明事件类型");
            }
            if(!_events[type]){
                console.warn("该类型没有绑定事件");
                return;
            }
            let args = [].slice.call(arguments,1);
            _events[type].forEach(each=>{
                each.listener.apply(self,args);
            });
        }
        return this;
    };
    // 暴露公共方法
    return Photoshop;
}));