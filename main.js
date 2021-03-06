class Vector2{
    constructor(_x,_y){
        this.x=_x;
        this.y=_y;
    }
}

//定数宣言
const maxDisplaySize=new Vector2(9, 5);
const displayPixel=32;
const maxCharacter=4096;

//グローバル定義
isMenuVisible=true;
isAutoTrace=false;
autoTraceAnimFrm=0;
var storageMgr;
var core;
var autoTrace;
var theme;
var mouse;
var input;
var logElement;
var textAreaElement;
var charCountElement;
var informationElement;

function setup(){
    core=new Core();//コア定義
    
    autoTrace=new AutoTrace(core);

    //HTML操作
    var wrapperDiv=document.getElementById("wrapper");
    textAreaElement=document.getElementById("sources");
    charCountElement=document.getElementById("charCount");
    informationElement=document.querySelector("#information");
    logElement=document.getElementById("logE");

    canvas=createCanvas(wrapperDiv.offsetWidth,wrapperDiv.offsetHeight);
    canvas.parent("wrapper");

    input=createFileInput(ImageSelected);
    input.parent("inputBox");

    //ボタン
    document.querySelector("#AutoSelectButton").addEventListener("click", this.enableAutoTraceMode);
    document.querySelector("#saveButton").addEventListener("click", this.saveDat);
    document.querySelector("#clipBoard").addEventListener("click", this.copyToClipBoard);
    document.querySelector("#clearButton").addEventListener("click", this.clearItems);
    document.querySelector("#resetButton").addEventListener("click", this.reset);

    //レイヤー関連ボタン
    document.querySelector("#addLayer").addEventListener("click", this.addLayer);
    document.querySelector("#removeLayer").addEventListener("click", this.deleteLayer);

    //---
    document.querySelectorAll(".RefreshSrc").forEach(function (elm){
        elm.addEventListener("change", this.SetSource);
    });
    document.querySelectorAll(".RfrScrInBtn").forEach(function (elm){
        elm.addEventListener("click", this.windowResized);
    });

    //ドラッグアンドドロップ
    let elm=document.querySelector(".wrapper");
    elm.addEventListener("dragenter",dragenter, false);
    elm.addEventListener("dragover",dragover, false);
    elm.addEventListener("drop",drop, false);

    document.querySelector(".layerContainer").addEventListener("drop",drop_layer);
    document.querySelector(".layerContainer").addEventListener("dragstart",dragStart_layer);
    //復帰
    storageMgr=new StorageManager();
    storageMgr.logElement=logElement;
    if(storageMgr.exist())storageMgr.load();

    //イベント
    canvas.mouseWheel(zoom);

    mouse=new Mouse();

    //デバッグ
    
    background("#333333");

    SetSource();

    windowResized();
}
window.onload=function(){windowResized();}
function windowResized(){
    resizeCanvas(1,1);

    var wrapperDiv=document.getElementById("wrapper");
    resizeCanvas(wrapperDiv.clientWidth,wrapperDiv.clientHeight);
}
function draw(){
    background("#262626");
    if(isMenuVisible){
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

            

            //四角形の描画(レイヤー)
            for(let jn=0;jn<core.layerMgr.layers.length;jn++){
                j=core.layerMgr.layers.length-1-jn;
                if(core.layerMgr.layers[j].rects.length!=0 && core.layerMgr.layers[j].visible){
                    push();
                    if(core.isPreview){
                        if(core.isUseFill){
                            fill(core.isSetColor?core.layerMgr.layers[j].r:255,core.isSetColor?core.layerMgr.layers[j].g:255,core.isSetColor?core.layerMgr.layers[j].b:255);
                            strokeWeight(0);
                        }
                        else{
                            noFill();
                            strokeWeight(5);
                            stroke(core.isSetColor?core.layerMgr.layers[j].r:255,core.isSetColor?core.layerMgr.layers[j].g:255,core.isSetColor?core.layerMgr.layers[j].b:255);
                        }
                    }
                    else{
                        noFill();
                        strokeWeight(5);
                        stroke(0,0,255,255);
                    }

                    let path=core.layerMgr.layers[j].rects;
                    for(let i=0;i<core.layerMgr.layers[j].rects.length;i++){
                        rect(width/2+core.posX+path[i].x*core.zoom, height/2+core.posY+path[i].y*core.zoom,
                            path[i].sx*core.zoom,path[i].sy*core.zoom);
                    }
                    pop();
                }
            
            
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

            //自動トレースオーバーレイ
            if(autoTraceAnimFrm>0.001){
                offset=-90+90*easeOutExpo(autoTraceAnimFrm);
                push();
                strokeWeight(0);
                fill(255,255,255,100);
                rect(0,0+offset,width,90);

                fill(255,255,255);
                textAlign(LEFT,TOP);
                textSize(50);
                text("自動トレースモード",10,10+offset);

                textSize(20);
                text("対象の色を選択してください",180,60+offset);

                //対象のピクセル座標の色を選択
                let x=Math.floor((mouseX-(width/2+core.posX))/core.zoom);
                let y=Math.floor((mouseY-(height/2+core.posY))/core.zoom);
                let col=core.image.get(x,y);
                fill(col[0],col[1],col[2]);
                rect(width-10,10+offset,-70,70+offset);
                pop();
            }
            if(isAutoTrace){autoTraceAnimFrm=Math.min(1,autoTraceAnimFrm);autoTraceAnimFrm+=0.02}else{autoTraceAnimFrm=Math.max(0,autoTraceAnimFrm);autoTraceAnimFrm-=0.05;}
            
        }

        //オーバレイログ
        if(overlayMsg.message!=null){
            push();
                fill(255,255,255);
                textAlign(LEFT,TOP);
                textSize(20);
                strokeWeight(0);
                text(overlayMsg.message,10,height-30*easeOutExpo(overlayMsg.frame));//0~30
                
            pop();
            overlayMsg.update();
        }

        setInfo();
    }
}
function keyPressed(){
    //もとに戻す
    if(keyIsDown(17) && keyIsDown(90)){
        if(core.layerMgr.selectedLayerIndex!=null){
            core.layerMgr.layers[core.layerMgr.selectedLayerIndex].rects.pop();
            core.layerMgr.setToDOM();
            SetSource();
        }
    }
}
function ImageSelected(file){//画像のロード
    // console.log(file);

    if(file.type==="image"){
        temp=createImg(file.data,"","",async()=>{
            await(3000);
            temp.hide();
            
        if(temp.width%displayPixel!=0 || temp.height%displayPixel!=0){
            if(confirm(`画像サイズが${displayPixel}の倍数ではありません、読み込みますか？`)==false)
                return;
        }
        if(maxDisplaySize.x*displayPixel<temp.width || maxDisplaySize.y*displayPixel<temp.height){
            if(confirm("画像サイズが大きすぎます、読み込みますか？")==false)
                return;
        }

        let isConfirm=false;
        for(let i=0;i<core.layerMgr.layers.length;i++){
            if(core.layerMgr.layers[i].rects.length!=0){
                isConfirm=true;
            }

            if(isConfirm)break;
        }
        let result=false;
        if(isConfirm)
            result = confirm("変更が加えられています\n保持したまま読み込みますか？");
        
        if(!result)
            core=new Core();

        core.imageData=file.data;
        core.loadImage();
        windowResized();
        });
    }
}

