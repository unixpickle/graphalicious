var globalAnimationStart = null;
var XLCV_ANIMATION_DURATION = 700;
var XLCV_HIDE_DURATION = 300;
var XLCV_STAGNATE_DURATION = 200;
var animationInterval = null;
var animationHarmonizer = new window.harmonizer.Harmonizer();
var animationRunTime = 0;

animationHarmonizer.on('animationFrame', function(time) {
  animationRunTime = time;
  if (time >= XLCV_ANIMATION_DURATION) {
    animationHarmonizer.stop();
    enableButtons();
  }
  animationHarmonizer.requestPaint();
});

function disableButtons() {
  document.getElementById('delete-button').disabled = true;
  document.getElementById('insert-button').disabled = true;
}

function enableButtons() {
  document.getElementById('delete-button').disabled = false;
  document.getElementById('insert-button').disabled = false;
}

function insertPoint() {
  disableButtons();
  animationRunTime = 0;
  animationHarmonizer.start();

  globalDataSource.insert(globalDataSource.getLength()-5, {
    primary: Math.random() * 20000,
    secondary: -1,
    proper: true
  });
}

function deletePoint() {
  disableButtons();
  animationRunTime = 0;
  animationHarmonizer.start();
  globalDataSource.delete(globalDataSource.getLength()-5);
}
