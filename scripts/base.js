var img = new Image();
var canvas = document.getElementById("test");

// 监听图片上传
function imageUpload(myFiles){
    var imageReader = new FileReader();
    imageReader.onload = function(e) {
        var dataUrl = e.target.result;
        img.src = dataUrl;
    }
    imageReader.readAsDataURL(myFiles[0]);
}

img.onload = function() { 
	var particle = parseInt($("#particle").val()) || 2;
	document.getElementById("show").innerHTML = AsciiPic.ascii(particle,canvas,img);
}

$("#upload").on("change",function(evt){
	imageUpload(this.files);
});

$("#particle").on("keydown",function(evt){
	if(evt.keyCode == 13 && $("#upload")[0].files.length>0){
		var particle = parseInt($("#particle").val()) || 2;
		document.getElementById("show").innerHTML = AsciiPic.ascii(particle,canvas,img);
	}
})