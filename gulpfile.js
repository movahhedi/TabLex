// var Secrets = require('./secret.json');

// Fetch required plugins
const
	gulp = require("gulp"),
	{ src, dest, watch, series, parallel } = require("gulp"),

	sourcemaps = require("gulp-sourcemaps"),
	concat = require("gulp-concat"),
	// replace = require("gulp-replace"),
	// rename = require("gulp-rename"),

	htmlmin = require('gulp-html-minifier-terser');
	// imagemin = require('gulp-imagemin'),

	jshint = require('gulp-jshint'),
	terser = require("gulp-terser"),
	// uglify = require("gulp-uglify"),

	sass = require("gulp-sass")(require("sass")),
	postcss = require("gulp-postcss"),
	autoprefixer = require('autoprefixer'),
	cssnano = require('cssnano'),
	gulpStylelint = require('@ronilaukkarinen/gulp-stylelint'),

	del = require('del');
	prompt = require('prompt'), // require('gulp-prompt'),
	execSync = require('child_process').execSync,
	through = require('through2'),
	chalk = require('chalk')
;

// All paths
const buildPath = "./build/**";
const paths = {
	all: {
		src: ["./src/**/*"],
		dest: "./build/",
	},
	html: {
		src: ["./src/**/*.html"],
		dest: "./build/",
	},
	// images: {
	// 	src: ["./src/content/images/**/*"],
	// 	dest: "./build/content/images/",
	// },
	styles: {
		src: ["./src/assets/scss/**/*.scss"],
		dest: "./build/assets/css/",
		dest_src: ["./src/assets/scss/"],
	},
	scripts: {
		src: ["./src/assets/js/**/*.js"],
		dest: "./build/assets/js/",
	},
	cachebust: {
		src: ["./build/**/*.html"],
		dest: "./build/",
	},
}

var OperationCount = 0;

const ClockNow = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: "numeric", minute: "numeric", second: "numeric"});

// Copy all files
function copyAll() {
	return src(paths.all.src)
		.pipe(cacheBust())
		.pipe(dest(paths.all.dest));
}

// Copy html files
function copyHtml_Production() {
	return src(paths.html.src)
		.pipe(cacheBust())
		.pipe(htmlmin({
			caseSensitive: true,
			collapseWhitespace: true,
			keepClosingSlash: true,
			minifyCSS: true,
			minifyJS: true,
			removeAttributeQuotes: false,
			removeComments: true,
			ignoreCustomFragments: [ /(<[%\?])([\s\S]*?)(([%|\?]>)|$(?![\r\n]))/ ]
			// ignoreCustomFragments: [ /(<(%|(\?(=|php|xml))))([\s\S]*?)(([%|\?]>)|$(?![\r\n]))/ ]
		}))
		.pipe(dest(paths.html.dest));
}

// Optimize images(.png, .jpeg, .gif, .svg)
/*function optimizeImages() {
	return src(paths.images.src)
		.pipe(imagemin([
			imagemin.gifsicle({ interlaced: true }),
			imagemin.mozjpeg({ quality: 75, progressive: true }),
			imagemin.optipng({ optimizationLevel: 5 }),
			imagemin.svgo({
				plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
			})
		]).on("error", (error) => console.log(error)))
		.pipe(dest(paths.images.dest));
}*/

// Compile styles
function compileStyles() {
	return (
		src(paths.styles.src)
			.pipe(cacheBust())
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
			.pipe(sourcemaps.write(".", { includeContent: false }))
			.pipe(dest(paths.styles.dest))
	);
}

function compileStyles_Production() {
	return (
		src(paths.styles.src)
			.pipe(cacheBust())
			.pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
			.pipe(postcss([autoprefixer(), cssnano()]))
			.pipe(dest(paths.styles.dest))
	);
}

// Lint styles
function lintStyles() {
	const NowTs = new Date().getTime();
	return (
		src(paths.styles.src)
			.pipe(gulpStylelint({
				fix: true,
				reporters: [
					{ formatter: 'verbose', console: true },
					{ formatter: 'verbose', save: 'temp/stylelint-log/stylelint-log-last.txt' },
					{ formatter: 'verbose', save: 'temp/stylelint-log/stylelint-log-' + NowTs + '.txt' },
				]
			}))
			.pipe(dest(paths.styles.dest_src))
	);
}

function lintStyles_NoFix() {
	const NowTs = new Date().getTime();
	return (
		src(paths.styles.src)
			.pipe(gulpStylelint({
				fix: false,
				reporters: [
					{ formatter: 'verbose', console: true },
					{ formatter: 'verbose', save: 'temp/stylelint-log/stylelint-log-last.txt' },
					{ formatter: 'verbose', save: 'temp/stylelint-log/stylelint-log-' + NowTs + '.txt' },
				]
			}))
			.pipe(dest(paths.styles.dest_src))
	);
}