function mousePressed(){
    if(core.image!=null && mouseX<width && mouseY>0){

        if(isAutoTrace==false && mouseButton===LEFT){
            mouse.selecting=true;
            mouse.selectStartPixel.x=Math.floor((mouseX-(width/2+core.posX))/core.zoom);
            mouse.selectStartPixel.y=Math.floor((mouseY-(height/2+core.posY))/core.zoom);

            //範囲外だったら中止
            if(mouse.selectStartPixel.x<0 || core.image.width<mouse.selectStartPixel.x || mouse.selectStartPixel.y<0 || core.image.height<mouse.selectStartPixel.y){
                mouse.selecting=false;
                return;
            }
            
            mouse.selectEndPixel.x=mouse.selectStartPixel.x;
            mouse.selectEndPixel.y=mouse.selectStartPixel.y;
        }
        if(mouseButton===CENTER){
            mouse.dragging=true;
            mouse.mouseStart.x=mouseX-core.posX;
            mouse.mouseStart.y=mouseY-core.posY;
        }

        if(isAutoTrace && mouseButton===LEFT){
            clearItems();

            let x=Math.floor((mouseX-(width/2+core.posX))/core.zoom);
            let y=Math.floor((mouseY-(height/2+core.posY))/core.zoom);
            let col=core.image.get(x,y);
            autoTrace.init(core.image, col[0], col[1], col[2]);
            autoTrace.AutoSelect();
            isAutoTrace=false;
        }
    }
}
function mouseDragged(){
    if(mouse.selecting){
        rawX=(mouseX-(width/2+core.posX))/core.zoom;
        rawY=(mouseY-(height/2+core.posY))/core.zoom;
        if(mouse.selectStartPixel.x<=mouse.selectEndPixel.x)mouse.selectEndPixel.x=Math.floor(rawX);
        else mouse.selectEndPixel.x=Math.floor(rawX+1);
        if(mouse.selectStartPixel.y<=mouse.selectEndPixel.y)mouse.selectEndPixel.y=Math.floor(rawY);
        else mouse.selectEndPixel.y=Math.floor(rawY+1);
    }
    if(mouse.dragging){
        core.posX=mouseX-mouse.mouseStart.x;
        core.posY=mouseY-mouse.mouseStart.y;
    }
}

