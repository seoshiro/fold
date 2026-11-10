"""Make the saved Blender scene portable and demonstrably scrubbable."""
import bpy,math,json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'model/fold-master.blend'))
for img in bpy.data.images:
 # File images are lazy-loaded after opening a .blend. has_data is false before
 # first pixel access, so using it here silently left the master unpacked.
 if img.source=='FILE' and img.filepath:
  img.pack()
  if not img.packed_file:raise RuntimeError('Image was not packed: '+img.name)
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
bpy.context.scene.frame_set(100)
bpy.context.view_layer.update()
anchors={}
for o in bpy.data.objects:
 if o.name.startswith('ANCHOR_'):
  x,y,z=o.matrix_world.translation
  anchors[o.name]={'parent':o.parent.name,'local_z_up':list(o.location),'world_gltf_y_up':[x,z,-y]}
city_bounds={}
for id in ['kyoto','lisbon','almaty']:
 coords=[]
 for o in bpy.data.objects['CITY_'+id].children_recursive:
  if o.type=='MESH':
   for v in o.bound_box:
    x,y,z=o.matrix_world@Vector(v);coords.append((x,z,-y))
 city_bounds[id]={'min':[min(v[i] for v in coords) for i in range(3)],'max':[max(v[i] for v in coords) for i in range(3)],'coordinates':'world glTF Y-up, open architecture only'}
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'model/fold-master.blend'))
manifest=ROOT/'model/asset-manifest.json';data=json.loads(manifest.read_text());data['bounds']=bounds;data['open_city_bounds']=city_bounds;data['anchors']=anchors
data['blend_bytes']=(ROOT/'model/fold-master.blend').stat().st_size
data['blend_sha256']=hashlib.sha256((ROOT/'model/fold-master.blend').read_bytes()).hexdigest()
manifest.write_text(json.dumps(data,indent=2))
