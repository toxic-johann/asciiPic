# asciiPic

[![Greenkeeper badge](https://badges.greenkeeper.io/toxic-johann/asciiPic.svg)](https://greenkeeper.io/)

这个东西是用来把图片转换为用ascii码画成的字符画。

clone后直接gulp，然后就可以观看示例。

要下载源码，请下载dist中的文件。

调用的时候可以用require，也可以直接script使用，符合UMD规则。

使用接口为

```
AsciiPic.ascii(particle,canvas,img);
```

其中，particle为粒子程度，比如边上多少个像素为1粒子。如1代表1像素为1粒子，2代表1像素为4粒子。

canvas为页面中的一个canvas元素。img为你上传的img。

返回的是编译好的代码。