function mouseReleased(){
    if(mouse.selecting){
        if(0<=mouse.selectEndPixel.x && mouse.selectEndPixel.x<=core.image.width && 0<=mouse.selectEndPixel.y && mouse.selectEndPixel.y<=core.image.height
            && (mouse.selectEndPixel.x-mouse.selectStartPixel.x+1)!=0 && (mouse.selectEndPixel.y-mouse.selectStartPixel.y+1)!=0){
            core.addRect(mouse.selectStartPixel.x,mouse.selectStartPixel.y,mouse.selectEndPixel.x-mouse.selectStartPixel.x+1,mouse.selectEndPixel.y-mouse.selectStartPixel.y+1);
        }
        
        mouse.selecting=false;
        SetSource();
    }
    mouse.selecting=false;
    mouse.dragging=false;
}
function zoom(event){
    if(event.deltaY!=0 && core.image!==null){
        console.log(mouseX+","+mouseY);
        core.image.width*core.zoom
        if(event.deltaY>0){
            core.zoom-=2;
        }
        else{
            core.zoom+=2;
        }
        core.zoom=Math.min(100,Math.max(1,core.zoom));
    }
}

function setInfo(){
    informationElement.innerHTML=`X:${Math.floor((mouseX-(width/2+core.posX))/core.zoom+1)}, Y:${Math.floor((mouseY-(height/2+core.posY))/core.zoom+1)}</br>${core.image!==null?`画像サイズ:${core.image.width}x${core.image.height}`:""}</br>${core.image!==null?`ディスプレイのサイズ:${core.image.width%displayPixel==0?core.image.width/displayPixel:"推定できません"}x${core.image.height%displayPixel==0?core.image.height/displayPixel:"推定できません"}`:""}`;
}

