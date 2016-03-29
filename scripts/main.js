require.config({
    paths: {
        "base": '/scripts/base',
        "jquery": "//cdn.bootcss.com/jquery/2.2.1/jquery.min",
        "ascii":"/dist/asciiPic"
    }
});

require(['jquery'],function(){
    console.log('jquery finish loading');
    require(['ascii'], function(AsciiPic) {
        window.AsciiPic = AsciiPic;
        console.log('ascii finish loading');
        require(['base'],function(){
            console.log('base finish loading');
        });
    });
});