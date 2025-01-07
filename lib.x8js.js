
/*  
_     _     _      _      _      _      _     _       _      _

 ___    ___ ________         ___      ________      
|\  \  /  /|\   __  \       |\  \    /\   ____\     
\ \  \/  / | \  \|\  \      \ \  \\  \ \  \_____    
 \ \    / / \ \   __  \   ___\ \  \\  \ \_____. \   
  /     \/   \ \  \|\  \ | \  \\_\  \  \ `_____\ \  
 /  /\   \    \ \_______\ \ \________\  \| \______\
/__/ /\ __\    \|_______|  \|________|   \/______|
|__|/ \|__|                            
                                               
                                               
_     _     _      _      _      _      _     _       _      _
 
 
*/
class x8js {
    constructor() {
        this.count = 999;
        this.objects = {}; 
        this.textObjects = [];
        this.speed = 1;
        this.tilesize = 32;
        this.visibleobjects = {};
        this.assetstextures = {};
        this.backgrounds = {};
        this.gravityEnabled = {};
        this.collisionsEnabled = {};
        this.tileMap = {};
        this.clickListeners = {};
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.loopId = null;
        this.ticks = 0;
        this.ctx.imageSmoothingEnabled = this.smoothing || false;
        document.body.appendChild(this.canvas);
        this.scrollX = 0;
        this.scrollY = 0;
        this.zoomScale = 1;
        this.isMoving = false;
        this.groups = {};
        this.startTime = null;
        
        this.db = null;
        this.dbInitialized = this.initDB(); 
    }
 
      calculateAngle(x, y, x2, y2) {
        const deltaY = y2 - y;
        const deltaX = x2 - x;
        return Math.atan2(deltaY, deltaX);
    }
      calculateDistance(x, y, x2, y2) {
        const deltaX = x2 - x;
        const deltaY = y2 - y;
        return Math.sqrt(deltaX ** 2 + deltaY ** 2);
    }
      toggle(variable) {
        if (typeof variable === 'boolean') {
            return !variable; 
        } else if (typeof variable === 'number') {
            return variable > 0 ? 0 : 1; 
        } else {
            throw new Error("Unsupported type for toggle. Use boolean or number.");
        }
    }


 

    async initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("x8jsDB", 1);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                db.createObjectStore("saves", { keyPath: "slot" });
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(); 
            };

            request.onerror = (event) => {
                console.error("Database error: ", event.target.error);
                reject(event.target.error); 
            };
        });
    }

    async waitForDB() {
        await this.dbInitialized; 
    }

    async saveDB(slot, variables) {
        await this.waitForDB(); 

        const data = {};
        for (const variable of variables) {
            data[variable] = JSON.stringify(eval(variable))
        }

        const transaction = this.db.transaction(["saves"], "readwrite");
        const store = transaction.objectStore("saves");
        store.put({ slot, ...data });

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(event.target.error);
        });
    }

    async loadDB(slot) {
        await this.waitForDB(); 

        const transaction = this.db.transaction(["saves"], "readonly");
        const store = transaction.objectStore("saves");
        const request = store.get(slot);

        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                const data = event.target.result;
                if (data) {
                    for (const key in data) {
                        if (key !== "slot") {
                          
                          if(data[key]!==undefined){
                            eval(`${key}=${(data[key])};`)
                        }}
                        
                    }
                    resolve();
                } else {
                    reject(new Error("No data found for slot " + slot));
                }
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    setMapsize(size) {
  this.tilesize=size
    }
    
    createTile({ x, y, w , h, translateX = 0, translateY = 0, Zlayer = 0, tilenames = [], texture, color , opacity}) {
      if(!w){
        w=this.tilesize; h=this.tilesize;
      }
      const tile = { w, h, translateX, translateY, Zlayer, texture, color,tilenames, opacity };
      const key = `${x},${y}`;

      if (!this.tileMap[key]) {
        this.tileMap[key] = [];
      }

      this.tileMap[key].push(tile);
    }
    
 editTiles(name, { onx, ony, w, h, names, opacity, color, texture, addw, addh, addx = 0, addy = 0, addopacity, tx, ty } = {}) {
    
    const updateTiles = (tiles) => {
        return tiles.map(tile => {
            if (tile.tilenames.includes(name)) {
                const newTile = {
                    ...tile,
                    w: w !== undefined ? w : tile.w + (addw || 0),
                    h: h !== undefined ? h : tile.h + (addh || 0),
                    translateX: tile.translateX + (tx || 0),
                    translateY: tile.translateY + (ty || 0),
                    opacity: opacity !== undefined ? opacity : tile.opacity + (addopacity || 0),
                    color: color !== undefined ? color : tile.color,
                    texture: texture !== undefined ? texture : tile.texture,
                    tilenames: names || tile.tilenames
                };

                return newTile;
            }
            return tile;
        });
    };

    if (onx !== undefined && ony !== undefined) {
        
        const key = `${onx},${ony}`;
        if (this.tileMap[key]) {
            const updatedTiles = updateTiles(this.tileMap[key]);
            
            this.tileMap[`${onx + addx},${ony + addy}`] = updatedTiles;
            delete this.tileMap[key]; 
        }
    } else {
        
       if(!addx&&!addy){
        for (const key in this.tileMap) {
       this.tileMap[key] = updateTiles(this.tileMap[key]);
       }}else{
        for (const key in this.tileMap) {
            const updatedTiles = updateTiles(this.tileMap[key]);
            
            const [x, y] = key.split(',').map(Number);
            this.tileMap[`${x + addx||0},${y + addy||0}`] = updatedTiles;
            delete this.tileMap[key]; 
      }}
    }
}
getVisibleTiles() {
    const visibleTiles = [];
    const startX = Math.floor((-this.scrollX) / this.tilesize);
    const endX = Math.ceil((-this.scrollX + this.canvas.width) / this.tilesize);
    const startY = Math.floor((-this.scrollY) / this.tilesize);
    const endY = Math.ceil((-this.scrollY + this.canvas.height) / this.tilesize);

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            const key = `${x},${y}`;
            if (this.tileMap[key]) {
                visibleTiles.push(...this.tileMap[key]);
            }
        }
    }
    return visibleTiles;
}

