var CANVAS_MARGIN = 50;
var CANVAS_HEIGHT = 300;

var mainCanvas = null;
var mainElement = null;
var scrollView = null;
var drawingContext = null;
var currentGraph = null;
var mousePosition = null;

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

  if (currentGraph !== null) {
    currentGraph.resize();
  }
}

function handleLoad() {
  mainCanvas = document.createElement('canvas');
  mainElement = document.createElement('div');
  mainElement.appendChild(mainCanvas);
  scrollView = new window.scrollerjs.View(window.scrollerjs.View.BAR_POSITION_BOTTOM);
  scrollView.setContent(mainElement);
  scrollView.setDraggable(true);
  scrollView.on('scroll', function() {
    if (currentGraph !== null) {
      currentGraph.scroll();
    }
  });
  document.body.appendChild(scrollView.element());
  handleResize();
}

function mouseMove(e) {
  var x = e.clientX;
  var y = e.clientY;
  var bounds = scrollView.element().getBoundingClientRect();
  if (x < bounds.left || y < bounds.top ||
      x >= bounds.left + scrollView.element().offsetWidth ||
      y >= bounds.top + scrollView.element().offsetHeight) {
    mousePosition = null;
  } else {
    mousePosition = {x: x - bounds.left, y: y - bounds.top};
  }
  if (currentGraph !== null) {
    currentGraph.mouse();
  }
}

window.addEventListener('resize', handleResize);
window.addEventListener('load', handleLoad);
window.addEventListener('mousemove', mouseMove);
window.addEventListener('mouseleave', function(e) {
  mousePosition = null;
  if (currentGraph !== null) {
    currentGraph.mouse();
  }
});

function switchGraph(g) {
  currentGraph = g;
  if (scrollView !== null) {
    g.resize();
  }
}
