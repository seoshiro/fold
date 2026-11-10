"""Lossless geometry repack; embedded fallback paper encoded as JPEG, quality 88.
The live site independently uses approved 1024px WebP albedo and height textures.
"""
from pathlib import Path
from PIL import Image
import struct,json,io
ROOT=Path(__file__).resolve().parents[1];p=ROOT/'public/models/fold-master.glb'
d=p.read_bytes();jl=struct.unpack_from('<I',d,12)[0];j=json.loads(d[20:20+jl]);start=20+jl;bl=struct.unpack_from('<I',d,start)[0];binary=d[start+8:start+8+bl]
images={im['bufferView']:im for im in j.get('images',[]) if 'bufferView'in im}
# Blender glTF exporter mistakes a Bump height input for a tangent-space normal.
# Remove that invalid normal link. Runtime derives a proper perturbation from height.
for material in j.get('materials',[]):
 if material.get('name')=='Warm cotton paper':material.pop('normalTexture',None)
for texture in j.get('textures',[]):
 ext=texture.get('extensions',{}).pop('EXT_texture_webp',None)
 if ext:texture['source']=ext['source']
 if not texture.get('extensions'):texture.pop('extensions',None)
for key in ['extensionsUsed','extensionsRequired']:
 if key in j:
  j[key]=[x for x in j[key] if x!='EXT_texture_webp']
  if not j[key]:j.pop(key)
new=bytearray()
for i,view in enumerate(j['bufferViews']):
 data=binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']]
 if i in images:
  image=Image.open(io.BytesIO(data)).convert('RGB');image.thumbnail((512,512));out=io.BytesIO();image.save(out,'JPEG',quality=88,optimize=True);data=out.getvalue();images[i]['mimeType']='image/jpeg'
 while len(new)%4:new.append(0)
 view['byteOffset']=len(new);view['byteLength']=len(data);new.extend(data)
j['buffers'][0]['byteLength']=len(new)
while len(new)%4:new.append(0)
js=json.dumps(j,separators=(',',':')).encode()
while len(js)%4:js+=b' '
p.write_bytes(struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(new))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(new),0x004e4942)+new)
manifest=ROOT/'model/asset-manifest.json';a=json.loads(manifest.read_text());a['glb_bytes']=p.stat().st_size;a['texture']={'embedded_fallback':{'format':'JPEG','width':512,'height':512,'quality':88},'runtime_albedo':{'file':'higgsfield-washi-albedo.webp','width':1024,'height':1024,'color_space':'sRGB'},'runtime_height':{'file':'higgsfield-washi-height.webp','width':1024,'height':1024,'color_space':'linear'},'source':'One Higgsfield paper generation, normalized and made seamless locally. See docs/generation-ledger.json and original archived asset. Original deterministic texture remains in public/textures/paper-fibers.png.'};manifest.write_text(json.dumps(a,indent=2));print('Optimized GLB bytes:',p.stat().st_size)
