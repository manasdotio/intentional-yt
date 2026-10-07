// Offline frame rendering. External Playwright + FFmpeg; no extension dependencies.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.IYT_PLAYWRIGHT_MODULE || 'playwright');
const ffmpeg=process.env.IYT_FFMPEG || 'ffmpeg';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'marketing/video');fs.mkdirSync(out,{recursive:true});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'iyt-video-'));
// Original synthesized score: rhythmic plucks settle into a warm sustained chord.
const rate=48000,duration=15,n=rate*duration,samples=new Float64Array(n);
const add=(start,length,fn)=>{for(let j=0;j<length*rate&&Math.round(start*rate)+j<n;j++){samples[Math.round(start*rate)+j]+=fn(j/rate)}};
for(let beat=0;beat<32;beat++){
  const start=beat*.3125,f=[220,329.63,440,554.37,659.25,440,329.63,277.18][beat%8];
  add(start,.8,t=>Math.sin(2*Math.PI*f*t)*Math.exp(-t*8)*Math.min(1,t*140)*(start<4?.12:.06));
}
for(const start of [4,7,10])for(const f of [110,164.815,220,277.185,329.625])add(start,4.5,t=>.026*(Math.sin(2*Math.PI*f*t)+.16*Math.sin(4*Math.PI*f*t))*Math.min(1,t/1.2)*Math.max(0,1-t/4.5));
for(const start of [4.4,5.15,6.25,10.1])add(start,.23,t=>.11*Math.sin(2*Math.PI*(1000*t-900*t*t))*Math.exp(-t*22)*Math.min(1,t*300));
let seed=42;for(const start of [3.5,9.4])add(start,.7,t=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return (seed/4294967296-.5)*.035*Math.sin(Math.PI*t/.7)**2});
const peak=Math.max(...Array.from({length:150},(_,j)=>{let p=0;for(let i=j*4800;i<(j+1)*4800;i++)p=Math.max(p,Math.abs(samples[i]));return p}));
const wav=Buffer.alloc(44+n*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*4,40);
for(let i=0;i<n;i++){const fade=Math.min(1,i/(rate*.08),(n-1-i)/(rate*1.1));const v=Math.round(samples[i]/peak*.65*fade*32767);wav.writeInt16LE(v,44+i*4);wav.writeInt16LE(v,46+i*4)}
const audio=path.join(temp,'score.wav');fs.writeFileSync(audio,wav);
const output=path.join(out,'intentional-yt-promo-15s.mp4');
const encoder=spawn(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate','30','-i','pipe:0','-i',audio,'-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-t','15','-movflags','+faststart',output],{stdio:['pipe','ignore','pipe']});
let errors='';encoder.stderr.on('data',d=>{errors+=d;process.stderr.write(d)});encoder.stdin.on('error',e=>console.error('Encoder input:',e.message,errors));const done=once(encoder,'close');
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 await page.goto(pathToFileURL(path.join(root,'marketing/promo-animation.html')).href+'?render');await page.evaluate(()=>window.ready);
 const previews=[];
 for(let i=0;i<450;i++){
  await page.evaluate(t=>window.draw(t),i/30);
  const frame=await page.screenshot({type:'jpeg',quality:95});
  if(!encoder.stdin.write(frame))await once(encoder.stdin,'drain');
  if([45,165,255,390].includes(i)){const file=path.join(out,`frame-${i}.jpg`);fs.writeFileSync(file,frame);previews.push(await sharp(frame).resize(768,432).toBuffer())}
  if(i%60===0)console.log(`Rendered ${i}/450 frames`);
 }
 encoder.stdin.end();const [code]=await done;assert.equal(code,0,errors);
 await sharp({create:{width:1536,height:864,channels:3,background:'#f7f8f3'}}).composite(previews.map((input,i)=>({input,left:(i%2)*768,top:Math.floor(i/2)*432}))).jpeg({quality:90}).toFile(path.join(out,'storyboard.jpg'));
 const info=spawnSync(ffmpeg,['-hide_banner','-i',output,'-f','null','-'],{encoding:'utf8'});assert.equal(info.status,0,info.stderr);assert.match(info.stderr,/1920x1080/);assert.match(info.stderr,/30 fps/);assert.match(info.stderr,/00:00:15\.00/);assert.match(info.stderr,/Audio: aac/);console.log(info.stderr);console.log('Saved and verified:',output);
}finally{await browser.close();if(encoder.exitCode===null)encoder.kill()}
