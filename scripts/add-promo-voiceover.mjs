// Generates neural narration from public marketing copy and mixes it with the promo.
// External tooling only; no dependencies are added to the extension or website.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {MsEdgeTTS,OUTPUT_FORMAT}=require(process.env.IYT_TTS_MODULE || 'msedge-tts');
const ffmpeg=process.env.IYT_FFMPEG || 'ffmpeg';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'marketing/video');
const voiceDir=path.join(out,'narration');fs.mkdirSync(voiceDir,{recursive:true});
const run=args=>{const result=spawnSync(ffmpeg,['-hide_banner','-y',...args],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);return result.stderr};
const duration=file=>{const result=spawnSync(ffmpeg,['-hide_banner','-i',file],{encoding:'utf8'});const m=result.stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);assert.ok(m,result.stderr);return +m[1]*3600 + +m[2]*60 + +m[3]};
const segments=[
 {text:'Less scrolling. More intention.',start:.45,slot:3.1},
 {text:'Hide Shorts and recommendations. Set a daily watch limit.',start:4.2,slot:5.05},
 {text:'Intentional YouTube. Your YouTube. A little calmer.',start:10.15,slot:4.5}
];
for(const [i,s] of segments.entries()){
 const tts=new MsEdgeTTS();
 await tts.setMetadata('en-US-JennyNeural',OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
 const folder=path.join(voiceDir,String(i+1));fs.mkdirSync(folder,{recursive:true});
 const {audioFilePath}=await tts.toFile(folder,s.text,{rate:1});
 tts.close?.();
 const trimmed=path.join(voiceDir,`scene-${i+1}.wav`);
 run(['-i',audioFilePath,'-af','silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.06,areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.12,areverse','-ar','48000',trimmed]);
 const seconds=duration(trimmed);s.tempo=Math.max(1,seconds/s.slot);assert.ok(s.tempo<1.3,'Narration needs a shorter script');s.file=trimmed;s.seconds=seconds;
 console.log(`Scene ${i+1}: ${seconds}s; playback ${s.tempo.toFixed(3)}x`);
}
const input=path.join(out,'intentional-yt-promo-15s.mp4');
const output=path.join(out,'intentional-yt-promo-15s-voiceover.mp4');
const filters=['[0:a]volume=0.18[music]'];
segments.forEach((s,i)=>filters.push(`[${i+1}:a]atempo=${s.tempo},loudnorm=I=-17:TP=-2:LRA=7,aresample=48000,adelay=${Math.round(s.start*1000)}:all=1[v${i}]`));
filters.push('[music][v0][v1][v2]amix=inputs=4:normalize=0:duration=first,alimiter=limit=0.95:level=false[audio]');
run(['-i',input,...segments.flatMap(s=>['-i',s.file]),'-filter_complex',filters.join(';'),'-map','0:v:0','-map','[audio]','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-ac','2','-t','15','-movflags','+faststart',output]);
const verification=run(['-i',output,'-f','null','-']);assert.match(verification,/1920x1080/);assert.match(verification,/30 fps/);assert.equal(duration(output),15);
fs.writeFileSync(path.join(voiceDir,'script.json'),JSON.stringify({voice:'en-US-JennyNeural',provider:'Microsoft Edge Read Aloud via msedge-tts',segments:segments.map(({file,...s})=>s)},null,2));
console.log('Verified 15-second 1080p MP4 with narration:',output);
