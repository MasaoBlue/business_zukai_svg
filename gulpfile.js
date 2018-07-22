var gulp = require('gulp');
var postcss = require('gulp-postcss');
var cssnext = require('postcss-cssnext');
var nodemon = require('gulp-nodemon');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var pug = require('gulp-pug');
// pug監視がsyntaxエラーで停止しないようにする
var plumber = require('gulp-plumber');

function reload() {
  browserSync.reload({ stream: false });
};

gulp.task('reload', function() {
  reload();
})

gulp.task('browsersync', function() {
  browserSync.init({
    files: ['views', 'public'], // BrowserSyncにまかせるファイル群
    proxy: 'http://localhost:3000',  // express の動作するポートにプロキシ
    port: 8000,  // BrowserSync は 8000 番ポートで起動
    ui: {port: 3002},
    open: true  // ブラウザ open しない
  });
});

// サーバ側処理の変更時にサーバを再起動させる
gulp.task('serve', ['browsersync'], function () {
  nodemon({
    script: './bin/www',
    ext: 'js',
    ignore: [  // nodemon で監視しないディレクトリ
      'node_modules',
      'public',
      'views',
    ],
    env: {
      'NODE_ENV': 'development'
    },
    stdout: false  // Express の再起動時のログを監視するため
  }).on('readable', function() {
    this.stdout.on('data', function(chunk) {
      if (/express ready/.test(chunk)) {
        // Express の再起動が完了したら、reload() でBrowserSync に通知。
        // ※Express で出力する起動時のメッセージに合わせて比較文字列は修正
        reload();
      }
      process.stdout.write(chunk);
    });
    this.stderr.on('data', function(chunk) {
      process.stderr.write(chunk);
    });
  });
});

// SassとCssの保存先を指定
var sassInDir = './assets/stylesheets/**/*.sass';
var cssOutDir = './public/stylesheets';
gulp.task('sass', function(){
  var processors = [
    cssnext()
  ];
  gulp.src(sassInDir)
    .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
    .pipe(postcss(processors))
    .pipe(gulp.dest(cssOutDir));
});

//自動監視(sass)
gulp.task('sass-watch', ['sass'], () => {
  var watcher = gulp.watch(sassInDir, ['sass']);
  watcher.on('change', (event) => {
  });
});

// htmlとpugの保存先を指定
var pugInDir = './views';
var htmlOutDir = './public';
var pugInPath = pugInDir + '/**/*.pug';
gulp.task('pug', () => {
  return gulp.src(
      [pugInPath, '!' + pugInDir + '/**/_*.pug']
    ) // インクルード用ファイルは除外
    .pipe(plumber())
    .pipe(pug({
      pretty: true
    }))
    .pipe(gulp.dest(htmlOutDir));
});
//自動監視(pug)
gulp.task('pug-watch', ['pug'], () => {
  var watcher = gulp.watch(pugInPath, ['pug']);
  watcher.on('change', (event) => {
  });
});

gulp.task('default', ['sass-watch', 'pug-watch', 'serve']);