// Minify scripts
function minifyScripts() {
	return src(paths.scripts.src)
		.pipe(cacheBust())
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(concat('script.js'))
		.pipe(sourcemaps.write(".", { includeContent: false }))
		.pipe(dest(paths.scripts.dest));
}

function minifyScripts_Production() {
	return src(paths.scripts.src)
		.pipe(cacheBust())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(terser().on("error", (error) => console.log(error)))
		// .pipe(uglify())
		.pipe(concat('script.js'))
		.pipe(sourcemaps.write(".", { includeContent: false }))
		.pipe(dest(paths.scripts.dest));
}

// Cache bust
function cacheBust() {
	const NowTs = new Date().getTime();
	return through.obj((chunk, enc, cb) => {
		var filetypes = ["php", "html", "js", "css", "scss", "ts"];
		var extension = chunk.path.substring(chunk.path.lastIndexOf(".") + 1, chunk.path.length) || chunk.path;
		if (filetypes.includes(extension) && chunk.contents)
			chunk.contents = new Buffer.from(chunk.contents.toString().replace(/cache_bust=\d+/g, "cache_bust=" + NowTs));
		cb(null, chunk);
	});
	// return src(paths.cachebust.src)
	// 	.pipe(replace(/cache_bust=\d+/g, "cache_bust=" + NowTs))
	// 	.pipe(dest(paths.cachebust.dest));
}

/*function replaceSecrets(cb) {
	var task = src(paths.all.src);
	const NowTs = new Date().getTime();
	task.pipe(replace(/cache_bust=\d+/g, "cache_bust=" + NowTs));
	Object.entries(Secrets).map(function ([k, v]) {
		task.pipe(replace(new RegExp("GULPREPLACE_" + k, 'g'), v))
	});
	task.pipe(dest(paths.all.dest));
	cb();
}
exports.rs = replaceSecrets;*/

function clearBuild(cb) {
	del([buildPath], { force: true });
	cb();
}

function countOperations(cb = null, additional = "") {
	console.log("[" + chalk.gray(ClockNow()) + "] ======== " + chalk.yellow("Operation: " + OperationCount) + " " + additional);
	OperationCount++;
	if (cb) cb();
}

// Watch for file modification at specific paths and run respective tasks accordingly
function watcher() {
	console.log("[" + chalk.gray(ClockNow()) + "] ======== " + chalk.green("Ready for development. Happy Coding :)"));
	var watcher_all = watch(paths.all.src);
	watcher_all.on('change', function (fileName) {
		countOperations(undefined, chalk.green("CopyAll ") + chalk.white(fileName));
		return src(fileName, {base: './src/'})
			.pipe(cacheBust())
			.pipe(dest(paths.all.dest));
	});

	/*var watcher_styles = watch(paths.styles.src);
	watcher_styles.on('change', function (fileName) {
		countOperations();
		return src(fileName, {base: './src/'})
			.pipe(cacheBust())
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
			.pipe(sourcemaps.write(".", { includeContent: false }))
			.pipe(dest(paths.styles.dest));
	});

	var watcher_scripts = watch(paths.scripts.src);
	watcher_scripts.on('change', function (fileName) {
		countOperations();
		return src(fileName, {base: './src/'})
			.pipe(cacheBust())
			.pipe(jshint())
			.pipe(jshint.reporter('jshint-stylish'))
			.pipe(sourcemaps.init({ loadMaps: true }))
			.pipe(concat('script.js'))
			.pipe(sourcemaps.write(".", { includeContent: false }))
			.pipe(dest(paths.scripts.dest));
	});*/

	// watch(paths.all.src, series(copyAll, countOperations));
	// watch(paths.html.src, series(copyHtml, countOperations));
	watch(paths.styles.src, series(compileStyles, countOperations));
	watch(paths.scripts.src, series(minifyScripts, countOperations));
	// watch(paths.images.src, series(optimizeImages, countOperations));
}

// Export tasks to make them public
exports.copyAll = copyAll;
// exports.copyPhp = copyPhp;
exports.compileStyles = compileStyles;
exports.minifyScripts = minifyScripts;

exports.css = lintStyles;
exports.css_no_fix = lintStyles_NoFix;
exports.clear = clearBuild;

exports.prod = series(
	clearBuild,
	copyAll,
	parallel(copyHtml_Production, compileStyles_Production, minifyScripts_Production)
);
exports.build = series(
	copyAll,
	parallel(compileStyles, minifyScripts)
);
exports.default = series(
	// lintStyles,
	copyAll,
	parallel(compileStyles, minifyScripts),
	watcher
);