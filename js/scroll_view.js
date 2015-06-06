// This implements a custom horizontal scrolling mechanism.
(function() {
  
  function ScrollView(content) {
    // Setup basic state.
    this._content = content;
    this.element = document.createElement('div');
    this.element.appendChild(content);
    this._width = 0;
    this._height = 0;
    
    // Setup colors.
    this._barColor = '#65bcd4';
    this._backgroundColor = '#f0f0f0';
    this._trackColor = '#c4c4c4';
    
    // Setup bottom bar.
    this._barHeight = 0;
    this._barCanvas = document.createElement('canvas');
    
    // Setup CSS of content.
    content.style.top = '0';
    content.style.left = '0';
  }
  
  ScrollView.prototype.getBackgroundColor = function() {
    return this._backgroundColor;
  };
  
  ScrollView.prototype.getBarColor = function() {
    return this._barColor;
  };
  
  ScrollView.prototype.getContent = function() {
    return this._content;
  };
  
  ScrollView.prototype.getSize = function() {
    return {width: this._width, height: this._height};
  };
  
  ScrollView.prototype.getTrackColor = function() {
    return this._trackColor;
  };
  
  ScrollView.prototype.scrollToOffset = function(offset, animate) {
    
  };
  
  ScrollView.prototype.setBackgroundColor = function(color) {
    this._backgroundColor = color;
  };
  
  ScrollView.prototype.setBarColor = function(color) {
    this._barColor = color;
  };
  
  ScrollView.prototype.setSize = function(width, height) {
    this._width = width;
    this._height = height;
    var viewHeight = Math.max(0, height - this._barHeight);
    this._content.setSize(width, viewHeight);
  };
  
  ScrollView.prototype.setTrackColor = function(color) {
    this._trackColor = color;
  }
  
  ScrollView.prototype._drawBar = function() {
    var ctx = this._barCanvas.getContext('2d');
  }
  
})();