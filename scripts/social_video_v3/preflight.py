#!/usr/bin/env python3
from pathlib import Path
import subprocess,json
from PIL import Image,ImageOps,ImageDraw
root=Path("video-preflight");root.mkdir(exist_ok=True)
ids=[7426386,7426704,7426747,7426759,7426675,7426751,7426834]
def run(cmd,timeout=105):
 p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
 if p.returncode:raise RuntimeError(p.stderr[-250:])
 return p.stdout
def meta(f):
 try:
  x=json.loads(run(["ffprobe","-v","error","-show_entries","stream=codec_name,width,height,avg_frame_rate:format=duration,size","-of","json",str(f)]))
  v=[z for z in x["streams"] if z.get("codec_name") in ("h264","hevc","vp9","mpeg4","av1")]
  if not v:return None
  return {"duration":float(x["format"]["duration"]),"width":v[0]["width"],"height":v[0]["height"],"size":int(x["format"]["size"])}
 except Exception:return None
records=[]
for vid in ids:
 path=root/f"{vid}.mp4"
 candidates=[f"https://www.pexels.com/download/video/{vid}/"]
 for fps in [25,50,30,24]:
  for size in ["1920_1080","1280_720","1920_810","1280_540","1920_800"]:
   candidates.append(f"https://videos.pexels.com/video-files/{vid}/{vid}-hd_{size}_{fps}fps.mp4")
 info=None
 for url in candidates:
  try:
   run(["curl","-fL","--retry","1","--connect-timeout","10","--max-time","45","-A","Mozilla/5.0","-o",str(path),url],timeout=55)
   info=meta(path)
   if info and info['duration']>=5 and info["width"]>=700:break
  except Exception as e:
   print("Source retry:",vid,str(e)[:100],flush=True)
  path.unlink(missing_ok=True)
 if not info:
  print("No footage",vid,flush=True)
  continue
 record={"id":vid,**info,"source":f"https://www.pexels.com/video/{vid}/"}
 records.append(record);print("ACQUIRED",record,flush=True)
 for i,t in enumerate([.12,.45,.8]):
  frame=root/f"{vid}_{i}.jpg"
  run(["ffmpeg","-y","-loglevel","error","-ss",str(info["duration"]*t),"-i",str(path),"-frames:v","1","-vf","scale=480:-2",str(frame)])
sheet=Image.new("RGB",(960,210*len(records)),(242,242,242))
draw=ImageDraw.Draw(sheet)
for j,info in enumerate(records):
 for i in range(3):
  thumb=Image.open(root/f"{info['id']}_{i}.jpg").convert("RGB")
  sheet.paste(ImageOps.fit(thumb,(320,176)),(i*320,j*210+25))
 draw.text((8,j*210+6),f"{info['id']}  {info['duration']:.1f}s",fill=(0,0,0))
sheet.save(root/"contact.jpg",quality=91)
(root/"source_manifest.json").write_text(json.dumps(records,indent=2))
if len(records)<4:raise SystemExit("Not enough live action for a coherent story.")
