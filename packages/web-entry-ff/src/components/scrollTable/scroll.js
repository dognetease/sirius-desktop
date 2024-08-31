class AutoScroll {
  constructor(obj) {
    this.obj = obj;
    //滚动条的css文件路径
    // this.linkUrl = 'module/scroll/scroll.css';
    //滚动内容
    this.scrollContent = null;
    //滚动条元素
    this.scrollBox = null;
    //滚动元素
    this.scrollTool = null;
    //记录滚动条的高度
    this.num = 0;
    this.scrollWidthNum = 0;
    //滚动速度
    this.speed = 10;
    //初始化
    let h1 = this.obj.clientHeight;
    let h2 = this.obj.scrollHeight;

    let w1 = this.obj.clientWidth;
    let w2 = this.obj.scrollWidth;
    console.log('h1-h2', h1, h2, w1, w2);
    this.init();
  }

  init() {
    //创建滚动结构条件
    let h1 = this.obj.clientHeight;
    let h2 = this.obj.scrollHeight;

    let w1 = this.obj.clientWidth;
    let w2 = this.obj.scrollWidth;

    console.log('xxxxxxobj', this.obj);

    //如果内容不足以溢出可视区域 就不需要滚动条
    if (w1 >= w2) return;

    this.createWidthScroll(w1, w2, h1, h2);
    this.scrollBox = this.obj.querySelector('.customs-scroll-box');
    this.scrollTool = this.obj.querySelector('.customs-scroll-tool');

    this.scrollTool.onmousedown = event => {
      event.preventDefault();
      console.log('clientX', event);
      let x1 = event.clientX;
      let y1 = event.clientY;
      this.drag.call(this, x1, y1);
    };
    this.wheel();
    this.tableHover();
  }

  createScroll(h1, h2) {
    //内容溢出，创建滚动结构
    let scrollContent = document.createElement('div');
    scrollContent.classList.add('scroll-content');
    document.body.appendChild(scrollContent);

    //注意：会丢失元素节点的事件和私有属性
    scrollContent.innerHTML = this.obj.innerHTML;
    this.obj.innerHTML = '';
    this.obj.appendChild(scrollContent);
    this.obj.position = 'relative';

    //创造滚动条scrollBox，滚动元素tool
    let scrollBox = document.createElement('div');
    scrollBox.classList.add('customs-scroll-box');
    scrollBox.style.height = h1 + 'px';
    scrollBox.style.top = this.offsetVal(this.obj).offsetT + 'px';
    scrollBox.innerHTML = `<div class='customs-customs-scroll-tool' style='height: ${(h1 / h2) * h1}px' </div>`;
    this.obj.appendChild(scrollBox);
    scrollBox.style.left = this.offsetVal(this.obj).offsetL + (this.obj.offsetWidth - 7) + 'px';
  }

  createWidthScroll(w1, w2, h1, h2) {
    // 隐藏原滚动条
    this.obj.classList.add('cutoms-hide-scroll');
    //创造滚动条scrollBox，滚动元素tool
    let scrollBox = document.createElement('div');
    scrollBox.classList.add('customs-scroll-box');
    scrollBox.style.width = w1 + 'px';

    scrollBox.innerHTML = `<div class='customs-scroll-tool' style='width: ${(w1 / w2) * w1}px;' </div>`;

    const isScrollBox = this.obj.querySelector('.customs-scroll-box');
    if (isScrollBox) {
      isScrollBox.remove();
    }
    this.obj.appendChild(scrollBox);
    scrollBox.style.left = this.offsetVal(this.obj).offsetL + 'px';
  }

  scrollTable = offsetLeft => {
    let currentDom = this.obj;
    if (currentDom) {
      console.log('xxx-offsetLeft-1', offsetLeft);
      currentDom?.scrollTo(offsetLeft, top);
    }
  };

  drag(x1, y1) {
    console.log('onmousemove-event-drag');
    document.onmousemove = event => {
      let x2 = event.clientX;
      let y2 = event.clientY;
      let y = Math.abs(y2 - y1);
      let x = x2 - x1;
      let topValue = this.scrollWidthNum + x;

      //边界处理
      if (topValue <= 0) {
        topValue = 0;
      }

      // offsetHeight  整体高度包含滚动条

      if (topValue >= this.obj.offsetWidth - this.scrollTool.offsetWidth) {
        topValue = this.obj.offsetWidth - this.scrollTool.offsetWidth;
      }

      this.scrollTool.style.left = topValue + 'px';
      let moveDistance = (topValue / this.obj.offsetWidth) * this.obj.scrollWidth;
      this.scrollTable(moveDistance);

      if (y > 100) {
        this.scrollWidthNum = this.offsetVal(this.scrollTool).offsetL; //记录变化后的位置
        document.onmousemove = null;
      }
    };

    document.onmouseup = event => {
      document.onmousemove = null;
      this.scrollWidthNum = this.offsetVal(this.scrollTool).offsetL - this.offsetVal(this.scrollBox).offsetL;
      //记录变化后的位置
      console.log('scrollWidthNum-end', this.scrollWidthNum);
    };
  }

  tableHover() {
    this.obj.onmouseover = event => {
      this.scrollBox.style.display = 'block';
    };
    this.obj.onmouseout = event => {
      // this.scrollBox.style.display = 'none';
    };
  }

  wheel() {
    //chrome--event.wheelDelta, >0为鼠标滚轮向上滚动，<0为向下滚动
    this.obj.onmousewheel = event => {
      let oEvent = event || window.event;
      this.tableMove();
      //   oEvent.wheelDelta > 0 ? this.up() : this.down();
    };

    //firefox--event.detail,>0为鼠标向下滚动，<0为向上滚动
    this.obj.addEventListener('DOMMouseScroll', event => {
      let oEvent = event || window.event;
      //   oEvent.detail> 0 ? this.down() : this.up();
    });
  }

  tableMove() {
    let currentDom = this.obj;
    let left = currentDom?.scrollLeft;
    if (left) {
      let topValue = (left / this.obj.scrollWidth) * this.obj.offsetWidth;
      this.scrollTool.style.left = topValue + 'px';
    }
  }

  up() {
    this.num -= this.speed;
    if (this.num <= 0) {
      this.num = 0;
    }
    this.scrollTool.style.top = this.num + 'px';
    this.scrollContent.style.marginTop = -((this.num / this.scrollBox.clientHeight) * this.scrollContent.offsetHeight) + 'px';
  }

  down() {
    this.num += this.speed;
    if (this.num >= this.scrollBox.clientHeight - this.scrollTool.offsetHeight) {
      this.num = this.scrollBox.clientHeight - this.scrollTool.offsetHeight;
    }
    this.scrollTool.style.top = this.num + 'px';
    this.scrollContent.style.marginTop = -((this.num / this.scrollBox.clientHeight) * this.scrollContent.offsetHeight) + 'px';
  }

  offsetVal(obj) {
    let rectObject = obj.getBoundingClientRect();
    return {
      offsetL: rectObject.left,
      offsetT: rectObject.top,
    };
  }
}

export { AutoScroll };
