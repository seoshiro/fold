"""Make the saved Blender scene portable and demonstrably scrubbable."""
import bpy,math,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'model/fold-master.blend'))
for img in bpy.data.images:
 if img.has_data and img.filepath:
  try:img.pack()
  except RuntimeError:pass
for id in ['kyoto','lisbon','almaty']:
 root=bpy.data.objects.get('CITY_'+id)
 if root:
  for o in [root]+list(root.children_recursive):o.hide_render=id!='kyoto'
st=bpy.data.objects.get('STORY_TAB')
if st:
 for o in [st]+list(st.children_recursive):o.hide_render=True
for o in bpy.data.objects:
 if 'fold_closed' in o:
  for frame,p in [(1,0),(25,.25),(50,.5),(75,.75),(100,1)]:
   o.rotation_euler.x=float(o['fold_closed'])*(1-p);o.keyframe_insert(data_path='rotation_euler',frame=frame,index=0)
 if o.name.startswith('COVER_'):
  for frame,p in [(1,0),(25,.25),(50,.5),(75,.75),(100,1)]:
   o.rotation_euler.x=float(o['fold_open'])*p;o.keyframe_insert(data_path='rotation_euler',frame=frame,index=0)
 if o.animation_data and o.animation_data.action:
  for f in o.animation_data.action.fcurves:
   for k in f.keyframe_points:k.interpolation='LINEAR'
bpy.context.scene.frame_end=100;bpy.context.scene.frame_set(100)
from mathutils import Vector
bounds={}
for frame,label in [(1,'closed'),(100,'open')]:
 bpy.context.scene.frame_set(frame);bpy.context.view_layer.update()
 coords=[]
 for o in bpy.data.objects:
  if o.type=='MESH' and not o.name.startswith('RENDER_'):
   coords.extend(o.matrix_world@Vector(v) for v in o.bound_box)
 mn=[min(v[i] for v in coords) for i in range(3)];mx=[max(v[i] for v in coords) for i in range(3)]
 bounds[label]={'min':mn,'max':mx,'dimensions':[mx[i]-mn[i] for i in range(3)],'units':'artistic Blender units, Z-up; includes all city modules'}
manifest=ROOT/'model/asset-manifest.json';data=json.loads(manifest.read_text());data['bounds']=bounds;manifest.write_text(json.dumps(data,indent=2))
bpy.context.scene.frame_set(100)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'model/fold-master.blend'))
