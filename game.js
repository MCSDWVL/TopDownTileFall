(() => {
  const COLS = 10, ROWS = 20, SIZE = 50;
  // Set false to restore the original side-panel reality check.
  const REALITY_CHECK_IN_MAIN_VIEW = true;
  const colors = { I:'#35c7ee', O:'#ffd146', T:'#b76ae7', S:'#57cf74', Z:'#f05b67', J:'#4f85ee', L:'#ff9647' };
  const shapes = { I:[[1,1,1,1]], O:[[1,1],[1,1]], T:[[0,1,0],[1,1,1]], S:[[0,1,1],[1,1,0]], Z:[[1,1,0],[0,1,1]], J:[[1,0,0],[1,1,1]], L:[[0,0,1],[1,1,1]] };
  const boardCanvas = document.querySelector('#board'), ctx = boardCanvas.getContext('2d');
  const nextCanvas = document.querySelector('#next'), nextCtx = nextCanvas.getContext('2d');
  const currentCanvas = document.querySelector('#current'), currentCtx = currentCanvas.getContext('2d');
  const frontCanvas = document.createElement('canvas'), frontCtx = frontCanvas.getContext('2d');
  const scoreEl = document.querySelector('#score'), linesEl = document.querySelector('#lines'), realityCountdown = document.querySelector('#reality-countdown'), realityLabel = document.querySelector('#reality-check-label'), heightEl = document.querySelector('#height');
  const boardWrap = document.querySelector('.board-wrap'), cameraLabel = document.querySelector('#camera-label'), celebrate = document.querySelector('#celebration'), over = document.querySelector('#game-over');
  let grid, current, next, score, lines, dropTimer, lastTime, realityAt, realityRemaining, showingReality, gameOver;
  const rand = () => Object.keys(shapes)[Math.floor(Math.random()*7)];
  const piece = (type=rand()) => ({ type, matrix:shapes[type].map(r=>[...r]), x:Math.floor((COLS-shapes[type][0].length)/2), y:0 });
  function start() { grid=Array.from({length:ROWS},()=>Array(COLS).fill(null)); score=0; lines=0; current=piece(); next=piece(); dropTimer=0; lastTime=0; realityAt=8000; realityRemaining=0; showingReality=false; gameOver=false; cameraLabel.innerHTML='<i></i> LIVE CEILING CAM'; over.classList.add('hidden'); updateText(); draw(); }
  function collide(p, dx=0, dy=0, matrix=p.matrix) { return matrix.some((row,y)=>row.some((v,x)=>v && (p.x+x+dx<0 || p.x+x+dx>=COLS || p.y+y+dy>=ROWS || (p.y+y+dy>=0 && grid[p.y+y+dy][p.x+x+dx])))); }
  function merge() { current.matrix.forEach((r,y)=>r.forEach((v,x)=>{ if(v && current.y+y>=0) grid[current.y+y][current.x+x]=current.type; })); clearLines(); current=next; next=piece(); if(collide(current)) { gameOver=true; over.classList.remove('hidden'); } }
  function clearLines() { let count=0; for(let y=ROWS-1;y>=0;y--) if(grid[y].every(Boolean)) { grid.splice(y,1); grid.unshift(Array(COLS).fill(null)); count++; y++; } if(count) { lines+=count; score += [0,100,300,500,800][count] * (1+Math.floor(lines/10)); celebrate.textContent = count===4 ? 'TETRIS!??!' : ['NICE ROW','DOUBLE TROUBLE','TRIPLE VISION'][count-1]; celebrate.classList.remove('show'); void celebrate.offsetWidth; celebrate.classList.add('show'); updateText(); reality('LINE CLEAR — LOOK WHAT YOU DID'); } }
  function rotate() { const m=current.matrix[0].map((_,i)=>current.matrix.map(r=>r[i]).reverse()); if(!collide(current,0,0,m)) current.matrix=m; else if(!collide(current,-1,0,m)) {current.x--;current.matrix=m;} else if(!collide(current,1,0,m)) {current.x++;current.matrix=m;} }
  function move(dx) { if(!collide(current,dx)) current.x+=dx; }
  function down(hard=false) { if(hard) { while(!collide(current,0,1)) current.y++; merge(); } else if(!collide(current,0,1)) current.y++; else merge(); }
  function updateText(){ scoreEl.textContent=String(score).padStart(6,'0'); linesEl.textContent=`${lines} line${lines===1?'':'s'} cleared`; }
  function block(c,x,y,s,top=true) { const pad=Math.max(1,s*.06); const xx=x*s+pad, yy=y*s+pad, w=s-pad*2; c.fillStyle=colors[top] || top || '#777'; c.fillRect(xx,yy,w,w); c.fillStyle='rgba(255,255,255,.29)'; c.fillRect(xx+2,yy+2,w-4,Math.max(2,w*.15)); c.fillStyle='rgba(0,0,0,.2)'; c.fillRect(xx+w*.82,yy+2,w*.18,w-4); c.fillRect(xx+2,yy+w*.82,w-4,w*.18); c.strokeStyle='rgba(16,31,43,.45)'; c.lineWidth=1; c.strokeRect(xx+.5,yy+.5,w-1,w-1); }
  function drawBoardPiece(c,p,offsetX=0,offsetY=0,scale=SIZE) { p.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v) block(c,p.x+x+offsetX,p.y+y+offsetY,scale,p.type)})); }
  // Looking straight down collapses the board's vertical axis.  Each lane only
  // shows its topmost block; a falling piece is a bright cap hovering above it.
  function topCap(x, type, altitude, falling=false) { const s=43, xx=35+x*s, yy=470; const glow=falling ? 1 : Math.max(.45, 1-altitude/ROWS*.6); ctx.save(); ctx.globalAlpha=glow; ctx.shadowColor=colors[type]; ctx.shadowBlur=falling ? 22 : 8; block(ctx, xx/s, yy/s, s, type); ctx.restore(); if(falling) { ctx.strokeStyle='#fff8d0';ctx.lineWidth=2;ctx.strokeRect(xx+3,yy+3,s-6,s-6); } }
  function drawCeilingView() { ctx.clearRect(0,0,500,1000); ctx.fillStyle='#102a37';ctx.fillRect(0,0,500,1000); const grad=ctx.createRadialGradient(250,500,30,250,500,430); grad.addColorStop(0,'#31505c');grad.addColorStop(1,'#142e3a');ctx.fillStyle=grad;ctx.fillRect(0,0,500,1000); ctx.fillStyle='rgba(255,255,255,.16)';ctx.font='12px DM Mono';ctx.fillText('TEN LANES. TWENTY FLOORS. ONE TERRIBLE VIEW.',55,400); ctx.strokeStyle='rgba(255,255,255,.18)';ctx.strokeRect(32,467,436,49); for(let x=1;x<COLS;x++){ctx.beginPath();ctx.moveTo(35+x*43,467);ctx.lineTo(35+x*43,516);ctx.stroke();}
    for(let x=0;x<COLS;x++) { const y=grid.findIndex(row=>row[x]); if(y>=0) topCap(x,grid[y][x],y); }
    if(!gameOver) { const visible={}; current.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v) { const col=current.x+x, row=current.y+y; if(!visible[col] || row<visible[col].row) visible[col]={row,type:current.type}; }})); Object.entries(visible).forEach(([x,v])=>topCap(Number(x),v.type,v.row,true)); }
  }
  function draw() { if(showingReality && REALITY_CHECK_IN_MAIN_VIEW) drawFront(ctx,500,1000,40,true); else drawCeilingView(); drawCurrent(); drawNext(); drawFront(); }
  function drawPreview(c, p) { c.clearRect(0,0,180,130); const s=29, w=p.matrix[0].length*s, h=p.matrix.length*s; p.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v) block(c,x+(180/s-w/s)/2,y+(130/s-h/s)/2,s,p.type)})); }
  function drawCurrent() { drawPreview(currentCtx, current); const lowestCell = Math.max(...current.matrix.map((row, y) => row.some(Boolean) ? y : -1)); heightEl.textContent = Math.max(0, ROWS - 1 - (current.y + lowestCell)); }
  function drawNext() { drawPreview(nextCtx, next); }
  function drawFront(c=frontCtx,w=260,h=360,s=16,mainView=false) { c.clearRect(0,0,w,h); c.fillStyle='#122937';c.fillRect(0,0,w,h); const left=(w-COLS*s)/2,bottom=h-30;
    const frontBlock=(x,y,type,active=false)=>{ const depth=ROWS-y, bx=left+x*s, by=bottom-depth*s; c.fillStyle=colors[type];c.fillRect(bx,by,s,s);c.fillStyle='rgba(255,255,255,.24)';c.fillRect(bx+1,by+1,s-2,3);if(active){c.strokeStyle='#fff8d0';c.lineWidth=1.5;c.strokeRect(bx+1,by+1,s-2,s-2);} };
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(grid[y][x]) frontBlock(x,y,grid[y][x]);
    if(!gameOver) current.matrix.forEach((row,y)=>row.forEach((value,x)=>{if(value) frontBlock(current.x+x,current.y+y,current.type,true);}));
    c.strokeStyle='rgba(255,255,255,.38)';c.lineWidth=2;c.strokeRect(left,bottom-ROWS*s,COLS*s,ROWS*s);c.fillStyle='rgba(255,255,255,.65)';c.font=mainView?'18px DM Mono':'10px DM Mono';c.fillText(mainView?'REALITY CHECK — FRONT VIEW':'a more useful camera', mainView?115:52, mainView?45:h-12); }
  function popViewport() { boardWrap.classList.remove('pop'); void boardWrap.offsetWidth; boardWrap.classList.add('pop'); }
  function reality() { showingReality=true; realityRemaining=2200; popViewport(); cameraLabel.innerHTML='<i></i> REALITY CHECK'; realityAt=8000; setTimeout(()=>{cameraLabel.innerHTML='<i></i> LIVE CEILING CAM'; showingReality=false; popViewport();},2200); }
  function loop(time=0) { const dt=time-lastTime; lastTime=time; if(!gameOver) { if(!showingReality) { dropTimer+=dt; realityAt-=dt; if(dropTimer>720) { down();dropTimer=0; } if(realityAt<=0) reality(); } else realityRemaining-=dt; const sec=Math.max(0,Math.ceil((showingReality?realityRemaining:realityAt)/1000)); realityLabel.textContent=showingReality ? 'CEILING CAM RETURNS IN' : 'REALITY CHECK IN'; realityCountdown.textContent=String(sec).padStart(2,'0'); draw(); } requestAnimationFrame(loop); }
  document.addEventListener('keydown',e=>{ if(gameOver || showingReality) return; if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key)) e.preventDefault(); if(e.key==='ArrowLeft')move(-1); if(e.key==='ArrowRight')move(1); if(e.key==='ArrowUp')rotate(); if(e.key==='ArrowDown')down(); if(e.key===' ')down(true); draw(); });
  document.querySelector('#restart').addEventListener('click',start); start(); requestAnimationFrame(loop);
})();
