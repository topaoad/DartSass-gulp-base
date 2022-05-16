const { src, dest, watch, series, parallel, lastRun } = require("gulp");
const gcmq = require("gulp-group-css-media-queries");
const mode = require("gulp-mode")();
const sass = require("gulp-sass")(require("sass"));
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssdeclsort = require("css-declaration-sorter");
const browserSync = require("browser-sync");
const crypto = require("crypto");
const pug = require("gulp-pug");
const hash = crypto.randomBytes(8).toString("hex");
const replace = require("gulp-replace");
const tinypng = require("gulp-tinypng-extended");
const webp = require("gulp-webp");
const webpackStream = require("webpack-stream");
const webpack = require("webpack");
const cssnext = require("postcss-cssnext")
const webpackConfig = require("./webpack.config");

const bundleJs = (done) => {
  webpackStream(webpackConfig, webpack)
    .on("error", function (e) {
      console.error(e);
      this.emit("end");
    })
    .pipe(dest("dist/js"));
  done();
};

const compileSass = (done) => {
  // postcssを纏めて変数に代入
  const postcssPlugins = [
    autoprefixer({
      grid: "autoplace",
      cascade: false,
    }),
    cssdeclsort({ order: "alphabetical" }),
  ];
  src("./src/scss/**/*.scss", { sourcemaps: true })
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      sass.sync({
        includePaths: ["src/scss"],
        outputStyle: "expanded",
      })
    )
    // .pipe(sass({ outputStyle: "expanded" }))
    .pipe(mode.production(gcmq())) // 追加
    .pipe(postcss(postcssPlugins)) // まとめた変数はここで使う
    .pipe(mode.production(gcmq())) // 追加
    .pipe(dest("./dist/css", { sourcemaps: "./sourcemaps" }))
    .pipe(notify({ message: "Sassのコンパイル成功だよー", onLast: true }));
  done();
};

const buildServer = (done) => {
  browserSync.init({
    port: 8080,
    files: ["**/*"],
    // 静的サイト
    // server: { baseDir: './' },
    server: { baseDir: "./dist" },
    // 動的サイトwordpressの場合はこちらを使用
    // proxy: "http://localsite.local/",
    open: true,
    watchOptions: {
      debounceDelay: 1000,
    },
  });
  done();
};

const browserReload = (done) => {
  browserSync.reload();
  done();
};

const compilePug = (done) => {
  src(["./src/pug/**/*.pug", "!" + "./src/pug/**/_*.pug"])
    .pipe(
      plumber({ errorHandler: notify.onError("Error: <%= error.message %>") })
    )
    .pipe(
      pug({
        pretty: true,
      })
    )
    .pipe(dest("./dist"))
    .on("end", done);
  done();
};

const tinyPng = (done) => {
  src("./src/img/**/*.{png,jpg,jpeg}")
    .pipe(plumber())
    .pipe(
      tinypng({
        key: "wkKg8Tqg4XTRv2Qqww2Wb9cZZLrX3Hy7",
        sigFile: "./src/img/.tinypng-sigs",
        log: true,
        summarise: true,
        sameDest: true,
        parallel: 10,
      })
    )
    .pipe(dest("./src/img"))
    .on("end", done);
};

const copyImages = (done) => {
  src(["./src/img/**/*"]).pipe(dest("./dist/img")).on("end", done);
};

const generateWebp = (done) => {
  src("./dist/img/**/*.{png,jpg,jpeg}", { since: lastRun(generateWebp) })
    .pipe(webp())
    .pipe(dest("dist/img"));
  done();
};

const cacheBusting = (done) => {
  src("./dist/index.html")
    .pipe(replace(/\.(js|css)\?ver/g, ".$1?ver=" + hash))
    .pipe(replace(/\.(webp|jpg|jpeg|png|svg|gif)/g, ".$1?ver=" + hash))
    .pipe(dest("./dist"));
  done();
};

const watchFiles = () => {
  watch("./src/scss/**/*.scss", series(compileSass, browserReload));
  watch("./src/pug/**/*.pug", series(compilePug, browserReload));
  watch("./src/js/**/*.js", series(bundleJs, browserReload));
  watch("./src/img/**/*", series(copyImages, generateWebp, browserReload));
  // /watch('./**/*.html', browserReload)
};

// npx gulp　●●で動きます。defaultに設定するとnpx gulpだけで動きます。
module.exports = {
  sass: compileSass,
  pug: compilePug,
  cache: cacheBusting,
  bundle: bundleJs,
  tinypng: tinyPng,
  webp: generateWebp,
  image: series(tinyPng, generateWebp, copyImages),
  build: series(
    parallel(compileSass, bundleJs, compilePug),
    tinyPng,
    copyImages,
    generateWebp,
    cacheBusting
  ),
  default: parallel(buildServer, watchFiles),
};

