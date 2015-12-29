var CANVAS_MARGIN = 50;
var CANVAS_HEIGHT = 300;

var mainCanvas = null;
var mainElement = null;
var scrollView = null;
var drawingContext = null;
var currentGraph = null;

function handleResize() {
  var width = Math.floor(window.innerWidth - CANVAS_MARGIN*2);

  var sizeElements = [mainCanvas, mainElement, scrollView.element()];
  for (var i = 0, len = sizeElements.length; i < len; ++i) {
    var e = sizeElements[i];
    e.style.width = width + 'px';
    e.style.height = CANVAS_HEIGHT + 'px';
  }

  scrollView.element().style.position = 'absolute';
  scrollView.element().style.left = CANVAS_MARGIN + 'px';
  scrollView.element().style.top = Math.round((window.innerHeight-CANVAS_HEIGHT)/2) + 'px';

  mainCanvas.width = width * 2;
  mainCanvas.height = CANVAS_HEIGHT * 2;
  drawingContext = mainCanvas.getContext('2d');
  drawingContext.scale(2, 2);

  if (currentGraph) {
    currentGraph.layout(width, CANVAS_HEIGHT);
    currentGraph.draw();
  }
}

function handleLoad() {
  mainCanvas = document.createElement('canvas');
  mainElement = document.createElement('div');
  mainElement.appendChild(mainCanvas);
  scrollView = new window.scrollerjs.View(window.scrollerjs.View.BAR_POSITION_BOTTOM);
  scrollView.setContent(mainElement);
  scrollView.on('scroll', function() {
    if (currentGraph) {
      currentGraph.draw();
    }
  });
  document.body.appendChild(scrollView.element());
  handleResize();
}

window.addEventListener('resize', handleResize);
window.addEventListener('load', handleLoad);
