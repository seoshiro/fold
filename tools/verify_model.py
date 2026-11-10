"""Validate the exported paper rig and persist factual, non-rendering QA evidence."""
from pathlib import Path
import hashlib,json,math,struct,sys
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'public/models/fold-master.glb';data=p.read_bytes()
magic,version,total=struct.unpack_from('<III',data)
assert (magic,version,total)==(0x46546c67,2,len(data))
n=struct.unpack_from('<I',data,12)[0];j=json.loads(data[20:20+n]);offset=20+n
binary=data[offset+8:offset+8+struct.unpack_from('<I',data,offset)[0]]
nodes=j['nodes'];parents={}
for i,node in enumerate(nodes):
 for child in node.get('children',[]):
  assert child not in parents,'Node has multiple parents'
  parents[child]=i
byname={node.get('name'):i for i,node in enumerate(nodes)}
def ancestors(i):
 seen=set()
 while i in parents:
  i=parents[i];assert i not in seen,'Node hierarchy contains a cycle';seen.add(i);yield i
hinges=[x for x in nodes if x.get('name','').startswith('HINGE_')]
assert len(hinges)==48
assert all(x.get('extras',{}).get('fold_axis')=='x' for x in hinges)
expected=['ANCHOR_'+city+'-poi-'+str(i) for city in ['kyoto','lisbon','almaty'] for i in range(3)]
assert all(name in byname for name in expected)
wing=byname['WING_attachment']
assert wing in list(ancestors(byname['STORY_TAB']))
counts={}
for city in ['kyoto','lisbon','almaty']:
 root=byname['CITY_'+city];assert wing in list(ancestors(root))
 city_meshes=[node for i,node in enumerate(nodes) if 'mesh' in node and root in list(ancestors(i))]
 counts[city]={'mesh_nodes':len(city_meshes),'triangles':sum(j['accessors'][p['indices']]['count']//3 for node in city_meshes for p in j['meshes'][node['mesh']]['primitives'])}
accessors=set()
for mesh in j['meshes']:
 for primitive in mesh['primitives']:
  assert primitive.get('mode',4)==4
  accessors.add(primitive['attributes']['POSITION'])
vertices=0
for index in accessors:
 accessor=j['accessors'][index];assert accessor['componentType']==5126 and accessor['type']=='VEC3'
 view=j['bufferViews'][accessor['bufferView']];start=view.get('byteOffset',0)+accessor.get('byteOffset',0);stride=view.get('byteStride',12)
 for i in range(accessor['count']):assert all(math.isfinite(v) for v in struct.unpack_from('<fff',binary,start+i*stride))
 vertices+=accessor['count']
triangles=sum(j['accessors'][p['indices']]['count']//3 for mesh in j['meshes'] for p in mesh['primitives'])
manifest=json.loads((ROOT/'model/asset-manifest.json').read_text())
assert triangles==manifest['triangles']==manifest['gltf_triangles']
assert len(data)==manifest['glb_bytes']
assert hashlib.sha256(data).hexdigest()==manifest['glb_sha256']
report={'asset':'public/models/fold-master.glb','sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'triangles':triangles,'vertices_with_uv_normal_splits':vertices,'mesh_nodes':sum('mesh'in n for n in nodes),'architecture_hinges':len(hinges),'place_anchors':len(expected),'cities':counts,'checks':{'valid_glb_envelope':True,'finite_vertex_coordinates':True,'all_architecture_under_common_wing':True,'all_hinges_use_local_x':True,'nine_place_anchors_retained':True,'story_tab_attached_to_wing':True,'counts_match_blender_manifest':True},'limits':'Structural export checks only. No exact paper collision solving, browser timing or physical phone testing.'}
if len(sys.argv)>1:
 old=Path(sys.argv[1]).read_bytes();m=struct.unpack_from('<I',old,12)[0];oldj=json.loads(old[20:20+m])
 oldnames={x.get('name') for x in oldj['nodes'] if x.get('name','').startswith(('HINGE_','ANCHOR_','CRANE_','CITY_','COVER_'))}
 assert oldnames.issubset(byname),'A named rig node was removed'
 report['checks']['baseline_rig_node_names_retained']=True
(ROOT/'model/proof/export-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
