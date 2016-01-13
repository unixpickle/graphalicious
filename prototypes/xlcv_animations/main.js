var globalXLCV;
var globalDataSource;
var globalView;

function handleLoad() {
  globalDataSource = window.TestDataSource.random(1500, 20000, false);
  globalDataSource.loadTimeout = function() {
    return 1000;
  };

  var colorScheme = new window.graphalicious.base.ColorScheme('#65bcd4', '#325e6a');

  var barStyle = new window.graphalicious.styles.BarStyle({
    colorScheme: colorScheme,
    leftMargin: 10,
    rightMargin: 10,
    barSpacing: 5,
    barWidth: 30
  });

  var interpretation = new window.graphalicious.ylcv.DurationInterpretation({});

  globalXLCV = new XLCV({
    bottomMargin: 40,
    splashScreen: new window.SplashScreen(colorScheme),
    dataSource: globalDataSource,
    visualStyle: barStyle,
    loader1: new window.SplashScreen(colorScheme),
    loader2: new window.SplashScreen(colorScheme),
    topLabelSpace: 10,
    formatValue: interpretation.format.bind(interpretation),
    roundValue: interpretation.round.bind(interpretation),
    constrictFullViewportBottom: true
  });

  globalView = new window.graphalicious.base.View();
  globalView.element().style.position = 'absolute';
  globalView.element().style.left = '50px';
  globalView.element().style.top = 'calc(50% - 150px)';
  globalView.element().style.backgroundColor = 'white';
  document.body.appendChild(globalView.element());

  handleResize();
  globalView.setContentView(globalXLCV);
  globalView.setAnimate(true);
}

function handleResize() {
  var width = window.innerWidth - 100;
  var height = 300;
  globalView.layout(width, height);
}

window.addEventListener('load', handleLoad);
window.addEventListener('resize', handleResize);
