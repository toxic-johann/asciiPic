require.config({
    paths: {
        "base": '/scripts/base.js',
        "jquery": "//cdn.bootcss.com/jquery/2.2.1/jquery.min.js",
        "ascii":"/dist/asciiPic.js"
    }
});

require(['jquery'],function(){
    console.log('jquery finish loading');
    require(['ascii'], function() {
        console.log('ascii finish loading');
        require(['base'],function(){
            console.log('base finish loading');
        });
    });
});