function SetSource(){
    source=getSource();
    textAreaElement.value=source;

    //文字最大数を超えていた場合警告を表示する
    document.getElementById("charCount").style.color=`${source.length>maxCharacter?"#ff3333":"white"}`;
    charCountElement.textContent=`${source.length}/${maxCharacter}`;

}
function getSource(){
    let chkbox=document.getElementById("isFill");
    core.isUseFill=chkbox.checked;

    chkbox=document.getElementById("isSetColor");
    core.isSetColor=chkbox.checked;

    chkbox=document.getElementById("isUseGamma");
    core.isUseGamma=chkbox.checked;

    chkbox=document.getElementById("isGenMiniCode");
    core.isGenMiniCode=chkbox.checked;

    core.isPreview=document.getElementById("preview").checked;
    
    let source="--code";

    let func;

    if(core.isGenMiniCode)source+="\nfunction onDraw()";//関数はじめ

    if(core.isUseFill)func="screen.drawRectF";
    else func="screen.drawRect";

    for(let l=0;l<core.layerMgr.layers.length;l++){
        let ln=core.layerMgr.layers.length-1-l;

        source+="\n--"+core.layerMgr.layers[ln].name;

        if(core.isSetColor && core.layerMgr.layers[ln].visible && core.layerMgr.layers[ln].rects.length!=0){
            col=core.layerMgr.layers[ln];
            source+=`\nscreen.setColor(${core.isUseGamma?RGB.gammaFix(col.r):col.r},${core.isUseGamma?RGB.gammaFix(col.g):col.g},${core.isUseGamma?RGB.gammaFix(col.b):col.b})`;
        }
        
        if(core.layerMgr.layers[ln].visible){
            for(let i=0;i<core.layerMgr.layers[ln].rects.length;i++){
                let path=core.layerMgr.layers[ln].rects[i];
                source+=`\n${core.isGenMiniCode?"r":func}(${path.x}${core.layerMgr.layers[ln].addOffsetX?"+x":""},${path.y}${core.layerMgr.layers[ln].addOffsetY?"+y":""},${path.sx},${path.sy})`;
            }
        }
    }

    if(core.isGenMiniCode)source+=`\nend`;

    if(core.isGenMiniCode)source+=`\nfunction r(x,y,sx,sy)\n    ${func}(x,y,sx,sy)\nend`;
    return source;
}
function copyToClipBoard(){
    navigator.clipboard.writeText(textAreaElement.value);
    overlayMsg.set("クリップボードにコピーしました");
}
function saveDat(){
    storageMgr.save();
}

function enableAutoTraceMode(){
    isAutoTrace=!isAutoTrace;
}

function clearItems(){
    if(core.layerMgr.selectedLayerIndex!=null){
        overlayMsg.set(`${core.layerMgr.layers[core.layerMgr.selectedLayerIndex].rects.length}個のアイテムを消去しました。`)
        core.layerMgr.layers[core.layerMgr.selectedLayerIndex].rects=new Array();
    }
    SetSource();
    core.layerMgr.setToDOM();
}

function reset(){
    storageMgr.reset();
}

function dragenter(e){
    e.stopPropagation();
    e.preventDefault();
}
function dragover(e){
    e.stopPropagation();
    e.preventDefault();
}

let foo=null;
function drop(e){
    e.stopPropagation();
    e.preventDefault();
    if(e.dataTransfer.files.length!=0){
        //fileReader
        let fileReader=new FileReader();
        fileReader.readAsDataURL(e.dataTransfer.files[0]);
        foo=new p5.File(e.dataTransfer.files[0]);
        fileReader.onload=function(event){
            foo.data=event.target.result;
            ImageSelected(foo);
        }
    }
}
function dragStart_layer(e){
    e.dataTransfer.setData("text/plain", e.target.id);
}
function drop_layer(e){
    // e.preventDefault();
    if(e.target.id==""){
        let element = e.target;
        while(element.id==""){
            element=element.parentNode;
        }
        core.layerMgr.moveAt(e.dataTransfer.getData("text"),element.id);
    }
    else if(e.target.id=="layerContainer"){
        core.layerMgr.moveAt(e.dataTransfer.getData("text"),core.layerMgr.layers.length-1);
    }
    else{
        core.layerMgr.moveAt(e.dataTransfer.getData("text"),e.target.id);
    }
}

//レイヤー
function addLayer(){
    core.layerMgr.addLayer();
}
function deleteLayer(){
    overlayMsg.set(`レイヤー"${core.layerMgr.layers[core.layerMgr.selectedLayerIndex].name}"を削除しました`)
    core.layerMgr.deleteLayer();
    
}

class overlayMsg{
    static show=false;
    static message=null;
    static frame=0;
    static increase=true;
    static speed=0.03;
    static lifeTime=5;

    static set(_message){
        this.show=true;
        this.frame=0;
        this.increase=true;
        this.message=_message;
    }
    static update(){
        if(this.show){
            if(this.increase)
                this.frame+=this.speed;
            else
                this.frame-=this.speed;

            if(this.increase==false && this.frame<=0){
                this.frame=0;
                this.message=null;
                this.show=false;
            }
            
            if(this.frame>=this.lifeTime){
                this.frame=1;
                this.increase=false;
            }
        }
    }
}

