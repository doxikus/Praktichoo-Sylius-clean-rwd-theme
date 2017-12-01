var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var pump = require('pump');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var autoprefixerOptions = {
    browsers: ['last 2 versions', '> 5%', 'Firefox ESR']
};

gulp.task('sass', function () {
    return gulp.src('./frontend/scss/**/*.scss')
        .pipe(sass({
            outputStyle: 'compressed',
        }).on('error', sass.logError))
        .pipe(autoprefixer(autoprefixerOptions))
        .pipe(gulp.dest('./../../../web/bundles/_themes/sylius/inchoo-rwd/syliusshop/css/'));
});

gulp.task('sourcemaps', function () {
    gulp.src('./frontend/scss/**/*.scss')
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./../../../web/bundles/_themes/sylius/inchoo-rwd/syliusshop/css/'));
});

gulp.task('browser-sync', function () {
    browserSync.init(["./../../../web/bundles/_themes/sylius/inchoo-rwd/syliusshop/css/*.css", "./../../../web/bundles/_themes/sylius/inchoo-rwd/syliusshop/js/*.js"], {
        proxy: "localhost",
        port: 8000
    });
});

gulp.task('uglify', function (cb) {
    gulp.src(['./frontend/js/vendor/*.js','./frontend/js/sylius/*.js','./frontend/js/*.js'])
        .pipe(uglify())
        .pipe(concat('style.js'))
        .pipe(gulp.dest('./../../../web/bundles/_themes/sylius/inchoo-rwd/syliusshop/js/'))
});

gulp.task('dev', ['sass', 'uglify', 'sourcemaps', 'browser-sync'], function () {
    gulp.watch("./frontend/scss/**/*.scss", ['sass', 'sourcemaps']);
    gulp.watch("./frontend/js/*.js", ['uglify']);
});

gulp.task('build', ['sass', 'uglify']);