isVisibleOBJ(offsetoffscreen,obj){
const drawX = tile.x - this.scrollX;
const drawY = tile.y - this.scrollY;
return drawX + tile.w > -offsetoffscreen &&
    drawX < this.canvas.width + offsetoffscreen &&
    drawY + tile.h > -offsetoffscreen &&
    drawY < this.canvas.height + offsetoffscreen;
}
isVisibleTile(offsetoffscreen, tile) {
    const drawX = tile.x*this.tilesize - this.scrollX;
    const drawY = tile.y*this.tilesize - this.scrollY;
    return drawX + tile.w > -offsetoffscreen &&
           drawX < this.canvas.width + offsetoffscreen &&
           drawY + tile.h > -offsetoffscreen &&
           drawY < this.canvas.height + offsetoffscreen;
}

getNameFromOBJ(index, obj) {
    return obj.names[index] || null; 
}

getNameFromTile(index, tile) {
    return tile.tilenames[index] || null; 
}

getTilesInArea({ includename = [], x, y, x2, y2} = {}) {
    const result = [];
    for (let i = x; i <= (x2 || x); i++) {
        for (let j = y; j <= (y2 || y); j++) {
            const key = `${i},${j}`;
            if (this.tileMap[key]) {
                const tiles = this.tileMap[key];
                for (const tile of tiles) {
                    if (includename.length === 0 || includename.some(name => tile.tilenames.includes(name))) {
                        result.push(tile);
                    }
                }
            }
        }
    }
    return result;
}
getTiles(name) {
    const result = [];
    for (const key in this.tileMap) {
        const tiles = this.tileMap[key];
        for (const tile of tiles) {
            if (tile.tilenames.includes(name)) {
                result.push(tile);
            }
        }
    }
    return result;
}

    isColliding(obj01, obj02, marginX, marginYTop, marginYBottom) {
    let objs = this.objects[obj02];
    let obj1 = this.objects[obj01][0];
    if(!obj1){
      console.warn(`cannot execute no obj01 found: ${obj01}`);
      return;
    }

    
    const marginyb = marginYTop;
    const marginyt = marginYBottom;
    const marginx = marginX;
    
    if(objs){
    for (const obj2 of objs) {
        if ( obj2.names.includes(obj02) &&
            obj1.x < obj2.x + obj2.w + marginx &&
            obj1.x + obj1.w > obj2.x - marginx &&
            obj1.y < obj2.y + obj2.h + marginyt &&
            obj1.y + obj1.h > obj2.y - marginyb
        ) {
            return true; 
        }
    }}
    
    
    const startX = Math.floor((-this.scrollX) / this.tilesize);
    const endX = Math.ceil((-this.scrollX + this.canvas.width) / this.tilesize);
    const startY = Math.floor((-this.scrollY) / this.tilesize);
    const endY = Math.ceil((-this.scrollY + this.canvas.height) / this.tilesize);
    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            const key = `${x},${y}`;
            if (this.tileMap[key]) {
                for (const tile of this.tileMap[key]) {
                    const collisionTile = {
                        x: x * this.tilesize + tile.translateX,
                        y: y * this.tilesize + tile.translateY,
                        w: tile.w,
                        h: tile.h
                    };
                    
                    if ( tile.tilenames.includes(obj02) &&
                        obj1.x < collisionTile.x + collisionTile.w + marginx &&
                        obj1.x + obj1.w > collisionTile.x - marginx &&
                        obj1.y < collisionTile.y + collisionTile.h + marginyt &&
                        obj1.y + obj1.h > collisionTile.y - marginyb
                    ) {
                        return true; 
                    }
                }
            }
        }
    }
    return false; 
}


#resolveCollisionWithTILESNAME(obj, type, power) {
    const startX = Math.floor((-this.scrollX) / this.tilesize);
    const endX = Math.ceil((-this.scrollX + this.canvas.width) / this.tilesize);
    const startY = Math.floor((-this.scrollY) / this.tilesize);
    const endY = Math.ceil((-this.scrollY + this.canvas.height) / this.tilesize);

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            const key = `${x},${y}`;
            if (this.tileMap[key]) {
                this.tileMap[key].forEach(tile => { if(tile.tilenames.includes(type)){
                    const collisionObj = {
                        x: x * this.tilesize + tile.translateX,
                        y: y * this.tilesize + tile.translateY,
                        w: tile.w,
                        h: tile.h
                    };

                    if (this.checkCollision(obj, collisionObj)) {
                        
                        const overlapYBottom = (obj.y + obj.h ) - collisionObj.y;
                        const overlapYTop = obj.y - (collisionObj.y + collisionObj.h );
                        const overlapXRight = (obj.x + obj.w -1) - collisionObj.x; 
                        const overlapXLeft = obj.x- (collisionObj.x + collisionObj.w);

                        const collisionDepths = {
                            top: Math.abs(overlapYTop),
                            bottom: Math.abs(overlapYBottom),
                            left: Math.abs(overlapXLeft),
                            right: Math.abs(overlapXRight)
                        };

                        const minDepth = Math.min(collisionDepths.top, collisionDepths.bottom, collisionDepths.left, collisionDepths.right);

                        
if (minDepth === collisionDepths.left) {
  obj.x -= overlapXLeft; 
  if (this.gravityEnabled[obj.key]) {
    this.gravityEnabled[obj.key].velocityX = 0;
  }
}else if (minDepth === collisionDepths.right) {
  obj.x -= overlapXRight; 
  if (this.gravityEnabled[obj.key]) {
    this.gravityEnabled[obj.key].velocityX = 0;
  }
}else if (minDepth === collisionDepths.top) {
  obj.y -= overlapYTop; 
}else  if (minDepth === collisionDepths.bottom) {
                            obj.y -= overlapYBottom; 
                            if(this.gravityEnabled[obj.key]){
                            this.gravityEnabled[obj.key].velocityY = 0;
                            }
                        }    
                    }}
                });
            }
        }
    }
}








    
    removeTileNames(x, y, name) {
      const key = `${x},${y}`;
      if (this.tileMap[key]) {
        this.tileMap[key] = this.tileMap[key].filter(tile => !tile.tilenames.includes(name));
        if (this.tileMap[key].length === 0) {
          delete this.tileMap[key]; 
        }
      }
    }