class LayerMgr{
    constructor(){
        this.layers=new Array();
        this.selectedLayerIndex=null;

        //一時
        this.layerName=null;
        this.objectTotal=null;
        this.objhex=null;
    }
    addLayer(){
        // this.layers.push(new Layer());
        this.layers.splice(this.selectedLayerIndex,0,new Layer());
            // if(this.selectedLayerIndex==null)this.selectedLayerIndex=this.layers.length;
        this.setToDOM();
        if(this.selectedLayerIndex==null)
        this.select(0);
            // this.select(this.selectedLayerIndex);
        // else
        //     this.select(0);
    }
    deleteLayer(){
        if(core.layerMgr.selectedLayerIndex!=null){
            this.layers.splice(this.selectedLayerIndex, 1);
            this.selectedLayerIndex=null;
            this.setToDOM();
            SetSource();
        }
    }
    moveAt(index, at) {
        if (index === at || index > this.layers.length -1 || at > this.layers.length - 1) {
          return;
        }
        at=parseInt(at);
        
        if(index<at){
            this.layers.splice(at+1,0,this.layers[index]);
            this.layers.splice(index,1);
        }
        else{
            let temp=this.layers[index];
            this.layers.splice(index,1);
            this.layers.splice(at,0,temp);
        }

        this.setToDOM();
    }
    setToDOM(){
        let layerDiv=document.querySelector(".layerContainer");

        layerDiv.innerHTML="";

        for(let i=0;i<this.layers.length;i++){
            this.layerName=this.layers[i].name;
            this.objectTotal=this.layers[i].rects.length;
            this.objhex=this.layers[i].getHex();
            this.isOffsetX=this.layers[i].addOffsetX;
            this.isOffsetY=this.layers[i].addOffsetY;

            layerDiv.innerHTML+=`<div class="layer_item" id="${i}" ${i==this.selectedLayerIndex ? 'data-selected="true"' : ""} draggable="true">
            <div class="borderInGrid"></div>
            <label class="visibilityLabel" title="表示・非表示">
                <input type="checkbox" class="visibleChk" ${this.layers[i].visible?"checked":""}>
                <div></div>
            </label>
            <p class="LayerName NotSelectable" title="レイヤー名を変更...">${this.layerName}</p>
            <div class="LayerDetail">
                <p class="NotSelectable">${this.objectTotal}アイテム</p>
                <div class="LayerSetting">
                    <label>
                        <input type="checkbox" class="LayerStgChk X" ${this.isOffsetX?"checked":""}></input>
                        <div title="X軸のオフセット">X</div>
                    </label>
                    <label>
                        <input type="checkbox" class="LayerStgChk Y" ${this.isOffsetY?"checked":""}></input>
                        <div title="X軸のオフセット">Y</div>
                    </label>
                </div>
            </div>
            <label class="LayerColor" style="background-color: ${this.objhex};" title="色を変更...">
            <input type="color" class="LayerColorPicker" value="${this.objhex}">
            </label>
            </div>`;
        }

        //レイヤー選択のイベント登録
        let elm=document.querySelectorAll(".layer_item");

        elm.forEach(value=>{value.addEventListener("click",e=>{
            if(e.target.classList.contains("LayerName")){
                let result = prompt("レイヤー名を指定");
                if(result && result.match(/\S/g)){
                    // this.layers[this.selectedLayerIndex].name=result;
                    this.layers[e.target.parentNode.id].name=result;
                    SetSource();
                    this.setToDOM();
                }
            }
            if(e.target.classList.contains("visibleChk")){
                this.layers[this.selectedLayerIndex].visible=e.target.checked;
                SetSource();
            }
            if(e.target.classList.contains("LayerStgChk")){
                if(e.target.classList.contains("X")){
                    this.layers[this.selectedLayerIndex].addOffsetX=e.target.checked;
                }
                if(e.target.classList.contains("Y")){
                    this.layers[this.selectedLayerIndex].addOffsetY=e.target.checked;
                }
                SetSource();
                this.setToDOM();
            }
            this.select(e.currentTarget.id);
        });});

        let picker=document.querySelectorAll(".LayerColorPicker");
        picker.forEach(value=>{
            value.addEventListener("input",e=>{
                this.layers[e.currentTarget.parentNode.parentNode.id].setColorFromHex(e.target.value);
                e.currentTarget.parentNode.style=`background-color: ${e.target.value};`;
                SetSource();
            });
        });
    }
    select(Index){
        // console.log(`${Index}が選択されました`);

        if(this.selectedLayerIndex!==null)document.querySelectorAll(".layer_item")[this.selectedLayerIndex].dataset.selected=false;
        this.selectedLayerIndex=Index;
        document.querySelectorAll(".layer_item")[Index].dataset.selected=true;

        //仮置き selectedLayerIndex==nullだったらボタンをdisabledにする
        if(this.selectedLayerIndex==null)document.querySelector("#removeLayer").disabled=true;
        else document.querySelector("#removeLayer").disabled=false;
    }
}

