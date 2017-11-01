/* jshint strict: true */
'use strict';

// Include Gulp & Tools We'll Use
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const del = require('del');
const runSequence = require('run-sequence');
const browserSync = require('browser-sync');
const through2 = require('through2');
const browserify = require('browserify');
const path = require('path');
const ftp = require('vinyl-ftp');
const reload = browserSync.reload;
const yargs = require('yargs').argv;
const minify = yargs.minify ? true : false;
const tunnel = yargs.tunnel ? yargs.tunnel : false;
const config = require('./config.json');

yargs.ftpDeploy = yargs.ftpDeploy || {};
config.ftpDeploy.host = yargs.ftpDeploy.host || '';
config.ftpDeploy.password = yargs.ftpDeploy.password || '';
config.ftpDeploy.username = yargs.ftpDeploy.username || '';

// font url relative to css location
config.path.buildUrl.fontCssRelative = path.relative(
	config.path.buildUrl.css,
	config.path.buildUrl.font
).replace(/\\/g, '/');


// image url relative to css location
config.path.buildUrl.imageCssRelative = path.relative(
	config.path.buildUrl.css,
	config.path.buildUrl.image
).replace(/\\/g, '/');

// build all
gulp.task('compile', (callback) => {
	runSequence(
		'compile:asset',
		'compile:prototype',
		'compile:pattern_library',
		callback
	);
});

// build assets
gulp.task('compile:asset', (callback) => {
	runSequence(
		'compile:font',
		'compile:image',
		'compile:js',
		'compile:css',
		callback
	);
});

gulp.task('compile:font', () => {
	return gulp.src(config.path.src.asset.font + '/**/*')
		.pipe($.plumber())
		.pipe(gulp.dest(config.path.build.asset.font))
		.pipe($.size({title: 'fonts'}));
});


gulp.task('compile:image', () => {
	return gulp.src(config.path.src.asset.image + '/**/*')
		.pipe($.plumber())
		// optimizes image file if possible
		.pipe($.cache($.imagemin({
			progressive: true,
			interlaced: true
		})))
		.pipe(gulp.dest(config.path.build.asset.image))
		.pipe($.size({title: 'image'}));
});


gulp.task('compile:js', () => {
	return gulp.src([config.path.src.asset.javascript + '/*.js'])
		.pipe($.plumber())
		// use browserify to manage dependencies
		.pipe(through2.obj((file, enc, next) => {
			browserify(file.path)
				.transform('babelify', {presets: [config.preferences.es2015]})
				.bundle((err, res) => {
					if (err) {
						throw err;
					}
					file.contents = res;
					next(null, file);
				});
		}))

		// uglifies code if minification is enabled
		.pipe($.if(minify, $.uglify()))

		.pipe(gulp.dest(config.path.build.asset.javascript))
		.pipe($.size({title: 'javascript'}));
});


gulp.task('compile:css', () => {
	return gulp.src(config.path.src.asset.scss + '/*.scss')

        	.pipe($.sass({
        		precision: 8
        	}).on('error', $.sass.logError))

		.pipe($.ignore('**/*.css.map'))

		// autoprefixes css properties
		.pipe($.autoprefixer(config.preferences.autoprefix.support.split(', ')))

		// minifies css if minify property is enabled
		.pipe($.if(minify, $.cssnano()))

		.pipe(gulp.dest(config.path.build.asset.css))
		.pipe($.size({title: 'styles:scss'}));
});


// Prototoype site
gulp.task('compile:prototype', [
	'compile:html',
	'compile:sample_content'
]);

gulp.task('compile:html', () => {
	return gulp.src([
			config.path.src.prototype.template + '/**/*.html',
			'!' + config.path.src.prototype.template + '/component/**/*',
			'!' + config.path.src.prototype.template + '/layout/**/*'
		])
		.pipe($.plumber())
		.pipe($.data(() => ({config: config})))
		.pipe($.nunjucks.compile())
		.pipe(gulp.dest(config.path.build.prototype.template))
		.pipe($.size({title: 'site:html'}));
});