removeTilePosition(x, y, translateX, translateY, name) {
  const key = `${x},${y}`;
  if (this.tileMap[key]) {
    this.tileMap[key] = this.tileMap[key].filter(tile => 
      !(tile.tilenames.includes(name) && tile.translateX === translateX && tile.translateY === translateY)
    );
    if (this.tileMap[key].length === 0) {
      delete this.tileMap[key];
    }
  }
}

    
 isTileWithName(x, y, name) {
  const key = `${x},${y}`;
  if (this.tileMap[key]) {
    let rf=0
     this.tileMap[key].filter(tile => {
       let t =tile.tilenames
      if (t.includes(name)) {
        rf=1
      }
    });
    if(rf==1){
      return true;
    }
  }
  return false;
}
    returnTilesName(x, y, name) {
      const key = `${x},${y}`;
if (this.tileMap[key]) {
  let rf = 0
  this.tileMap[key].filter(tile => {
    let t = tile.tilenames
    if (t.includes(name)) {
      rf = t
    }
  });
  if (rf !== 0) {
    return t;
  }
}
return false;
 }
    
returnTilesNameTranslate(x, y, name, translateX, translateY) {
  const key = `${x},${y}`;
if (this.tileMap[key]) {
  return this.tileMap[key] = this.tileMap[key].filter(tile =>
    !(tile.tilenames.includes(name) && tile.translateX === translateX && tile.translateY === translateY)
  );
}
 return false;
}

isTilesNameTranslate(x, y, name, translateX, translateY) {
  const key = `${x},${y}`;
  if (this.tileMap[key]) {
    this.tileMap[key] = this.tileMap[key].filter(tile => 
      !(tile.tilenames.includes(name) && tile.translateX === translateX && tile.translateY === translateY)
    );
    if (this.tileMap[key].length === 0) {
      return true;
    }
  }
  return false;
}


drawTiles() {
}


scrollBy(x, y) {
 this.scrollX += x;
 this.scrollY += y;
}

scrollTo(x, y) {
 this.scrollX = x;
 this.scrollY = y;
}

MoveBy(name, { x = 0, y = 0, noclip = false }) {
 const objs = this.objects[name];
 if (objs) {
  
  objs.forEach(obj => {
   if (this.isObjectVisible(obj) ){
   let step=1
   console.log(x)
   if((x!==0) && (x<y|| (y==0) )){step=Math.abs(Math.floor(x/1)); this.speed=x } else if( x >y&& x<0) {step=Math.abs(Math.floor(x/1)); this.speed=x } else {step=Math.abs(Math.floor(y/1)); this.speed=y;}
   

   let stepX=x/step
   let stepY=y/step 
   console.log(step)
   for(let i=0;i<step;i++){


   if (this.collisionsEnabled[name] && !noclip) {
    const { collisions } = this.collisionsEnabled[name];
    
    collisions.forEach(collisionName => {
     this.#resolveCollisionWithTILESNAME(obj, collisionName, 0.2);
     const collisionObjs = this.objects[collisionName];
     
     if (collisionObjs) {
      collisionObjs.forEach(collisionObj => {
       
            
                    

        if (this.checkCollision(obj, collisionObj)) {
          
          const overlapYBottom = (obj.y + obj.h - 0) - collisionObj.y;
          const overlapYTop = obj.y - (collisionObj.y + collisionObj.h);
          const overlapXRight = (obj.x + obj.w) - collisionObj.x;
          const overlapXLeft = obj.x - (collisionObj.x + collisionObj.w);

          const collisionDepths = {
            top: Math.abs(overlapYTop),
            bottom: Math.abs(overlapYBottom),
            left: Math.abs(overlapXLeft),
            right: Math.abs(overlapXRight)
          };

          const minDepth = Math.min(collisionDepths.top, collisionDepths.bottom, collisionDepths.left, collisionDepths.right);

          
          if (minDepth === collisionDepths.top) {
            obj.y -= overlapYTop; 
          } else if (minDepth === collisionDepths.bottom) {
            obj.y -= overlapYBottom; 
            if (this.gravityEnabled[obj.key]) {
              this.gravityEnabled[obj.key].velocityY = 0;
            }
          } else if (minDepth === collisionDepths.left) {
            obj.x -= overlapXLeft; 
            if (this.gravityEnabled[obj.key]) {
              this.gravityEnabled[obj.key].velocityX = 0;
            }
          } else if (minDepth === collisionDepths.right) {
            obj.x -= overlapXRight; 
            if (this.gravityEnabled[obj.key]) {
              this.gravityEnabled[obj.key].velocityX = 0;
            }
          }
        }
      });
     }

    })
    
   }    obj.x += stepX;
   obj.y += stepY;

   }
   
 } });
 } else {
  console.warn(`No objects found with name: ${name}`);
 }
}


createOBJ({ x, y, w, h, texture, names, color, layer=0 , abovetiles=0 }) {
 const obj = { x, y, w, h, texture, names, color, layer };
 names.forEach(name => {
  if (!this.objects[name]) {
   this.objects[name] = [];
  }
  this.objects[name].push(obj);
 });
}
removeTexts(names) {
    this.textObjects = this.textObjects.filter(textObj => {
        return !textObj.names.includes(names); 
    });
}
createText({ x, y, innerText="helloWorld!", color="grey",  abovetiles = 0, names ,fontstyle}) {
    const textObject = {
        x,
        y,
        innerText,
        color,
        abovetiles,
        fontstyle,
        names
    };
    
    
    if (!this.textObjects) {
        this.textObjects = [];
    }
    
    this.textObjects.push(textObject);
}


