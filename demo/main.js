var view;
var LEFT_MARGIN = 130;
var RIGHT_MARGIN = 200;

function loadHandler() {
  var colorScheme = new window.graphalicious.base.ColorScheme('#65bcd4', '#325e6a');
  view = new window.graphalicious.base.View(colorScheme);
  document.getElementById('footer').appendChild(view.element());
  view.element().style.position = 'absolute';
  view.element().style.left = LEFT_MARGIN + 'px';
  view.element().style.backgroundColor = 'white';

  var dataSource = window.TestDataSource.random(150, 3000, false);

  layoutView();
  view.setAnimate(true);

  new Controls(dataSource, view, colorScheme);
  new window.DataList(dataSource);

  window.addEventListener('resize', layoutView);
}

function layoutView() {
  var width = window.innerWidth - (LEFT_MARGIN+RIGHT_MARGIN);
  var height = document.getElementById('footer').offsetHeight;
  view.layout(width, height);
}
