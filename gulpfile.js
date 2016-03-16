var gulp        = require('gulp');
var babel = require('gulp-babel');
var browserSync = require('browser-sync').create();
var reload      = browserSync.reload;

gulp.task('js', function () {
    return gulp.src('src/*.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dist'))
});

gulp.watch("src/*.js", ['js-watch']);
gulp.watch("dist/*.html",['html-watch']);

// 创建一个任务确保JS任务完成之前能够继续响应
// 浏览器重载
gulp.task('js-watch', ['js'], function(){browserSync.reload()});
gulp.task('html-watch', function(){browserSync.reload()});

// 使用默认任务启动Browsersync，监听JS文件
gulp.task('serve', ['js'], function () {

    // 从这个项目的根目录启动服务器
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });

    // 添加 browserSync.reload 到任务队列里
    // 所有的浏览器重载后任务完成。
    
});

gulp.task('default', ['serve']);