#objdraw(obj2) {
  let obj = obj2
  const texture = this.assetstextures[obj.texture];

  const now = Date.now();
  if (texture) {
    if (now - texture.lastUpdate > (1000 / texture.speed)) {
      texture.currentIndex = (texture.currentIndex + 1) % texture.imgs.length;
      texture.lastUpdate = now;
    }
  }

  if (obj.color) {
    this.ctx.fillStyle = obj.color; 
    this.ctx.fillRect(obj.x + this.scrollX, obj.y + this.scrollY, obj.w, obj.h);
  } else {
    if (texture) {
      this.ctx.drawImage(texture.imgs[texture.currentIndex], obj.x + this.scrollX, obj.y + this.scrollY, obj.w, obj.h);
    }
  }

}
#gravity(obj){
  if (this.gravityEnabled[obj.key]) {
  const { mass, gravity, velocityY, velocityX, angle } = this.gravityEnabled[obj.key];
  const angleInRadians = angle * (Math.PI / 180);
  const gravityX = Math.cos(angleInRadians) * gravity * mass;
  const gravityY = Math.sin(angleInRadians) * gravity * mass;
  this.gravityEnabled[obj.key].velocityX += gravityX;
  this.gravityEnabled[obj.key].velocityY += gravityY;
  obj.x += this.gravityEnabled[obj.key].velocityX;
  obj.y += this.gravityEnabled[obj.key].velocityY 
   
  
  let x = this.gravityEnabled[obj.key].velocityX
  let y = this.gravityEnabled[obj.key].velocityY

}


if (this.collisionsEnabled[obj.key] && this.gravityEnabled[obj.key]) {
  const { collisions, addradius } = this.collisionsEnabled[obj.key];

  collisions.forEach(collisionName => {
    this.#resolveCollisionWithTILESNAME(obj, collisionName, 1);
    const collisionObjs = this.objects[collisionName];
    if (collisionObjs) {
      collisionObjs.forEach(obj => {
   if (this.isObjectVisible(obj) ){
   let step=1
   console.log(x)
   if((x!==0) && (x<y|| (y==0) )){step=Math.abs(Math.floor(x/1)); this.speed=x } else if( x >y&& x<0) {step=Math.abs(Math.floor(x/1)); this.speed=x } else {step=Math.abs(Math.floor(y/1)); this.speed=y;}
   

   let stepX=x/step
   let stepY=y/step 
   console.log(step)
   for(let i=0;i<step;i++){


   if (this.collisionsEnabled[name] && !noclip) {
    const { collisions } = this.collisionsEnabled[name];
    
    collisions.forEach(collisionName => {
     this.#resolveCollisionWithTILESNAME(obj, collisionName, 0.2);
     const collisionObjs = this.objects[collisionName];
     
     if (collisionObjs) {
      collisionObjs.forEach(collisionObj => {
       
            
                    

        if (this.checkCollision(obj, collisionObj)) {
          
          const overlapYBottom = (obj.y + obj.h - 0) - collisionObj.y;
          const overlapYTop = obj.y - (collisionObj.y + collisionObj.h);
          const overlapXRight = (obj.x + obj.w) - collisionObj.x;
          const overlapXLeft = obj.x - (collisionObj.x + collisionObj.w);

          const collisionDepths = {
            top: Math.abs(overlapYTop),
            bottom: Math.abs(overlapYBottom),
            left: Math.abs(overlapXLeft),
            right: Math.abs(overlapXRight)
          };

          const minDepth = Math.min(collisionDepths.top, collisionDepths.bottom, collisionDepths.left, collisionDepths.right);

          
          if (minDepth === collisionDepths.top) {
            obj.y -= overlapYTop; 
          } else if (minDepth === collisionDepths.bottom) {
            obj.y -= overlapYBottom; 
            if (this.gravityEnabled[obj.key]) {
              this.gravityEnabled[obj.key].velocityY = 0;
            }
          } else if (minDepth === collisionDepths.left) {
            obj.x -= overlapXLeft; 
            if (this.gravityEnabled[obj.key]) {
              this.gravityEnabled[obj.key].velocityX = 0;
            }
          } else if (minDepth === collisionDepths.right) {
            obj.x -= overlapXRight; 
            if (this.gravityEnabled[obj.key]) {
              this.gravityEnabled[obj.key].velocityX = 0;
            }
          }
        }
      });
     }

    })
    
   }    obj.x += stepX;
   obj.y += stepY;

   }
   
 } });
    }
  });
}
}

#DRAWoverlapingBG({ w, h, texture, Xscrollparam, Yscrollparam, bgpositionX = 0, bgpositionY = 0, visible, lockY = false, lockX = false }) {
    const textureImg = this.assetstextures[texture];
    if (!textureImg || !visible) return;
bgpositionY=bgpositionY/ this.zoomScale
bgpositionX=bgpositionX/ this.zoomScale
    const scaledW = w / this.zoomScale;
    const scaledH = h / this.zoomScale;

    let scrollX = (this.scrollX * Xscrollparam + bgpositionX) % scaledW;
    let scrollY;

    if (lockY) {
        scrollY = (bgpositionY + this.scrollY * Yscrollparam) % scaledH;
        const minScrollY = 0;
        const maxScrollY = (scaledH - this.canvas.height);
        
        if (  (bgpositionY + this.scrollY * Yscrollparam)  > (maxScrollY )) {
            scrollY = (maxScrollY);
        } else {
            scrollY = Math.max(minScrollY, Math.min(scrollY, maxScrollY));
        }
    } else {
        scrollY = (this.scrollY * Yscrollparam + bgpositionY) % scaledH;
    }

    if (lockX) {
        const minScrollX = 0;
        const maxScrollX = (scaledW - this.canvas.width);
       if (   (bgpositionX + this.scrollX * Xscrollparam)  > (maxScrollX)) {
          scrollX = (maxScrollX);
       } else {
         scrollX = Math.max(minScrollX, Math.min(scrollX, maxScrollX));
       }
    }

    const repeatX = Math.ceil(this.canvas.width / scaledW) + 1;
    const repeatY = Math.ceil(this.canvas.height / scaledH) + 1;

    for (let i = -1; i <= repeatX; i++) {
        for (let j = -1; j <= repeatY; j++) {
            const drawX = i * scaledW - scrollX;
            const drawY = j * scaledH - scrollY;
            this.ctx.drawImage(textureImg.imgs[textureImg.currentIndex], drawX, drawY, scaledW, scaledH);
        }
    }
}

