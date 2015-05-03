
var gulp = require('gulp');
var argv = require('yargs').argv;
var runSequence = require('run-sequence');
var path = require('path');
var watch = require('gulp-watch');
var connect = require('gulp-connect');
var compass = require('gulp-compass');
var shell = require('gulp-shell');
var clean = require('gulp-clean');

var params = {
  target: argv.target
};

var paths = {
  dir: __dirname,
  app: [
    './common/app/**/*'
  ],
  tmp: './.tmp'
};
// clean
gulp.task('clean', function () {
    return gulp.src(['./.tmp','./dist']).pipe(clean());
});
// copy to .tmp
gulp.task('copy-app-tmp', function () {
  return gulp.src(paths.app).pipe(gulp.dest(paths.tmp + '/app'));
});
// copy to .tmp
gulp.task('copy-target-tmp',function () {
  if (params.target) {
    return gulp.src(path.join(__dirname, '/targets',params.target,'/**/*')).pipe(gulp.dest('./.tmp'));
  }
});

// watching for file changing
gulp.task('watch', function () {
  gulp.watch('./common/app/**/*', ['default']);
  if (params.target) gulp.watch('./targets/'+params.target+'/app/**/*', ['copy-target-tmp']);
  gulp.watch('./.tmp/app/styles/**/*.{scss,sass}', ['compass']);
});
gulp.task('livereload', function() {
  return gulp.src(['.tmp/app/**/*'])
    .pipe(watch())
    .pipe(connect.reload());
});

gulp.task('webserver', function() {
  return connect.server({
    livereload: true,
    root: ['.tmp/app']
  });
});
gulp.task('compass', function() {
  return gulp.src(['./.tmp/app/styles/**/*.{scss,sass}'])
    .pipe(compass({
      project: path.join(__dirname, '.tmp/app'),
      css: 'styles',
      sass: 'styles'
    }));
    //.pipe(gulp.dest('app/assets/temp'));
});

gulp.task('serve', ['default', 'watch', 'webserver'], function () {});
gulp.task('default', function (cb) {
  return runSequence('clean','copy-app-tmp', 'copy-target-tmp','compass', cb);
});

gulp.task('copy-sources', function () {
  var src = ['common/**/*', '!common/app/**/*'];
  if (params.target) {
    src.push('targets/'+params.target+'/**/*');
    src.push('!targets/'+params.target+'/app/**/*');
  }
  return gulp.src(src).pipe(gulp.dest('dist'));
});
// copy result from tmp to destination (www) folder
gulp.task('copy-to-www', function () {
  return gulp.src(['./.tmp/app/**/*', '!./.tmp/app/**/*.{sass,scss}'], {
    base: './.tmp/app'
  }).pipe(gulp.dest('./dist/www'));
});

// add platform from dist/package.json file
gulp.task('platform-add', function () {
  var p = require ('./dist/package.json');
  var tasks = ['ls'];
  if (p.platforms) {
    p.platforms.forEach(function (item) {
      tasks.push('cordova platform add '+item);
    });
  }
  return gulp.src('')
    .pipe(shell(tasks, {cwd: './dist'}));
});
gulp.task('build', function (cb) {
  return runSequence('default', 'copy-to-www', 'copy-sources','platform-add',cb);
});