class Core{
    constructor(){
        this.posX=0;
        this.posY=0;
        this.image=null;
        this.imageData=null;
        this.zoom=1;

        // this.color=null;

        this.isUseFill=true;
        this.isSetColor=true;
        this.isUseGamma=false;
        this.isGenMiniCode=false;
        this.isPreview=false;


        // this.Layers=new Array();
        this.layerMgr=new LayerMgr();
        this.rects=new Array();

        // core.layerMgr.addLayer();
        this.layerMgr.addLayer();
    }
    loadImage(){
        core.image=loadImage(this.imageData,"");
        this.color=null;
        // core.image.hide();
        SetSource();
    }

    addRect(x, y, sx, sy){
        if(this.layerMgr.selectedLayerIndex!=null)this.layerMgr.layers[this.layerMgr.selectedLayerIndex].rects.push(new Rect(x, y, sx, sy));
        else{
            if(this.layerMgr.layers.length==0)overlayMsg.set("レイヤーがありません。レイヤーを新規作成してください");
            else overlayMsg.set("レイヤーが選択されていません");
        }

        this.layerMgr.setToDOM();//パフォーマンス落ちる可能性あり
    }
    cleanUp(){

    }
    positionClamp(){
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
class StorageManager{
    constructor(){
        this.logElement;
    }
    exist(){
        return true;
    }
    load(){
        core.posX=getItem("positionX");
        core.posY=getItem("positionY");
        core.zoom=getItem("zoom");
        core.imageData=getItem("image");
        if(core.imageData!==null)core.loadImage();
        core.rects=getItem("rectArray");
        if(core.rects==null)core.rects=new Array();
        
    }
    save(){
        if(core.posX!==null)storeItem("positionX", core.posX);
        if(core.posY!==null)storeItem("positionY", core.posY);
        if(core.zoom!==null)storeItem("zoom", core.zoom);
        if(core.imageData!==null)storeItem("image", core.imageData);
        if(core.rects!==null)storeItem("rectArray", core.rects);

        var d=new Date(Date.now());
        logElement.innerHTML=`保存しました...(${d.getHours()}:${d.getMinutes()}:${d.getSeconds()})`;
    }
    reset(){
        localStorage.clear();
        window.location.reload();
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

class AutoTrace{
    constructor(_core){
        this.core=_core;

        this.image;
        this.threshold=0;
        this.maps;// 画像サイズ**+2**のサイズ
        this.edges;//左上端
    }

    init(img, r,g,b){
        //色をセット
        // core.color=new RGB(r,g,b);
        let path=core.layerMgr.layers[core.layerMgr.selectedLayerIndex];
        path.r=r;
        path.g=g;
        path.b=b;

        //画像の選択範囲を解析
        this.image=img;
        //画像サイズ+2の二次元配列を定義（範囲外選択で例外を防ぐため）
        this.maps=new Array(this.image.height+2);
        for(let i=0;i<this.maps.length;i++)this.maps[i]=new Array(this.image.width+2);

        //そこにピクセルが存在するか判定
        //0=空白 1=未選択 2=選択済み
        for(let i=0;i<this.maps.length-2;i++){
            for(let j=0; j<this.maps[i].length-2;j++){
                var rgb=core.image.get(j,i);
                if(r-this.threshold<=rgb[0] && rgb[0]<=r+this.threshold && 
                    g-this.threshold<=rgb[1] && rgb[1]<=g+this.threshold &&
                    b-this.threshold<=rgb[2] && rgb[2]<=b+this.threshold)
                    {
                        this.maps[i+1][j+1]=1;
                    }
                    else{
                        this.maps[i+1][j+1]=0;
                    }
            }
        }
        return this.maps;//デバッグ用
    }
    scanEdges(){
        this.edges=new Array();
        //左上端を列挙
        for(let i=0;i<this.maps.length-2;i++){
            for(let j=0;j<this.maps[i].length-2;j++){
                if(this.maps[i+1][j+1]==1 && this.maps[i][j+1]!=1 && this.maps[i+1][j]!=1){
                    this.edges.push([i+1,j+1]);
                }
            }
        }
        return this.edges;
    }
    AutoSelect(){
        //右→下↓の順と下↓右→の順に面積を求め、大きい方を選択に入れる、同時にthis.mapsの選択した座標を2(選択済み)にする←これをthis.mapsから1がなくなるまで繰り返す
        var isEnded=false;

        while(isEnded==false){
            isEnded=true;
            for(let i=0;i<this.maps.length;i++){
                let foo=this.maps[i].includes(1);
                if(foo)isEnded=false;
            }

            this.scanEdges();

            for(let n=0;n<this.edges.length;n++){
                origin=this.edges[n];

                var sxH=0;
                var syH=1;
                var sxV=1;
                var syV=0;

                //面積
                //右→
                while(this.maps[origin[0]][origin[1]+sxH]==1 || this.maps[origin[0]][origin[1]+sxH]==2)sxH++;

                //下↓
                var _nofill=false;
                while(_nofill==false){
                    for(let x=0;x<sxH;x++){
                        if(this.maps[origin[0]+syH][origin[1]+x]==0 || this.maps[origin[0]+syH][origin[1]+x]==undefined)_nofill=true;
                    }
                    if(_nofill==false)syH++;
                }

                //下↓
                while(this.maps[origin[0]+syV][origin[1]]==1 || this.maps[origin[0]+syV][origin[1]]==2)syV++;

                //右→
                var _nofill=false;
                while(_nofill==false){
                    for(let y=0;y<syV;y++){
                        if(this.maps[origin[0]+y][origin[1]+sxV]==0 || this.maps[origin[0]+y][origin[1]+sxV]==undefined)_nofill=true;
                    }
                    if(_nofill==false)sxV++;
                }
                
                var sx, sy;
                if(sxV*syV<=sxH*syH){
                    sx=sxH;
                    sy=syH;
                }else{
                    sx=sxV;
                    sy=syV;
                }

                // core.rects.push(new Rect(origin[1]-1,origin[0]-1,sx,sy));
                core.addRect(origin[1]-1,origin[0]-1,sx,sy);
                //this.mapsに選択範囲を適用（1未選択→2選択済み）
                for(let _sy=0;_sy<sy;_sy++){
                    for(let _sx=0;_sx<sx;_sx++){
                        this.maps[origin[0]+_sy][origin[1]+_sx]=2;
                    }
                }
            }
        }
        overlayMsg.set("自動トレース->完了")
        SetSource();
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

class RGB{
    constructor(_r,_g,_b){
        this.r=_r;
        this.g=_g;
        this.b=_b;
    }
    static gammaFix(c){
        return Math.round((c^2.2)/(255^2.2)*c);
    }
}

function easeOutExpo(x){
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    }

class Layer{
    constructor(){
        this.name="新規レイヤー";
        this.id=null;
        this.rects=new Array();
        this.r=255;
        this.g=255;
        this.b=255;
        this.visible=true;
        this.addOffsetX=false;
        this.addOffsetY=false;
    }
    setColorFromHex(hex){
        this.r=parseInt(hex.slice(1,3),16);
        this.g=parseInt(hex.slice(3,5),16);
        this.b=parseInt(hex.slice(5,7),16);
    }
    getHex(){
        return `#${hex(this.r,2)}${hex(this.g,2)}${hex(this.b,2)}`;
    }
}