createBG(name, { w, h, texture, Xscrollparam, Yscrollparam, bgpositionX = 0, bgpositionY = 0, visible, lockY = false, lockX = false }) {
    
    this.backgrounds[name] = { w, h, texture, Xscrollparam, Yscrollparam, bgpositionX, bgpositionY, visible, lockY, lockX };
}

removeBG(name) {
    delete this.backgrounds[name];
}


hideBg(name) {
    if (name === 'yourTextureName') {
        this.bgVisible = false;
    }
}

showBg(name) {
    if (name === 'yourTextureName') {
        this.bgVisible = true;
    }
}

init() {
    this.A1897F523SYS();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const scale = this.zoomScale;

    this.ctx.save(); 
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(Math.abs(scale), Math.abs(scale)); 
    this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
    
    for (const name in this.backgrounds) {
    const bg = this.backgrounds[name];
    this.#DRAWoverlapingBG({
        w: bg.w,
        h: bg.h,
        texture: bg.texture,
        Xscrollparam: bg.Xscrollparam,
        Yscrollparam: bg.Yscrollparam,
        bgpositionX: bg.bgpositionX || 0,
        bgpositionY: bg.bgpositionY || 0,
        visible: bg.visible,
        lockY: bg.lockY || false,
        lockX: bg.lockX || false,
    });
}
     

    if (this.textObjects) {
    for (const textObj of this.textObjects) {
        this.ctx.fillStyle = textObj.color || 'black'; 
        if (textObj.fontstyle) {
            if(isNaN(textObj.fontstyle)){
                const fontParts = textObj.fontstyle.split(' ');
                if (fontParts[1]) {
                    this.ctx.font = `${textObj.fontstyle}` 
                } else {
                    this.ctx.font = textObj.fontstyle+" Arial";
                }}else{
                    this.ctx.font = textObj.fontstyle+"px Arial";
                }
            } else {
                this.ctx.font = "20px Arial"; 
            }

        this.ctx.fillText(textObj.innerText, textObj.x + this.scrollX, textObj.y + this.scrollY);
    }
}
    let EveryObjects=[]
let visibleObjects=[]
let ObjectsAbove0layer=[]
    var allObjects = [];
    var allObjects2 = [];
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
   this.count+=1
if(this.count>0){
 this.count=0
 
 this.ds=0
 this.ds2=0
for (const key of Object.keys(this.objects)) {
 for (const obj of this.objects[key]) {
  if (this.isObjectVisible2(obj)) {
    if(obj.layer>=1){
      
    }else{
   obj.key = key; 
   visibleObjects.push(obj);
  }
    EveryObjects.push(obj);
  }
 }
}
allObjects.push(...visibleObjects);
allObjects2.push(...ObjectsAbove0layer);
 
    this.visibleobjects=allObjects
    this.visibleobjects2=allObjects2
}
    
    allObjects.sort((a, b) => {
        return (a.layer - b.layer) || (this.objects[a.names[0]].indexOf(a) - this.objects[b.names[0]].indexOf(b));
    });
    allObjects2.sort((a, b) => {
  return (a.layer - b.layer) || (this.objects[a.names[0]].indexOf(a) - this.objects[b.names[0]].indexOf(b));
   });
    if(this.visibleobjects){
   visibleObjects=this.visibleobjects
}


const startX = Math.floor((-this.scrollX - this.canvas.width) / this.tilesize);
    const endX = Math.ceil((-this.scrollX + this.canvas.width/Math.abs(this.zoomScale)) / this.tilesize);
    const startY = Math.floor((-this.scrollY - this.canvas.height) / this.tilesize);
    const endY = Math.ceil((-this.scrollY + this.canvas.height/Math.abs(this.zoomScale) ) / this.tilesize) ;

    const tilesAbove = [];
    const tilesBelow = [];

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            const key = `${x},${y}`;
            if (this.tileMap[key]) {
              
                this.tileMap[key].forEach(tile => {
                    if (tile.Zlayer >= 0) {
                        tilesAbove.push({ tile, x, y });
                    } else {
                        tilesBelow.push({ tile, x, y });
                    }
                });
            }
        }
    }
    tilesBelow.sort((a, b) => a.tile.Zlayer - b.tile.Zlayer);
    tilesAbove.sort((a, b) => a.tile.Zlayer - b.tile.Zlayer);

    tilesBelow.forEach(({ tile, x, y }) => {
        const drawX = x * this.tilesize + tile.translateX + this.scrollX;
        const drawY = y * this.tilesize + tile.translateY + this.scrollY;
if(tile.opacity){
  this.ctx.globalAlpha=tile.opacity
}
        if (tile.color) {
            this.ctx.fillStyle = tile.color;
            this.ctx.fillRect(drawX, drawY, tile.w+0.1, tile.h+0.1);
        } else if (tile.texture) {
            const texture = this.assetstextures[tile.texture];
            if (texture) {
                this.ctx.drawImage(texture.imgs[texture.currentIndex], drawX, drawY, tile.w+0.1, tile.h+0.1);
            }
        }
        this.ctx.globalAlpha=1
    });

  

    
    for (const obj of visibleObjects) { this.#objdraw(obj) }
    
    
    tilesAbove.forEach(({ tile, x, y }) => {
      const drawX = x * this.tilesize + tile.translateX + this.scrollX;
      const drawY = y * this.tilesize + tile.translateY + this.scrollY;
if (tile.opacity) {
  this.ctx.globalAlpha = tile.opacity
}
      if (tile.color) {
        this.ctx.fillStyle = tile.color;
        this.ctx.fillRect(drawX, drawY, tile.w+0.1, tile.h+0.1);
      } else if (tile.texture) {
        const texture = this.assetstextures[tile.texture];
        if (texture) {
          this.ctx.drawImage(texture.imgs[texture.currentIndex], drawX, drawY, tile.w+0.1, tile.h+0.1);
        }
      }
      this.ctx.globalAlpha=1
    });
    
    



for (const obj of EveryObjects) {
    if (obj.layer > 0) {
        this.#objdraw(obj); 
    }
    this.#gravity(obj); 
}

    this.ctx.restore(); 
}
 
