var view;
var LEFT_MARGIN = 130;
var RIGHT_MARGIN = 200;
function loadHandler() {
  var colorScheme = new window.graphalicious.base.ColorScheme('#65bcd4', '#55acc4')
  view = new window.graphalicious.base.View(colorScheme);
  document.getElementById('footer').appendChild(view.element());
  view.element().style.position = 'absolute';
  view.element().style.left = LEFT_MARGIN + 'px';
  view.element().style.backgroundColor = 'white';

  var dataSource = window.DemoDataSource.random(1000, 3000, true);
  new Controls(dataSource);

  var config = {
    splashScreen: new window.SplashScreen(colorScheme),
    dataSource: dataSource,
    provider: new window.graphalicious.providers.BarViewProvider(colorScheme),
    loader1: new window.SplashScreen(colorScheme),
    loader2: new window.SplashScreen(colorScheme),
    topMargin: 20,
    bottomMargin: 5,
    labelGenerator: new window.graphalicious.ylcv.DurationLabelGenerator({})
  };
  var content = new window.graphalicious.ylcv.ContentView(config);
  content.element().style.backgroundColor = 'white';
  view.setContent(content);
  layoutView();
  view.setAnimate(true);

  new window.DataList(dataSource);

  window.addEventListener('resize', layoutView);
}

function layoutView() {
  var width = window.innerWidth - (LEFT_MARGIN+RIGHT_MARGIN);
  var height = document.getElementById('footer').offsetHeight;
  view.layout(width, height);
}
