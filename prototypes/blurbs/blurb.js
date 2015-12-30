function Blurb() {
  this.text = '';
  this.point = {x: 0, y: 0};
  this.side = Blurb.RIGHT;
  this.opacity = 1;
}

Blurb.RIGHT = 0;
Blurb.LEFT = 1;
Blurb.ARROW_SIZE = 7;

Blurb.intermediate = function(one, two, frac) {
  var res = new Blurb();
  res.text = two.text;
  res.point = {
    x: frac*two.point.x + (1-frac)*one.point.x,
    y: frac*two.point.y + (1-frac)*one.point.y
  };
  res.side = two.side;
  res.opacity = frac*two.opacity + (1-frac)*one.opacity;
  return res;
};

Blurb.prototype.draw = function() {
  var targetCanvas = document.createElement('canvas');
  targetCanvas.width = mainCanvas.width;
  targetCanvas.height = mainCanvas.height;

  var ctx = targetCanvas.getContext('2d');
  ctx.scale(2, 2);

  ctx.font = '18px sans-serif';
  ctx.save();
  ctx.shadowBlur = 5;
  ctx.shadowColor = 'rgba(0, 0, 0, ' + (this.opacity*0.5).toFixed(2) + ')';
  var contentWidth = ctx.measureText(this.text).width + 20;
  var contentHeight = 30;
  ctx.beginPath();
  if (this.side === Blurb.RIGHT) {
    ctx.moveTo(this.point.x, this.point.y);
    ctx.lineTo(this.point.x+Blurb.ARROW_SIZE, this.point.y-Blurb.ARROW_SIZE);
    ctx.lineTo(this.point.x+Blurb.ARROW_SIZE, this.point.y-contentHeight/2);
    ctx.lineTo(this.point.x+Blurb.ARROW_SIZE+contentWidth, this.point.y-contentHeight/2);
    ctx.lineTo(this.point.x+Blurb.ARROW_SIZE+contentWidth, this.point.y+contentHeight/2);
    ctx.lineTo(this.point.x+Blurb.ARROW_SIZE, this.point.y+contentHeight/2);
    ctx.lineTo(this.point.x+Blurb.ARROW_SIZE, this.point.y+Blurb.ARROW_SIZE);
  } else {
    ctx.moveTo(this.point.x, this.point.y);
    ctx.lineTo(this.point.x-Blurb.ARROW_SIZE, this.point.y-Blurb.ARROW_SIZE);
    ctx.lineTo(this.point.x-Blurb.ARROW_SIZE, this.point.y-contentHeight/2);
    ctx.lineTo(this.point.x-Blurb.ARROW_SIZE-contentWidth, this.point.y-contentHeight/2);
    ctx.lineTo(this.point.x-Blurb.ARROW_SIZE-contentWidth, this.point.y+contentHeight/2);
    ctx.lineTo(this.point.x-Blurb.ARROW_SIZE, this.point.y+contentHeight/2);
    ctx.lineTo(this.point.x-Blurb.ARROW_SIZE, this.point.y+Blurb.ARROW_SIZE);
  }
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#999';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  if (this.side === Blurb.RIGHT) {
    ctx.fillText(this.text, this.point.x+Blurb.ARROW_SIZE+contentWidth/2, this.point.y);
  } else {
    ctx.fillText(this.text, this.point.x-Blurb.ARROW_SIZE-contentWidth/2, this.point.y);
  }

  drawingContext.globalAlpha = this.opacity;
  drawingContext.drawImage(targetCanvas, 0, 0, targetCanvas.width/2, targetCanvas.height/2);
  drawingContext.globalAlpha = 1;
};