applyCollisions(name, { collisions, addradius }) {
  this.collisionsEnabled[name] = { collisions, addradius };
}
removeCollisions(name) {
  delete this.collisionsEnabled[name];
}
applyGravity(name, { mass, gravity, angle = 90 }) {
  this.gravityEnabled[name] = { mass, gravity, velocityY: 0, velocityX: 0, angle };
}
removeGravity(name) {
  delete this.gravityEnabled[name];
}
checkCollision(obj1, obj2) {
  return (
    obj1.x < obj2.x + obj2.w &&
    obj1.x + obj1.w  > obj2.x+1&&
    obj1.y < obj2.y + obj2.h &&
    obj1.y + obj1.h > obj2.y
  );
}
    
    returnObjectsFromVisibleNames(name) {
        const objs = this.objects[name];
        return objs ? objs.filter(obj => this.isObjectVisible(obj)) : [];
    }

    isObjectVisible(obj) {
        return (
            obj.x + this.scrollX < this.canvas.width &&
            obj.x + this.scrollX  + obj.w > 0 &&
            obj.y + this.scrollY < this.canvas.height &&
            obj.y + this.scrollY  + obj.h > 0
        );
    }
isObjectVisible2(obj) {
 let offset = 1000
 return (
  obj.x + this.scrollX - offset < this.canvas.width &&
  obj.x + this.scrollX + obj.w + offset > 0 &&
  obj.y + this.scrollY - offset < this.canvas.height &&
  obj.y + this.scrollY + offset + obj.h > 0
 );
}
    isNamesVisible(name) {
        const objs = this.objects[name];
        return objs ? objs.some(obj => this.isObjectVisible(obj)) : false;
    }

     MoveTo(name, { x, y, noclip = false }) {
    const objs = this.objects[name]; 
    if (objs) {
        objs.forEach(obj => {
            obj.x = x; 
            obj.y = y;
        });
    } else {
        console.warn(`No objects found with name: ${name}`);
    }
}

    Collision(name, { collisions, addradius, execute: callback }) {
        if (!this.collisionCallbacks) {
            this.collisionCallbacks = {};
        }
        collisions.forEach(collisionName => {
            this.collisionCallbacks[`${name}-${collisionName}`] = callback;
        });
    }


    

    canvasOBJ({ w, h, bg, type, width, height, smoothing }) {
    
    const aspectRatio = w / h; 
    let newWidth, newHeight;

    
    if (type === "cover") {
        
        if (window.innerWidth / window.innerHeight > aspectRatio) {
            newHeight = window.innerHeight;
            newWidth = newHeight * aspectRatio;
        } else {
            newWidth = window.innerWidth;
            newHeight = newWidth / aspectRatio;
        }
    } else if (type === "stretch") {
        newWidth = parseInt(w);
        newHeight = parseInt(h);
        this.canvas.style.width = width;
        this.canvas.style.height = height;
    } else {
        newWidth = w;
        newHeight = h;
    }

    
    this.canvas.style.position = "absolute";
    this.canvas.style.left = "50vw";
    this.canvas.style.top = "50vh";
    this.canvas.style.transform = "translate(-50%,-50%)";
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.canvas.style.background = bg;

    this.smoothing = smoothing;
    this.ctx.imageSmoothingEnabled = this.smoothing || false;
    
    
}


returnObjectsFromNames(name) {
 return this.objects[name] || [];
}

    musics(musicObj) {
        this.music = {};
        for (const key in musicObj) {
            this.music[key] = new Audio(musicObj[key].source);
            this.music[key].loop = musicObj[key].loop;
        }
    }

    playaudio(key) {
        this.music[key]?.play();
    }

    stopaudio(key) {
        this.music[key]?.pause();
        this.music[key].currentTime = 0;
    }

    textures(textureObj) {
        this.assetstextures = {};
        for (const key in textureObj) {
            this.assetstextures[key] = {
                speed: textureObj[key].speed,
                imgs: textureObj[key].imgs.map(src => {
                    const img = new Image();
                    img.src = src;
                    return img;
                }),
                currentIndex: 0,
                lastUpdate: 0
            };
        }
    }

    
removeClicks(name) {
    const listener = this.clickListeners[name];
    if (listener) {
        this.canvas.removeEventListener('click', listener);
        this.canvas.removeEventListener('mousedown', listener);
        this.canvas.removeEventListener('touchstart', listener);
        delete this.clickListeners[name];
    }
}

handleClicks(nameOBJS, callback, TouchStart) {
    const listener = (e) => {
        e.preventDefault();
const rect = this.canvas.getBoundingClientRect();
let mouseX, mouseY;
if (TouchStart) {
    
    if (e.touches.length > 0) {
        
        const touch = e.touches[e.touches.length - 1]; 
        mouseX = touch.clientX - rect.left;
        mouseY = touch.clientY - rect.top;
    }
} else {
    mouseX = e.clientX - rect.left; 
    mouseY = e.clientY - rect.top; 
}

const scaleFactorX = this.canvas.width / rect.width;
const scaleFactorY = this.canvas.height / rect.height;

        
        const clickedX = ((((mouseX*scaleFactorX) / this.zoomScale) - this.scrollX) - ((this.canvas.width / 2) / this.zoomScale) + this.canvas.width / 2) ;
        const clickedY = ((((mouseY*scaleFactorY) / this.zoomScale) - this.scrollY) - ((this.canvas.height / 2) / this.zoomScale) + this.canvas.height / 2) ;





const objs = Object.values(this.objects).flat();
objs.forEach(obj => {
    if (obj.names.some(objName => objName.includes(nameOBJS))) {
        if (
            clickedX >= (obj.x) &&
            clickedX <= (obj.x + obj.w) &&
            clickedY >= (obj.y) &&
            clickedY <= (obj.y + obj.h)
        ) {
            eval(callback);
        }
    }
});


const startX = Math.floor((-this.scrollX - this.canvas.width) / this.tilesize);
const endX = Math.ceil((-this.scrollX + this.canvas.width / Math.abs(this.zoomScale)) / this.tilesize);
const startY = Math.floor((-this.scrollY - this.canvas.height) / this.tilesize);
const endY = Math.ceil((-this.scrollY + this.canvas.height / Math.abs(this.zoomScale)) / this.tilesize);

for (let x = startX; x <= endX; x++) {
    for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        if (this.tileMap[key]) {
            for (const tile of this.tileMap[key]) {
                if (tile.tilenames.includes(nameOBJS)) {
                    const tileX = x * this.tilesize + tile.translateX;
                    const tileY = y * this.tilesize + tile.translateY;

                    if (
                        clickedX >= tileX &&
                        clickedX <= tileX + tile.w &&
                        clickedY >= tileY &&
                        clickedY <= tileY + tile.h
                    ) {
                        eval(callback);
                    }
                }
            }
        }
    }
}
};
 
 if (TouchStart) {
    this.canvas.addEventListener('touchstart', listener);
} else {
    this.canvas.addEventListener('click', listener);
}
    this.clickListeners[nameOBJS] = listener; 
}

