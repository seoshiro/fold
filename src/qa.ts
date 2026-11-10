/** Opt-in, local-only instrumentation. Load only with ?qa=1. Never uploads data. */
type SceneQA = {getStats:()=>unknown;finishTransition?:()=>void};
const sceneAPI=()=> (window as unknown as {__FOLD_SCENE?:SceneQA}).__FOLD_SCENE;
const readSceneStats=()=>{try{return sceneAPI()?.getStats() ?? null}catch{return null}};
const host=document.createElement('aside');host.id='fold-qa';
host.style.cssText='position:fixed;z-index:10000;left:12px;bottom:12px;max-width:min(440px,calc(100vw - 24px));padding:10px;background:#fff5df;color:#231b17;font:12px/1.5 system-ui;border:1px solid #523b31;border-radius:4px;box-shadow:0 2px 12px #0003';
const title=document.createElement('strong');title.textContent='FOLD · local QA';
function button(label:string){const b=document.createElement('button');b.textContent=label;b.style.cssText='margin:6px 6px 0 0;padding:8px;color:#231b17;background:#fff;border:1px solid #523b31;font:inherit';return b;}
const start=button('Sample frame intervals (20s)'),cancel=button('Cancel sample'),inspect=button('Read scene diagnostics'),finishPose=button('Finish current transition for static inspection'),hide=button('Hide QA');cancel.disabled=true;
const note=document.createElement('div');note.textContent='No recording, screenshots or other heavy tests during a sample. RAF intervals are not GPU render timings. Static inspection skips motion and cannot prove animation quality.';
const output=document.createElement('pre');output.id='fold-qa-result';output.style.cssText='white-space:pre-wrap;max-height:210px;overflow:auto;font:11px/1.4 monospace;margin:6px 0 0';
const download=document.createElement('a');download.hidden=true;download.textContent='Download measurements';
host.append(title,document.createElement('br'),start,cancel,inspect,finishPose,note,output,download,hide);document.body.append(host);
let blobUrl='',staticInspections=0;
hide.onclick=()=>{host.hidden=true;};
inspect.onclick=()=>{output.textContent=JSON.stringify({kind:'Immediate scene diagnostics',at:new Date().toISOString(),visibility:document.visibilityState,staticInspections,stats:readSceneStats()},null,2);};
finishPose.onclick=()=>{const api=sceneAPI();if(!api?.finishTransition){output.textContent='Static inspection is not available until the scene has loaded.';return;}api.finishTransition();staticInspections++;output.textContent=JSON.stringify({kind:'Static inspection: transition jumped to its endpoint. This does not test animation timing or smoothness.',at:new Date().toISOString(),staticInspections,stats:readSceneStats()},null,2);};
const q=(v:number[],p:number)=>v[Math.max(0,Math.ceil(v.length*p)-1)]??null;
function rendererInfo(){
 const canvas=document.querySelector('canvas');const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');
 if(!gl)return {renderer:null,classification:'No WebGL context'};
 const ext=gl.getExtension('WEBGL_debug_renderer_info');const renderer=String(gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL??gl.RENDERER)),vendor=String(gl.getParameter(ext?.UNMASKED_VENDOR_WEBGL??gl.VENDOR));
 return {renderer,vendor,classification:/swiftshader|llvmpipe|software|softpipe/i.test(renderer)?'Software renderer':'Not established by renderer string alone; do not infer a physical device'};
}
start.onclick=()=>{
 if(start.disabled)return;start.disabled=true;cancel.disabled=false;inspect.disabled=true;finishPose.disabled=true;download.hidden=true;
 output.textContent='Sampling for 20 seconds. Interact normally; do not start recording.';
 const intervals:number[]=[],longTasks:{startMs:number;durationMs:number}[]=[],states:{timeMs:number;state:string;city:string|null;place:string|null}[]=[],sceneDiagnostics:{timeMs:number;stats:unknown}[]=[];
 const began=performance.now(),beginISO=new Date().toISOString(),initialViewport={width:innerWidth,height:innerHeight,dpr:devicePixelRatio};
 let last:number|null=null,first:number|null=null,lastState='',hidden=document.visibilityState!=='visible',resized=false,lastDiagnostic=-Infinity,done=false,raf=0,timer=0;
 const visibility=()=>{if(document.visibilityState!=='visible')hidden=true;},resize=()=>{resized=true;};
 document.addEventListener('visibilitychange',visibility);window.addEventListener('resize',resize);
 let observer:PerformanceObserver|null=null;
 try{observer=new PerformanceObserver(l=>{for(const e of l.getEntries())longTasks.push({startMs:Math.round(e.startTime-began),durationMs:e.duration});});observer.observe({type:'longtask',buffered:false});}catch{ /* Unsupported is explicit in the result. */ }
 const diagnostic=(now:number,force=false)=>{
  if(force||now-lastDiagnostic>=500){sceneDiagnostics.push({timeMs:Math.round(now-began),stats:readSceneStats()});lastDiagnostic=now;}
  const state=document.querySelector('[data-scene]')?.getAttribute('data-scene')||'unknown',params=new URLSearchParams(location.search),key=state+params.get('city')+params.get('place');
  if(key!==lastState){states.push({timeMs:Math.round(now-began),state,city:params.get('city'),place:params.get('place')});lastState=key;}
 };
 const finish=(reason:'wall-clock limit'|'RAF limit'|'cancelled')=>{
  if(done)return;done=true;cancelAnimationFrame(raf);clearTimeout(timer);const now=performance.now();diagnostic(now,true);
  observer?.disconnect();document.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',resize);
  const sorted=[...intervals].sort((a,b)=>a-b),duration=now-began,firstFrameDelay=first===null?null:first-began;
  const warnings:string[]=[];
  if(reason==='cancelled')warnings.push('Cancelled by operator');
  if(hidden)warnings.push('Document was hidden during the sample');if(resized)warnings.push('Viewport resized during sample');
  if(intervals.length<120)warnings.push('Too few RAF intervals for a representative foreground 20s sample');
  if(firstFrameDelay===null||firstFrameDelay>1000)warnings.push('First RAF callback absent or delayed over one second');
  if(duration>25000)warnings.push('Wall-clock completion delayed; background throttling or main-thread suspension possible');
  if((sorted.at(-1)??0)>1000)warnings.push('At least one RAF gap exceeded one second');
  const result={kind:'requestAnimationFrame callback interval sample (not GPU timings)',startedAt:beginISO,finishReason:reason,durationMs:duration,firstFrameDelayMs:firstFrameDelay,userAgent:navigator.userAgent,platform:navigator.platform,viewport:initialViewport,finalViewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,renderer:rendererInfo(),conditions:{recording:'Must be confirmed by operator; this sampler does not start recording',otherHeavyTests:'Must be confirmed by operator',wasHidden:hidden,resized,staticInspections,physicalDevice:'Not established; viewport simulation is not a phone test'},assessment:{warnings,foregroundPerformanceClaim:warnings.length?'Not supported by this sample':'Operator must still verify foreground, device and workload conditions'},frames:intervals.length,frameIntervalMs:{p50:q(sorted,.5),p95:q(sorted,.95),p99:q(sorted,.99),max:sorted.at(-1)??null,over33_4:intervals.filter(n=>n>33.4).length,over50:intervals.filter(n=>n>50).length},longTasksSupported:!!observer,longTasks,states,sceneDiagnostics,intervalsMs:intervals};
  const {intervalsMs,...summary}=result;output.textContent=JSON.stringify(summary,null,2);
  if(blobUrl)URL.revokeObjectURL(blobUrl);blobUrl=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));download.href=blobUrl;download.download='fold-frame-sample-'+beginISO.replace(/[:.]/g,'-')+'.json';download.hidden=false;start.disabled=false;cancel.disabled=true;inspect.disabled=false;finishPose.disabled=false;
 };
 const frame=(now:number)=>{if(done)return;if(first===null)first=now;if(last!==null)intervals.push(now-last);last=now;diagnostic(now);if(now-began>=20000){finish('RAF limit');return;}raf=requestAnimationFrame(frame);};
 cancel.onclick=()=>finish('cancelled');diagnostic(began,true);timer=window.setTimeout(()=>finish('wall-clock limit'),20000);raf=requestAnimationFrame(frame);
};
export {};
