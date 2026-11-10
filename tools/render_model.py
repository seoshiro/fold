"""Re-render saved master geometry; no modeling or export needed."""
import bpy,sys,math,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCE_SHA256=hashlib.sha256((ROOT/'model/fold-master.blend').read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'model/fold-master.blend'))
for o in bpy.data.objects:
 if o.animation_data:o.animation_data_clear()
s=bpy.context.scene;s.cycles.use_denoising=False;s.cycles.samples=48;s.render.resolution_x=1500;s.render.resolution_y=1100

def visible(root,value):
 root.hide_render=not value
 for o in root.children_recursive:o.hide_render=not value

def pose(p,city):
 for id in ['kyoto','lisbon','almaty']:visible(bpy.data.objects['CITY_'+id],p>.001 and id==city)
 visible(bpy.data.objects['STORY_TAB'],False)
 for o in bpy.data.objects:
  if 'fold_closed' in o:o.rotation_euler.x=float(o['fold_closed'])*(1-p)
  if o.name.startswith('COVER_'):o.rotation_euler.x=float(o['fold_open'])*p
if '--city-details' in sys.argv:
 from mathutils import Vector
 import json,hashlib
 s.cycles.samples=24;s.render.resolution_x=1400;s.render.resolution_y=1000
 cam=s.camera;cam.location=(2.4,-9.5,6.7);target=Vector((1.65,-.75,1.48))
 cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=4.8
 conditions={'source':'model/fold-master.blend','source_sha256':SOURCE_SHA256,'engine':'Cycles CPU','blender':bpy.app.version_string,'samples':24,'denoising':False,'resolution':[1400,1000],'threads':s.render.threads,'thread_mode':s.render.threads_mode,'camera':list(cam.location),'target':list(target),'orthographic_scale':4.8,'views':[]}
 for id in ['kyoto','lisbon']:
  pose(1,id);s.render.filepath=str(ROOT/f'model/proof/{id}-landmarks.png');bpy.ops.render.render(write_still=True)
  conditions['views'].append({'file':id+'-landmarks.png','city':id,'pose':1})
 (ROOT/'model/proof/landmark-render-conditions.json').write_text(json.dumps(conditions,indent=2))
elif '--details' in sys.argv or '--underside-only' in sys.argv:
 from mathutils import Vector
 pose(1,'kyoto');s.cycles.samples=24;s.render.resolution_x=1000;s.render.resolution_y=750
 conditions={'source':'model/fold-master.blend','city':'kyoto','pose':1.0,'engine':'Cycles CPU','blender':bpy.app.version_string,'samples':24,'denoising':False,'resolution':[1000,750],'threads':s.render.threads,'thread_mode':s.render.threads_mode,'views':[]}
 cam=s.camera;cam.location=(3.5,-4.2,3.3);target=Vector((2.0,-1.4,1.0));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.6
 conditions['views'].append({'file':'paper-closeup.png','camera':list(cam.location),'target':list(target),'orthographic_scale':cam.data.ortho_scale})
 s.render.filepath=str(ROOT/'model/proof/paper-closeup.png')
 if '--underside-only' not in sys.argv:bpy.ops.render.render(write_still=True)
 bpy.data.objects['RENDER_ground'].hide_render=True;s.render.film_transparent=True
 cam.location=(3,-8,.50);target=Vector((.6,-.3,1.45));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=9.8
 conditions['views'].append({'file':'wing-underside.png','ground_hidden_for_inspection':True,'transparent_film':True,'camera':list(cam.location),'target':list(target),'orthographic_scale':cam.data.ortho_scale})
 s.render.filepath=str(ROOT/'model/proof/wing-underside.png');bpy.ops.render.render(write_still=True)
 import json,hashlib
 conditions['source_sha256']=SOURCE_SHA256
 (ROOT/'model/proof/detail-render-conditions.json').write_text(json.dumps(conditions,indent=2))
elif '--proof' in sys.argv:
 s.render.resolution_x=1200;s.render.resolution_y=880;s.cycles.samples=32
 for i,p in enumerate([0,.25,.5,.75,1]):
  pose(p,'kyoto');s.render.filepath=str(ROOT/f'model/proof/hinge-{i*25:03d}.png');bpy.ops.render.render(write_still=True)
 import json,hashlib
 conditions={'source':'model/fold-master.blend','source_sha256':SOURCE_SHA256,'city':'kyoto','engine':'Cycles CPU','blender':bpy.app.version_string,'samples':32,'denoising':False,'resolution':[1200,880],'threads':s.render.threads,'thread_mode':s.render.threads_mode,'camera':list(s.camera.location),'rotation_euler':list(s.camera.rotation_euler),'orthographic_scale':s.camera.data.ortho_scale,'views':[{'file':f'hinge-{int(p*100):03d}.png','progress':p} for p in [0,.25,.5,.75,1]]}
 (ROOT/'model/proof/hinge-render-conditions.json').write_text(json.dumps(conditions,indent=2))
else:
 s.render.film_transparent=True;s.cycles.samples=24
 bpy.data.objects['RENDER_ground'].hide_render=True
 bpy.data.objects['RENDER_ground'].is_shadow_catcher=False
 for id in ['crane','kyoto','lisbon','almaty']:
  pose(0 if id=='crane' else 1,id);s.render.filepath=str(ROOT/f'public/posters/{id}.png');bpy.ops.render.render(write_still=True)