clickedPlace(name, callback, TouchStart) {
    const listener = (e) => {
        e.preventDefault();
        let mouseX, mouseY;
        const rect = this.canvas.getBoundingClientRect();

        if (TouchStart) {
            
            if (e.touches.length > 0) {
                
                const touch = e.touches[e.touches.length - 1]; 
                mouseX = touch.clientX - rect.left;
                mouseY = touch.clientY - rect.top;
            }
        } else {
            mouseX = e.clientX - rect.left; 
            mouseY = e.clientY - rect.top; 
        }
 
        const scaleFactorX = this.canvas.width / rect.width;
const scaleFactorY = this.canvas.height / rect.height;

        
        const clickedX = ((((mouseX*scaleFactorX) / this.zoomScale) - this.scrollX) - ((this.canvas.width / 2) / this.zoomScale) + this.canvas.width / 2) ;
        const clickedY = ((((mouseY*scaleFactorY) / this.zoomScale) - this.scrollY) - ((this.canvas.height / 2) / this.zoomScale) + this.canvas.height / 2) ;

        
        callback(clickedX, clickedY);
    };

    if (TouchStart) {
        this.canvas.addEventListener('touchstart', listener);
    } else {
        this.canvas.addEventListener('click', listener);
    }
    this.clickListeners[name] = listener; 
}







 


    editOBJs(name, { addw = 0, addh = 0, addx = 0, addy = 0, w, h, x, y , texture, color}) {
    const objs = this.objects[name]; 
    if (objs) {
        objs.forEach(obj => {
            if (w !== undefined) obj.w = w; 
            if (h !== undefined) obj.h = h;
            if (x !== undefined) obj.x = x;
            if (y !== undefined) obj.y = y;
            if (texture !== undefined) obj.texture=texture;
            if (color !== undefined) obj.color=color;
            obj.w += addw;
            obj.h += addh;
            obj.x += addx;
            obj.y += addy;
        });
    } else {
        console.warn(`No objects found with name: ${name}`);
    }
}


    FollowXY(name, { x, y, mindistance = 0, maxdistance = Infinity, speed }) {
 const obj = this.objects[name];
 if (!obj) return;

 const targetX = x;
 const targetY = y;

 const distance = Math.sqrt((targetX - obj.x) ** 2 + (targetY - obj.y) ** 2);
 if (distance < mindistance || distance > maxdistance) return;

 const dx = targetX - obj.x;
 const dy = targetY - obj.y;

 const angle = Math.atan2(dy, dx);
 const moveX = Math.cos(angle) * speed;
 const moveY = Math.sin(angle) * speed;

 obj.x += moveX;
 obj.y += moveY;
}


    FollowOBS(name, { name: targetName, mindistance = 0, maxdistance = Infinity, speed }) {
        const objs = this.objects[name]; 
        const targetObjs = this.objects[targetName]; 
        if (!objs || !targetObjs) return;

        targetObjs.forEach(target => {
            objs.forEach(obj => {
                const distance = Math.sqrt((target.x - obj.x) ** 2 + (target.y - obj.y) ** 2);
                if (distance >= mindistance && distance <= maxdistance) {
                    const dx = target.x - obj.x;
                    const dy = target.y - obj.y;

                    const angle = Math.atan2(dy, dx);
                    const moveX = Math.cos(angle) * speed;
                    const moveY = Math.sin(angle) * speed;

                    obj.x += moveX;
                    obj.y += moveY;
                }
            });
        });
    }



    GoBY(name, x, y, time) {
        const objs = this.objects[name];
        if (!objs) return;

        
        this.startTime = Date.now();
        this.isMoving = true;

        
        objs.forEach(obj => {
            const dx = x;
            const dy = y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = distance / time;

            
            obj.speedX = (dx / distance) * speed;
            obj.speedY = (dy / distance) * speed;
            obj.distanceRemaining = distance; 
        });
    }

    A1897F523SYS() {
        if (!this.isMoving) return;

        const currentTime = Date.now();
        const elapsed = (currentTime - this.startTime) / 1000;

        
        if (elapsed >= this.time) {
            this.isMoving = false; 
            return;
        }

        
        for (const key in this.objects) {
 const objs = this.objects[key];
 objs.forEach(obj => {
            if (obj.distanceRemaining > 0) {
                obj.x += obj.speedX;
                obj.y += obj.speedY;
                obj.distanceRemaining -= Math.sqrt(obj.speedX * obj.speedX + obj.speedY * obj.speedY);

                
                if (obj.distanceRemaining < 0) {
                    obj.distanceRemaining = 0;
                }
            }
        });
    }}

 