// // npx gulpで出力する内容
// exports.default = series(compileSass );

// / const { src, dest, watch, series, parallel } = require("gulp");

// // 共通
// const rename = require("gulp-rename");

// // 読み込み先（階層が間違えていると動かないので注意）
// const srcPath = {
//     css: 'src/sass/**/*.scss',
//     img: 'src/images/**/*',
//     html: './**/*.html'
// }

// // 吐き出し先（なければ生成される）
// const destPath = {
//     css: 'css/',
//     img: 'images/'
// }

// // ブラウザーシンク（リアルタイムでブラウザに反映させる処理）
// const browserSync = require("browser-sync");
// const browserSyncOption = {
//     server: "./"
// }
// const browserSyncFunc = () => {
//     browserSync.init(browserSyncOption);
// }
// const browserSyncReload = (done) => {
//     browserSync.reload();
//     done();
// }

// // Sassファイルのコンパイル処理（DartSass対応）
// const sass = require('gulp-sass')(require('sass'));
// const sassGlob = require('gulp-sass-glob-use-forward');
// const plumber = require("gulp-plumber");
// const notify = require("gulp-notify");
// const postcss = require("gulp-postcss");
// const cssnext = require("postcss-cssnext")
// const cleanCSS = require("gulp-clean-css");
// const sourcemaps = require("gulp-sourcemaps");
// const browsers = [
//     'last 2 versions',
//     '> 5%',
//     'ie = 11',
//     'not ie <= 10',
//     'ios >= 8',
//     'and_chr >= 5',
//     'Android >= 5',
// ]

// const cssSass = () => {
//     return src(srcPath.css)
//         .pipe(sourcemaps.init())
//         .pipe(
//             plumber({
//                 errorHandler: notify.onError('Error:<%= error.message %>')
//             }))
//         .pipe(sassGlob())
//         .pipe(sass.sync({
//             includePaths: ['src/sass'],
//             outputStyle: 'expanded'
//         }))
//         .pipe(postcss([cssnext(browsers)]))
//         .pipe(sourcemaps.write('./'))
//         .pipe(dest(destPath.css))
//         .pipe(notify({
//             message: 'コンパイル出来たよ！',//文字は好きなものに変更してね！
//             onLast: true
//         }))
// }

// // 画像圧縮
// const imagemin = require("gulp-imagemin");
// const imageminMozjpeg = require("imagemin-mozjpeg");
// const imageminPngquant = require("imagemin-pngquant");
// const imageminSvgo = require("imagemin-svgo");
// const imgImagemin = () => {
//     return src(srcPath.img)
//     .pipe(imagemin([
//         imageminMozjpeg({quality: 80}),
//         imageminPngquant(),
//         imageminSvgo({plugins: [{removeViewbox: false}]})
//         ],
//         {
//             verbose: true
//         }
//     ))
//     .pipe(dest(destPath.img))
// }

// // ファイルの変更を検知
// const watchFiles = () => {
//     watch(srcPath.css, series(cssSass, browserSyncReload))
//     watch(srcPath.img, series(imgImagemin, browserSyncReload))
//     watch(srcPath.html, series(browserSyncReload))
// }

// // 画像だけ削除
// const del = require('del');
// const delPath = {
//     // css: '../dist/css/',
//     // js: '../dist/js/script.js',
//     // jsMin: '../dist/js/script.min.js',
//     img: './images/',
//     // html: '../dist/*.html',
//     // wpcss: `../${themeName}/assets/css/`,
//     // wpjs: `../${themeName}/assets/js/script.js`,
//     // wpjsMin: `../${themeName}/assets/js/script.min.js`,
//     // wpImg: `../${themeName}/assets/images/`
// }
// const clean = (done) => {
//     del(delPath.img, { force: true, });
//     // del(delPath.css, { force: true, });
//     // del(delPath.js, { force: true, });
//     // del(delPath.jsMin, { force: true, });
//     // del(delPath.html, { force: true, });
//     // del(delPath.wpcss, { force: true, });
//     // del(delPath.wpjs, { force: true, });
//     // del(delPath.wpjsMin, { force: true, });
//     // del(delPath.wpImg, { force: true, });
//     done();
// };

// // npx gulpで出力する内容
// exports.default = series(series(clean, cssSass, imgImagemin), parallel(watchFiles, browserSyncFunc));

// // npx gulp del → 画像最適化（重複を削除）
// // exports.del = series(series(clean, cssSass, imgImagemin), parallel(watchFiles, browserSyncFunc));
