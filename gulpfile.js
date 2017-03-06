const gulp = require('gulp');
const spawn = require('child_process').spawn;

var application;

gulp.task('default', ['start_application', 'watch']);


gulp.task('watch', function(){
  gulp.watch(['./application/*.js'], ['start_application']);
});


gulp.task('start_application', function (){
  if (application) {
    application.kill();
  }
  application = spawn('node', ['./application/index.js'], {stdio: 'inherit'});
});