zoom(scale) {
        this.zoomScale = scale; 
     
         
     
}


    loop({ maxfps }, callback) {
        const frameDuration = 1000 / maxfps;
        const loop = () => {
            const start = performance.now();
            callback();
            this.init();
            const duration = performance.now() - start;
            const delay = Math.max(0, frameDuration - duration);
            this.loopId = setTimeout(loop, delay);
        };
        loop();
    }

    removeOBJs(name) {
        delete this.objects[name];
    }
     

    getDataPosition(x, y, radius) {
        const result = {};
        let index = 0;

        for (const name in this.objects) {
            const objs = this.objects[name];
            objs.forEach((obj) => {
                const dx = obj.x - x;
                const dy = obj.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= radius) {
                    result[index++] = { x: obj.x, y: obj.y, w: obj.w, h: obj.h , hidden_index : index, texture : obj.texture };
                }
            });
        }

        return result;
    }

    changeNamesFromIndex(index, names) {
        if (index < names.length) {
            const oldName = names[index];
            const newName = names[index + 1]; 
            if (this.objects[oldName]) {
                this.objects[newName] = this.objects[oldName];
                delete this.objects[oldName];
            }
        } else {
            console.warn('Index out of bounds');
        }
    }
    getDATA(name, index = 0) {
        const objs = this.objects[name];
        if (objs && objs.length > index) {
            const obj = objs[index];
            return {
                x: obj.x,
                y: obj.y,
                w: obj.w,
                h: obj.h,
                texture: obj.texture,
                names: obj.names,
                color: obj.color,
            };
        }
        console.warn(`No object found with name: ${name} at index: ${index}`);
        return null;
    }
createGroup(groupName, centerObjectName) {
 const centerObject = this.returnObjectsFromNames(centerObjectName);
 if (centerObject.length === 0) {
  console.warn(`No objects found with name: ${centerObjectName}`);
  return;
 }
 this.groups[groupName] = {
  center: centerObject[0], 
  members: [] 
 };
}
addAlltoGroup(objectName, groupName) {
        const objects = this.returnObjectsFromNames(objectName);
        if (!this.groups[groupName]) {
            console.warn(`Group not found: ${groupName}`);
            return;
        }
        this.groups[groupName].members.push(...objects);
    }
MoveGroupBy(groupName, x, y) {
        const group = this.groups[groupName];
        if (!group) {
            console.warn(`Group not found: ${groupName}`);
            return;
        }
        group.center.x += x;
        group.center.y += y;
        group.members.forEach(member => {
            member.x += x;
            member.y += y;
        });
    }
MoveGroupTo(groupName, x, y) {
        const group = this.groups[groupName];
        if (!group) {
            console.warn(`Group not found: ${groupName}`);
            return;
        }
        const deltaX = x - group.center.x;
        const deltaY = y - group.center.y;
        group.center.x = x;
        group.center.y = y;
        group.members.forEach(member => {
            member.x += deltaX;
            member.y += deltaY;
        });
    }
    RemoveGroup(groupName) {
        if (!this.groups[groupName]) {
            console.warn(`Group not found: ${groupName}`);
            return;
        }
        delete this.groups[groupName];
    }



    
}




class x8gui {
    constructor() {
        this.btnpressing = false;
        this.fpsDisplayed = false;
        this.fps = 0;
        this.frameCount = 0; 
        this.lastFrameTime = performance.now();
        this.fpsInterval = 1000; 
        this.lastFpsUpdate = performance.now(); 
    }

    showFPS(bool) {
        this.fpsDisplayed = bool;
        if (this.fpsDisplayed) {
            this.trackFPS();
        }
    }

    trackFPS() {
        const updateFPS = () => {
            const now = performance.now();
            const deltaTime = now - this.lastFrameTime; 
            this.lastFrameTime = now;
            this.frameCount++; 

            
            if (now - this.lastFpsUpdate >= this.fpsInterval) {
                this.fps = Math.round((this.frameCount / (this.fpsInterval / 1000))); 
                this.lastFpsUpdate = now; 
                this.frameCount = 0; 

                const fpsDisplay = document.getElementById('fpsDisplay');
                if (!fpsDisplay) {
                    const fpsDiv = document.createElement('div');
                    fpsDiv.id = 'fpsDisplay';
                    fpsDiv.style.position = 'absolute';
                    fpsDiv.style.top = '0';
                    fpsDiv.style.left = '0';
                    fpsDiv.style.color = 'white';
                    fpsDiv.style.zIndex = '1000';
                    document.body.appendChild(fpsDiv);
                }
                document.getElementById('fpsDisplay').innerText = `FPS: ${this.fps}`;
            }

            requestAnimationFrame(updateFPS);
        };
        updateFPS();
    }

    isPressing2() {
        return this.btnpressing;
    }

    isClicked(selector, evaluate) {
    const button = document.querySelector(selector);
    if (button) {
        const handleClick = () => {
             
                evaluate()
            
        };

        button.addEventListener('mousedown', (event) => {
  event.preventDefault(); 
  handleClick();
});
        button.addEventListener('touchstart', (event) => {
            event.preventDefault(); 
            handleClick();
        });
    }
}


    createHtmlAFTER(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div);
    }

    createHtmlBEFORE(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.insertBefore(div, document.body.firstChild);
    }

    isPressing(selector, variable) {
        const button = document.querySelector(selector);
        if (button) {
            button.addEventListener('mousedown', (event) => {
                event.preventDefault();
                eval(`${variable} = true;`);
            });

            button.addEventListener('touchstart', (event) => {
                event.preventDefault();
                eval(`${variable} = true;`);
            });

            button.addEventListener('mouseup', (event) => {
              event.preventDefault();
                eval(`${variable} = false;`);
            });

            button.addEventListener('touchend', (event) => {
              event.preventDefault();
                eval(`${variable} = false;`);
            });

            
            button.addEventListener('touchcancel', (event) => {
              event.preventDefault();
                eval(`${variable} = false;`);
            });
        }
    }

    KeyPress(keys, variable) {
        const keyArray = keys.split(" ");
        keyArray.forEach(key => {
            window.addEventListener('keydown', (event) => {
                if (event.key === key) {
                    eval(`${variable} = true;`);
                }
            });

            window.addEventListener('keyup', (event) => {
                if (event.key === key) {
                    eval(`${variable} = false;`);
                }
            });
        });
    }

    KeyClick(key, callback) {
        window.addEventListener('keydown', (event) => {
            if (event.key === key) {
                callback();
            }
        });
    }
}
