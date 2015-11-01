var view;
function loadHandler() {
  var colorScheme = new window.graphalicious.base.ColorScheme('#65bcd4', '#55acc4')
  view = new window.graphalicious.base.View(colorScheme);
  document.getElementById('footer').appendChild(view.element());
  view.element().style.position = 'absolute';
  view.element().style.left = '100px';

  var config = {
    splashScreen: new window.SplashScreen(colorScheme),
    dataSource: window.DemoDataSource.random(1000, 3000, false),
    provider: new window.graphalicious.providers.BarViewProvider(colorScheme),
    loader1: new window.SplashScreen(colorScheme),
    loader2: new window.SplashScreen(colorScheme),
    topMargin: 20,
    bottomMargin: 20,
    labelGenerator: new window.graphalicious.ylcv.DurationLabelGenerator({})
  };
  var content = new window.graphalicious.ylcv.ContentView(config);
  content.element().style.backgroundColor = 'white';
  view.setContent(content);
  layoutView();
  view.setAnimate(true);

  window.addEventListener('resize', layoutView);

  new window.Controls();
}

function layoutView() {
  var width = window.innerWidth - 300;
  var height = document.getElementById('footer').offsetHeight;
  view.layout(width, height);
}