gulp.task('compile:sample_content', () => {
	return gulp.src(config.path.src.prototype.webroot + '/**/*')
		.pipe($.plumber())
		.pipe($.cache($.imagemin({
			progressive: true,
			interlaced: true
		})))
		.pipe(gulp.dest(config.path.build.prototype.webroot))
		.pipe($.size({title: 'sample_content'}));
});


// Build pattern library via kss
// Generate pattern library with templates
gulp.task('compile:pattern_library', (callback) => {

	// original execution code
	let exec = require('child_process').exec;
	exec(
		'node ./node_modules/kss/bin/kss ' +
		[
			'--verbose',
			'--config ./config-kss.json'
		].join(' '),
		(error, stdout, stderr) => {
			if (error) {
				console.log(stdout, stderr);
				throw error;
			}
			callback();
		}
	);
});

gulp.task('package', () => {
	// @TODO: only optimize in this run, no more minify/uglify/imagemin in any other
});

// Analyze tasks, provide information about code quality
gulp.task('verify', [
	'verify:js',
	'verify:css'
]);

gulp.task('verify:js', () => {
	gulp.src([
			'./*.js',
			config.path.src.root + '/**/*.js',
			'!' + config.path.src.patternLibrary.template + '/**/*',
			'!' + config.path.src.asset.javascript + '/polyfill/*.js'
		])
		.pipe($.plumber())
		.pipe($.jshint())
		.pipe($.jshint.reporter('jshint-stylish'));
});

gulp.task('verify:css', () => {
<% if (useSasslint) { -%>
	gulp.src(config.path.src.asset.scss + '/**/*.scss')
		.pipe($.plumber())
		.pipe($.sassLint())
		.pipe($.sassLint.format())
		.pipe($.sassLint.failOnError());
<% } -%>
});

// Clean Output Directories
gulp.task('clean', (cb) => {
	return del(config.path.build.root);
});


// Watch Files For Changes & Reload
gulp.task('serve', ['compile'], () => {
	browserSync({
		server: {
			baseDir: [
				config.path.build.root,
				config.path.build.root + '/asset'
			]
		},
		notify: false,
		tunnel: tunnel,
		startPath: '/prototype'
	});

	// trigger build action per asset type on change
	gulp.watch([config.path.src.asset.scss + '/**/*.scss'], ['verify:css', 'compile:css']);
	gulp.watch([config.path.src.asset.image + '/**/*'], ['compile:image']);
	gulp.watch([config.path.src.asset.font + '/**/*'], ['compile:font']);
	gulp.watch([config.path.src.asset.javascript + '/**/*.js'], ['verify:js', 'compile:js']);

	//
	gulp.watch([config.path.src.prototype.template + '/**/*'], ['compile:prototype']);

	// builds pattern library on change
	gulp.watch([
		config.path.src.patternLibrary.root + '/**/*',
		config.path.src.prototype.template + '/**/*',
		config.path.src.asset.scss + '/**/*.scss'
	], ['compile:pattern_library']);

	// when build folder changes content, reload browser
	// has a timeout of 60 ms preventing a reload overflow
	gulp.watch([config.path.build.root + '/**/*'], (() => {
		let cb;
		return () => {
			clearTimeout(cb);
			cb = setTimeout(() => {
				reload();
			}, 60);
		};
	})());
});


// Default is alias for build
gulp.task('default', ['help']);


gulp.task('help', () => {
	gulp.src('./tasks.json')
		.pipe($.list());
});


gulp.task('deploy', ['clean', 'compile'], () => {
	const conn = ftp.create( {
		host:     config.ftpDeploy.host,
		user:     config.ftpDeploy.username,
		password: config.ftpDeploy.password,
		parallel: 10
	} );

	const globs = [
		config.path.build.root + '/**'
	];

	return gulp.src( globs, { base: '.', buffer: false } )
		.pipe( conn.dest( '/public_html' ) );

});
