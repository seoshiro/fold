/** Opt-in, local-only instrumentation. Load only with ?qa=1. Never uploads data. */
const host = document.createElement('aside');
host.id = 'fold-qa';
host.style.cssText = 'position:fixed;z-index:10000;left:12px;bottom:12px;max-width:min(440px,calc(100vw - 24px));padding:10px;background:#fff5df;color:#231b17;font:12px/1.5 system-ui;border:1px solid #523b31;border-radius:4px;box-shadow:0 2px 12px #0003';
const title = document.createElement('strong'); title.textContent = 'FOLD · local QA';
const start = document.createElement('button'); start.textContent = 'Sample frame intervals (20s)';
start.style.cssText = 'display:block;margin:6px 0;padding:8px;color:#231b17;background:#fff;border:1px solid #523b31;font:inherit';
const note = document.createElement('div'); note.textContent = 'No recording, screenshots or other heavy tests during a sample. RAF intervals are not GPU render timings.';
const output = document.createElement('pre'); output.id = 'fold-qa-result'; output.style.cssText = 'white-space:pre-wrap;max-height:210px;overflow:auto;font:11px/1.4 monospace;margin:6px 0 0';
const download = document.createElement('a'); download.hidden = true; download.textContent = 'Download measurements';
const hide = document.createElement('button'); hide.textContent = 'Hide QA'; hide.style.cssText = 'margin-left:10px;font:inherit'; hide.onclick = () => {host.hidden=true;};
host.append(title,start,note,output,download,hide); document.body.append(host);
let blobUrl = '';
const readSceneStats=()=>{try{return (window as unknown as {__FOLD_SCENE?: {getStats:()=>unknown}}).__FOLD_SCENE?.getStats() ?? null}catch{return null}};
const q = (v:number[],p:number) => v[Math.max(0,Math.ceil(v.length*p)-1)] ?? null;
function rendererInfo(){
 const canvas=document.querySelector('canvas');
 const gl=canvas?.getContext('webgl2') || canvas?.getContext('webgl');
 if(!gl)return {renderer:null,classification:'No WebGL context'};
 const ext=gl.getExtension('WEBGL_debug_renderer_info');
 const renderer=String(gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER));
 const vendor=String(gl.getParameter(ext?.UNMASKED_VENDOR_WEBGL ?? gl.VENDOR));
 return {renderer,vendor,classification:/swiftshader|llvmpipe|software|softpipe/i.test(renderer)?'Software renderer':'Not established by renderer string alone; do not infer a physical device'};
}
start.onclick=()=>{
 if(start.disabled)return;
 start.disabled=true; output.textContent='Sampling for 20 seconds. Interact normally; do not start recording.';
 const intervals:number[]=[],longTasks:{startMs:number;durationMs:number}[]=[],states:{timeMs:number;state:string;city:string|null;place:string|null}[]=[];
 const began=performance.now(),beginISO=new Date().toISOString(); let last=0,lastState='',hidden=document.visibilityState!=='visible',resized=false,lastDiagnostic=0;
 const sceneDiagnostics:{timeMs:number;stats:unknown}[]=[];
 const initialViewport={width:innerWidth,height:innerHeight,dpr:devicePixelRatio};
 const visibility=()=>{if(document.visibilityState!=='visible')hidden=true;};
 const resize=()=>{resized=true;};
 document.addEventListener('visibilitychange',visibility); window.addEventListener('resize',resize);
 let observer:PerformanceObserver|null=null;
 try{observer=new PerformanceObserver(l=>{for(const e of l.getEntries())longTasks.push({startMs:Math.round(e.startTime-began),durationMs:e.duration});});observer.observe({type:'longtask',buffered:false});}catch{ /* Unsupported: recorded explicitly below. */ }
 const frame=(now:number)=>{
  if(last)intervals.push(now-last);last=now;
  if(now-lastDiagnostic>=500){sceneDiagnostics.push({timeMs:Math.round(now-began),stats:readSceneStats()});lastDiagnostic=now;}
  const state=document.querySelector('[data-scene]')?.getAttribute('data-scene')||'unknown',params=new URLSearchParams(location.search),key=state+params.get('city')+params.get('place');
  if(key!==lastState){states.push({timeMs:Math.round(now-began),state,city:params.get('city'),place:params.get('place')});lastState=key;}
  if(now-began<20000){requestAnimationFrame(frame);return;}
  observer?.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',resize);
  const sorted=[...intervals].sort((a,b)=>a-b);
  const result={kind:'requestAnimationFrame callback interval sample (not GPU timings)',startedAt:beginISO,durationMs:now-began,userAgent:navigator.userAgent,platform:navigator.platform,viewport:initialViewport,finalViewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,renderer:rendererInfo(),conditions:{recording:'Must be confirmed by operator; this sampler does not start recording',otherHeavyTests:'Must be confirmed by operator',wasHidden:hidden,resized,physicalDevice:'Not established; viewport simulation is not a phone test'},frames:intervals.length,frameIntervalMs:{p50:q(sorted,.5),p95:q(sorted,.95),p99:q(sorted,.99),max:sorted.at(-1)??null,over33_4:intervals.filter(n=>n>33.4).length,over50:intervals.filter(n=>n>50).length},longTasksSupported:!!observer,longTasks,states,sceneDiagnostics,intervalsMs:intervals};
  const {intervalsMs,...summary}=result;output.textContent=JSON.stringify(summary,null,2);
  if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));
  download.href=blobUrl;download.download='fold-frame-sample-'+beginISO.replace(/[:.]/g,'-')+'.json';download.hidden=false;start.disabled=false;
 };
 requestAnimationFrame(frame);
};
export {};
