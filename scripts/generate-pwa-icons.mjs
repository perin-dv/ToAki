/**
 * Generates small, square PWA icon PNGs with zero third-party dependencies.
 * The approved toAki logo remains unchanged at public/logo-toaki.webp.
 * This square app-icon is an app-shortcut mark (pin + delivery truck).
 */
import {writeFileSync,mkdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,join} from "node:path";
import {deflateSync} from "node:zlib";

const root=join(dirname(fileURLToPath(import.meta.url)),"..");
const iconDir=join(root,"public","icons");
mkdirSync(iconDir,{recursive:true});
const crcTable=new Uint32Array(256);
for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crcTable[n]=c>>>0;}
function crc32(b){let c=0xffffffff;for(const x of b)c=crcTable[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const payload=Buffer.concat([Buffer.from(type),data]);const sum=Buffer.alloc(4);sum.writeUInt32BE(crc32(payload));return Buffer.concat([len,payload,sum]);}
function pngFile(size){
  const image=new Uint8Array(size*size*4);
  const mix=(x,y,color,alpha=1)=>{
    if(x<0||y<0||x>=size||y>=size)return;
    const a=(y*size+x)*4;const p=alpha;
    image[a]=Math.round(image[a]*(1-p)+color[0]*p);
    image[a+1]=Math.round(image[a+1]*(1-p)+color[1]*p);
    image[a+2]=Math.round(image[a+2]*(1-p)+color[2]*p);
    image[a+3]=255;
  };
  const v=(x,y)=>[Math.floor(x*size),Math.floor(y*size)];
  const shape=(inside,color,bounds)=>{
    const [x0,y0,x1,y1]=bounds;
    for(let y=Math.max(0,Math.floor(y0*size));y<Math.min(size,Math.ceil(y1*size));y++)for(let x=Math.max(0,Math.floor(x0*size));x<Math.min(size,Math.ceil(x1*size));x++){
      const nx=(x+.5)/size,ny=(y+.5)/size;
      if(inside(nx,ny))mix(x,y,color);
    }
  };
  const dark=[13,16,21],orange=[255,133,27],white=[250,251,252];
  const rounded=(x,y,w,h,r,c)=>shape((px,py)=>{
    const xx=Math.max(x+r,Math.min(x+w-r,px)),yy=Math.max(y+r,Math.min(y+h-r,py));
    return (px-xx)**2+(py-yy)**2<=r*r;
  },c,[x,y,x+w,y+h]);
  const circle=(x,y,r,c)=>shape((px,py)=>(px-x)**2+(py-y)**2<=r*r,c,[x-r,y-r,x+r,y+r]);
  const polygon=(points,c)=>shape((px,py)=>{
    let inside=false;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const [xi,yi]=points[i],[xj,yj]=points[j];
      if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside;
    }
    return inside;
  },c,[0,0,1,1]);
  rounded(0.03,0.03,.94,.94,.19,dark);
  // Orange map pin with white inset, stylized similarly to the brand.
  circle(.49,.405,.285,orange);
  polygon([[.215,.48],[.49,.837],[.765,.48]],orange);
  circle(.49,.397,.172,dark);
  // White truck silhouette inside the pin, drawn geometrically, not as text.
  rounded(.373,.36,.173,.094,.013,white);
  polygon([[.546,.379],[.599,.379],[.638,.43],[.638,.454],[.546,.454]],white);
  rounded(.562,.384,.031,.036,.005,dark);
  circle(.412,.466,.027,white);
  circle(.590,.466,.027,white);
  circle(.412,.466,.011,dark);
  circle(.590,.466,.011,dark);
  // Build PNG (RGBA color type 6, 8-bit)
  const rows=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++){
    const start=y*(size*4+1);rows[start]=0;
    rows.set(image.subarray(y*size*4,(y+1)*size*4),start+1);
  }
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
  const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ihdr),chunk("IDAT",deflateSync(rows,{level:9})),chunk("IEND",Buffer.alloc(0))]);
  writeFileSync(join(iconDir,"icon-"+size+".png"),png);
  console.log("Icone PWA gerado: "+size+"x"+size);
}
for(const size of [192,512])pngFile(size);
