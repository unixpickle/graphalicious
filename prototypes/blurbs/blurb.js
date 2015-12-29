function Blurb() {
  this.text = '';
  this.point = {x: 0, y: 0};
  this.side = Blurb.RIGHT;
  this.opacity = 1;
}

Blurb.RIGHT = 0;
Blurb.LEFT = 1;
Blurb.ARROW_SIZE = 7;

Blurb.prototype.draw = function() {
  drawingContext.font = '18px sans-serif';
  var oldAlpha = drawingContext.globalAlpha;
  drawingContext.globalAlpha = this.opacity;

  drawingContext.save();
  drawingContext.shadowBlur = 5;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
  var contentWidth = drawingContext.measureText(this.text).width + 20;
  var contentHeight = 30;
  drawingContext.beginPath();
  if (this.side === Blurb.RIGHT) {
    drawingContext.moveTo(this.point.x, this.point.y);
    drawingContext.lineTo(this.point.x+Blurb.ARROW_SIZE, this.point.y-Blurb.ARROW_SIZE);
    drawingContext.lineTo(this.point.x+Blurb.ARROW_SIZE, this.point.y-contentHeight/2);
    drawingContext.lineTo(this.point.x+Blurb.ARROW_SIZE+contentWidth, this.point.y-contentHeight/2);
    drawingContext.lineTo(this.point.x+Blurb.ARROW_SIZE+contentWidth, this.point.y+contentHeight/2);
    drawingContext.lineTo(this.point.x+Blurb.ARROW_SIZE, this.point.y+contentHeight/2);
    drawingContext.lineTo(this.point.x+Blurb.ARROW_SIZE, this.point.y+Blurb.ARROW_SIZE);
  } else {
    drawingContext.moveTo(this.point.x, this.point.y);
    drawingContext.lineTo(this.point.x-Blurb.ARROW_SIZE, this.point.y-Blurb.ARROW_SIZE);
    drawingContext.lineTo(this.point.x-Blurb.ARROW_SIZE, this.point.y-contentHeight/2);
    drawingContext.lineTo(this.point.x-Blurb.ARROW_SIZE-contentWidth, this.point.y-contentHeight/2);
    drawingContext.lineTo(this.point.x-Blurb.ARROW_SIZE-contentWidth, this.point.y+contentHeight/2);
    drawingContext.lineTo(this.point.x-Blurb.ARROW_SIZE, this.point.y+contentHeight/2);
    drawingContext.lineTo(this.point.x-Blurb.ARROW_SIZE, this.point.y+Blurb.ARROW_SIZE);
  }
  drawingContext.closePath();
  drawingContext.fillStyle = 'white';
  drawingContext.fill();
  drawingContext.restore();

  drawingContext.fillStyle = '#999';
  drawingContext.textBaseline = 'middle';
  drawingContext.textAlign = 'center';
  if (this.side === Blurb.RIGHT) {
    drawingContext.fillText(this.text, this.point.x+Blurb.ARROW_SIZE+contentWidth/2, this.point.y);
  } else {
    drawingContext.fillText(this.text, this.point.x-Blurb.ARROW_SIZE-contentWidth/2, this.point.y);
  }

  drawingContext.globalAlpha = oldAlpha;
};
