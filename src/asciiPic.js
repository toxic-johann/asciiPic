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
      root.AsciiPic = factory();
  }
}(this, function ($) {
  'use strict'

  function AsciiPic () {
    // 生成映射图
    this._initCharMaps = ()=>{
      var chars = ['@', 'w', '#', '$', 'k', 'd', 't', 'j', 'i', '.', '&nbsp;'];
          var step = 25,
          map = {};
          for (var i = 0; i < 256; i++) {
            var index = ~~ (i / 25)
            map[i] = chars[index];
          };
          return map;
    };

    // 获得平均灰度的粒子
    this._getParticle= arr => {
        let sum = arr.reduce((prev,next)=>{
          return prev+next;
        });
        return sum/arr.length;
      };

      // 粒子化结果
      this._particlize = (arr,parlen,width,height)=>{
        let newOne = [];
        let startTime = Date.now();
        arr = this._liftDimension(arr,width);
        startTime = Date.now();
        for(let row=0;row<arr.length;row+=parlen){
          for(let col=0;col<arr[row].length;col+=parlen){
            let tmp=[];
            for(let r=0;r<parlen;r++){
              for(let c=0;c<parlen;c++){
                if(arr[row+r]){
                  if(arr[row+r][col+c]){
                    tmp.push(arr[row+r][col+c]);
                  }
                }
              }
            }
            if(tmp.length >0){
              newOne.push(map[~~this._getParticle(tmp)]);
            }
            
          }
          newOne.push("\r\n");
        }
        return newOne;
      };

      // 将一位数组转化为二维数组
      this._liftDimension = (arr,width)=>{
        let ret = [];
        let row = -1;
        for(let i=0;i<arr.length;i++){
          if(i%width == 0){
            row++;
            ret.push([]);
          }
          ret[row].push(arr[i]);
        }
        return ret;
      };

      // 图片ascii码化
      this.ascii = (particle,canvas,img)=>{
        let context;
        if (canvas.getContext) {
          context = canvas.getContext('2d');
        } else {
          throw new Error("你的canvas真麻烦");
        }
        let iWidth = img.width;
        let iHeight = img.height
          context.clearRect(0, 0,iWidth, iHeight);
        canvas.width = iWidth;
        canvas.height = iHeight;
        context.drawImage(img, 0, 0); // 设置对应的图像对象，以及它在画布上的位置

        // 提取灰度数据
        let imageData = context.getImageData(0, 0, iWidth, iHeight);
        let pixels = imageData.data;
        let alevel = [];
        for(let i=0;i<pixels.length;i+=4){
          // let tmp = pixels[i]+pixels[i+1]+pixels[i+2];
          let tmp = ~~(pixels[i]*0.3+pixels[i+1]* 0.59+pixels[i+2]*0.11);
          // ~~ (R * 0.3 + G * 0.59 + B * 0.11);
          alevel.push(tmp);
          
        }

        // 获取粒子化后的数据
        let blevel = this._particlize(alevel,particle,iWidth,iHeight);
        return blevel.join("");
      }
      let map = this._initCharMaps();
      return this;
  };
  //    暴露公共方法
  return new AsciiPic;
}));