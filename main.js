//グローバル定義
var loader;
var core;
var theme;
var mouse;
var input;
var textAreaElement;

function setup(){
    loader=new Loader();
    core=new Core();

    var wrapperDiv=document.getElementById("wrapper");
    textAreaElement=document.getElementById("sources");
    
    canvas=createCanvas(wrapperDiv.offsetWidth,wrapperDiv.offsetHeight);
    canvas.parent("wrapper");

    input=createFileInput(ImageSelected);
    input.parent("menu");

    //イベント
    canvas.mouseWheel(zoom);

    mouse=new Mouse();

    windowResized();
    background("#333333");

    SetSource();
}

function windowResized(){
    resizeCanvas(1,1);
    var wrapperDiv=document.getElementById("wrapper");
    resizeCanvas(wrapperDiv.clientWidth,wrapperDiv.clientHeight);
}
function draw(){
    background(0,0,0);
    if(loader.isMenuVisible){
        noSmooth();
        if(core.image!==null){
            image(core.image,width/2+core.posX,height/2+core.posY,core.image.width*core.zoom,core.image.height*core.zoom);
            
            //特定のズーム率からボーダーを表示
            if(core.zoom>5){
                stroke(0,0,0);
                for(let i=1;i<core.image.width;i++){
                    fx=width/2+core.posX+core.zoom*i;
                    oy=height/2+core.posY;
                    line(fx,oy,fx,oy+core.image.height*core.zoom);
                }
                for(let i=1;i<core.image.height;i++){
                    fy=height/2+core.posY+core.zoom*i;
                    ox=width/2+core.posX;
                    line(ox,fy,ox+core.image.width*core.zoom,fy);
                }
            }

            if(core.zoom>1){
                stroke(255,0,0);
                let Xpos=width/2+core.posX;
                line(Xpos,0,Xpos,height);
                let XposS=Xpos+core.image.width*core.zoom;
                line(XposS,0,XposS,height);
                let Ypos=height/2+core.posY;
                line(0,Ypos,width,Ypos);
                let YposS=Ypos+core.image.height*core.zoom;
                line(0,YposS,width,YposS);
            }

            if(mouse.selecting){
                push();
                noFill();
                strokeWeight(5);
                stroke(0,0,255,255);
                rect(width/2+core.posX+mouse.selectStartPixel.x*core.zoom,
                    height/2+core.posY+mouse.selectStartPixel.y*core.zoom,
                    (mouse.selectEndPixel.x+1-mouse.selectStartPixel.x)*core.zoom,
                    (mouse.selectEndPixel.y+1-mouse.selectStartPixel.y)*core.zoom);
                pop();
            }
            
            if(core.rects.length!=0){
                push();
                noFill();
                strokeWeight(5);
                stroke(0,0,255,255);
                for(let i=0;i<core.rects.length;i++){
                    rect(width/2+core.posX+core.rects[i].x*core.zoom, height/2+core.posY+core.rects[i].y*core.zoom,
                        core.rects[i].sx*core.zoom,core.rects[i].sy*core.zoom);
                }
                pop();
            }
        }
    }
}
function keyPressed(){
    //もとに戻す
    if(keyIsDown(17) && keyIsDown(90)){
        core.rects.pop();
        SetSource();
    }
}
function ImageSelected(file){
    if(file.type==="image"){
        core=new Core();
        core.image=createImg(file.data,"");
        core.image.hide();
        SetSource();
    }
}

function mousePressed(){
    if(core.image!=null && mouseX<width && mouseY>0){
        if(mouseButton===LEFT){
            mouse.selecting=true;
            mouse.selectStartPixel.x=Math.floor((mouseX-(width/2+core.posX))/core.zoom);
            mouse.selectStartPixel.y=Math.floor((mouseY-(height/2+core.posY))/core.zoom);
            mouse.selectEndPixel.x=mouse.selectStartPixel.x;
            mouse.selectEndPixel.y=mouse.selectStartPixel.y;
        }
        if(mouseButton===CENTER){
            mouse.dragging=true;
            mouse.mouseStart.x=mouseX-core.posX;
            mouse.mouseStart.y=mouseY-core.posY;
        }
    }
}
function mouseDragged(){
    if(mouse.selecting){
        mouse.selectEndPixel.x=Math.floor((mouseX-(width/2+core.posX))/core.zoom);
        mouse.selectEndPixel.y=Math.floor((mouseY-(height/2+core.posY))/core.zoom);
    }
    if(mouse.dragging){
        core.posX=mouseX-mouse.mouseStart.x;
        core.posY=mouseY-mouse.mouseStart.y;
    }
}

function mouseReleased(){
    if(mouse.selecting){
        core.rects.push(new Rect(mouse.selectStartPixel.x,mouse.selectStartPixel.y,mouse.selectEndPixel.x-mouse.selectStartPixel.x+1,mouse.selectEndPixel.y-mouse.selectStartPixel.y+1));
        mouse.selecting=false;
        SetSource();
    }
    mouse.selecting=false;
    mouse.dragging=false;
}
function zoom(event){
    if(event.deltaY!=0){
        if(event.deltaY>0)
            core.zoom-=2;
        else
            core.zoom+=2;
        core.zoom=Math.min(100,Math.max(1,core.zoom));
    }
}

function SetSource(){
    textAreaElement.value=getSource();
}
function getSource(){
    let chkbox=document.getElementById("isFill");
    core.isUseFill=chkbox.checked;
    
    let source="--ソースコード";

    let func;
    if(core.isUseFill)func="screen.drawRectF";
    else func="screen.drawRect";
    for(let i=0;i<core.rects.length;i++){
        source+=`\n${func}(${core.rects[i].x},${core.rects[i].y},${core.rects[i].sx},${core.rects[i].sy})`;
    }
    return source;
}

class Core{
    constructor(){
        this.posX=0;
        this.posY=0;
        this.image=null;
        this.zoom=1;
        this.isUseFill=true;
        this.rects=new Array();
    }
}

class Rect{
    constructor(_x,_y,_sx,_sy){
        this.x=_x;
        this.y=_y;
        this.sx=_sx;
        this.sy=_sy;
    }
}
class Loader{
    constructor(){
        this.isMenuVisible=true;
        
    }
}
class Mouse{
    constructor(){
        this.dragging=false;
        this.selecting=false;
        this.mouseStart=new Position();
        this.selectStartPixel=new Position();
        this.selectEndPixel=new Position();
        
    }
}
class Position{
    constructor(){
        this.x=0;
        this.y=0;
    }
}
class Theme{

}