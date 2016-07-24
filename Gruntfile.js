module.exports = function(grunt) {
	// Config
	var mode = process.env.NODE_COMPILE || 'web';
	grunt.initConfig({
		pkg : grunt.file.readJSON('package.json'),
		copy : {
			main : {
				expand : true,
				cwd : 'App/',
				src : ['**'],
				dest : 'dist/' + mode + '/App'
			},
			package : {
				expand : true,
				src : ['package.json','.gitignore'],
				dest : 'dist/' + mode
			}
		},
		uglify : {
			dynamic_mappings : {
				files : [{
					expand : true,
					cwd : 'App/',
					src : ['**/*.js','!**/public/js/*.min.js'],
					dest : 'dist/' + mode + '/App/',
					ext : '.js',
					extDot : 'first'
				},{
					expand : true,
					cwd : 'Core/',
					src : ['**/*.js'],
					dest : 'dist/' + mode + '/Core/',
					ext : '.js',
					extDot : 'first'
				}]
			}
		},
		minjson : {
			config : {
				files : [{
					expand : true,
					cwd : 'App/',
					src : ['**/config/**/*.json','*.json'],
					dest : 'dist/' + mode + '/App/',
					ext : '.json',
					extDot : 'first'
				},{
					expand : true,
					src : ['package.json'],
					dest : 'dist/' + mode,
					ext : '.json',
					extDot : 'first'
				}]
			}
		},
		cssmin : {
			target : {
				files : [{
					expand : true,
					cwd : 'App/',
					src : ['**/*.css', '!**/*.min.css'],
					dest : 'dist/' + mode + '/App/',
					ext : '.css'
				}]
			}
		},
		watch : {
			files : ['Gruntfile.js','Core/**/*.js', 'App/**/*.js','App/**/*.json'],
			tasks : ['copy','uglify','cssmin','minjson']
		}
	})

	// load module uglify
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-minjson');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

	// default task(s)
	grunt.registerTask('default', ['watch'])
	grunt.registerTask('compile', ['copy','uglify','cssmin','minjson'])
}