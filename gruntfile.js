'use strict';

var DynamoDbLocal = require('dynamodb-local');
var DYNAMO_DB_PORT = 8000;

module.exports = (grunt) => {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*.js']
      }
    }
  });

  // Load libs
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('dynamo:start', function () {
    const getPID = `ps aux | grep "DynamoDBLocal.jar -port ${DYNAMO_DB_PORT}" | grep -v grep | awk '{print $2}'`;
    const done = this.async();
    require('child_process').exec(getPID, (err, pid) => {
      if(err) {
        return done(err);
      }
      if(pid) {
        console.log('Killing DynamoDBLocal process');
        process.kill(pid);
      } else {
        console.log('No DynamoDBLocal process running');
      }

      DynamoDbLocal
        .launch(DYNAMO_DB_PORT)
        .then(done)
        .catch(done);
    });
  });

  // Register the default tasks
  grunt.registerTask('default', ['dynamo:start', 'mochaTest']);

  grunt.registerTask('test', ['dynamo:start', 'mochaTest:test']);
};
