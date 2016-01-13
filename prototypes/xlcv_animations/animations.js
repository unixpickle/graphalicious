var globalAnimationStart = null;
var XLCV_ANIMATION_DURATION = 700;
var XLCV_HIDE_DURATION = 300;
var XLCV_STAGNATE_DURATION = 200;
var animationInterval = null;

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
  globalAnimationStart = new Date().getTime();
  setTimeout(finishAnimation, XLCV_ANIMATION_DURATION);
  animationInterval = setInterval(globalXLCV._updateView.bind(globalXLCV, false), 1000/60);

  globalDataSource.insert(globalDataSource.getLength()-5, {
    primary: Math.random() * 20000,
    secondary: -1,
    proper: true
  });
}

function deletePoint() {
  disableButtons();
  globalAnimationStart = new Date().getTime();
  setTimeout(finishAnimation, XLCV_ANIMATION_DURATION);
  animationInterval = setInterval(globalXLCV._updateView.bind(globalXLCV, false), 1000/60);
  globalDataSource.delete(globalDataSource.getLength()-5);
}

function finishAnimation() {
  clearInterval(animationInterval);
  enableButtons();
  globalXLCV._updateView(false);
}
