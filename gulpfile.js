// @ts-check
import gulp from "gulp";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import browserSync from "browser-sync";
import clean from "gulp-clean";
import sourcemaps from "gulp-sourcemaps";
import imagemin, { gifsicle, mozjpeg, optipng, svgo } from "gulp-imagemin";
import pug from "gulp-pug";
import rename from "gulp-rename";
import path from "node:path";

const { src, dest, watch, parallel, series } = gulp;
const sass = gulpSass(dartSass);

// конвертация из pug в html
function convertPugToHtml() {
  return src("src/pages/**/*.pug")
    .pipe(pug({ basedir: "src", pretty: true }))
    .pipe(rename((file) => {
      let parentDir = path.dirname(file.dirname)
      file.dirname= path.join(parentDir, 'assets', file.dirname)
    }))
    .pipe(dest("src/"))
    .pipe(browserSync.stream());
}

// конверация  и минификация стилей
function convertStyles() {
  return src("src/pages/**/styles.scss")
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: "expanded" }).on("error", sass.logError))
    .pipe(rename((file) => {
      let parentDir = path.dirname(file.dirname)
      file.dirname= path.join(parentDir, 'assets', file.dirname)
    }))
    .pipe(dest("src/"))
    .pipe(sourcemaps.write("."))
    .pipe(browserSync.stream());
}

// оптимизация изображений
function convertImages() {
  return src("src/shared/img/**/*")
    .pipe(
      imagemin([
        gifsicle({ interlaced: true }),
        mozjpeg({ quality: 75, progressive: true }),
        optipng({ optimizationLevel: 5 }),
        svgo({
          plugins: [
            {
              name: "removeViewBox",
              active: true,
            },
            {
              name: "cleanupIDs",
              active: false,
            },
          ],
        }),
      ]),
    )
    .pipe(dest("src/assets/img"))
    .pipe(browserSync.stream());
}

// инициализация browser-sync
function browserSyncInit() {
  browserSync.init({
    port: 5173,
    server: {
      baseDir: "src",
      directory: true,
    },
  });
}

// обновление страницы при изменении файлов
function watchFiles() {
  watch("src/**/*.pug", convertPugToHtml);
  watch("src/**/*.scss", convertStyles);
  watch("src/shared/img/**/*", convertImages);
  watch("src/*.html").on("change", browserSync.reload);
}

// удаление dist
function cleanDist() {
  return src("dist", { read: false, allowEmpty: true }).pipe(clean());
}

// создание dist
function buildDist() {
  return src(
    [
      "src/assets/**/*.html",
      "src/assets/**/styles.css",
      "src/assets/img/**/*",
    ],
    {
      base: "src/assets",
    },
  ).pipe(dest("dist"));
}

export const build = series( cleanDist, buildDist);
export default parallel(
  convertPugToHtml,
  convertStyles,
  convertImages,
  browserSyncInit,
  watchFiles,
);
