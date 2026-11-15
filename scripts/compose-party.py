#!/usr/bin/env python3
"""Render Neon Overdrive, an original 120-second K-pop-style party instrumental.
Requires numpy/scipy, libfluidsynth, TimGM6mb.sf2 and ffmpeg. No sampled songs/voices.
Usage: python scripts/compose-party.py [output-folder]
The output MP3 can be embedded by replacing PARTY_MUSIC_DATA in the game HTML.
"""
from pathlib import Path
import ctypes as C
import ctypes.util
import json
import subprocess
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

OUT=Path(sys.argv[1] if len(sys.argv)>1 else 'reports/party-production')
OUT.mkdir(parents=True,exist_ok=True)
SR=44100; BPM=128; BEAT=60/BPM; BAR=BEAT*4; SECONDS=64*BAR
rng=np.random.default_rng(11152026)
N=round((SECONDS+3)*SR)
stems={k:np.zeros((N,2),dtype=np.float32) for k in ['drums','bass','harmony','lead','air']}

def add(stem,clip,at,gain=1,pan=0):
    i=round(at*SR)
    if i<0 or i>=N:return
    clip=np.asarray(clip,dtype=np.float32)[:N-i]
    if clip.ndim==1:
        clip=np.column_stack((clip*np.sqrt((1-pan)/2),clip*np.sqrt((1+pan)/2)))
    stems[stem][i:i+len(clip)]+=clip*gain

def env(n,attack=.005,release=.08):
    e=np.ones(n);a=min(n,round(attack*SR));r=min(n,round(release*SR))
    if a:e[:a]=np.linspace(0,1,a)
    if r:e[-r:]*=np.linspace(1,0,r)
    return e

def hz(note):return 440*2**((note-69)/12)

# Sample-based piano/strings/koto add a live-instrument layer to original synthesis.
lib=C.CDLL(ctypes.util.find_library('fluidsynth'))
def api(name,args,result):
    f=getattr(lib,name);f.argtypes=args;f.restype=result;return f
ptr=C.c_void_p;integer=C.c_int;flt=C.c_float
settings=api('new_fluid_settings',[],ptr)()
api('fluid_settings_setnum',[ptr,C.c_char_p,C.c_double],integer)(settings,b'synth.sample-rate',SR)
api('fluid_settings_setnum',[ptr,C.c_char_p,C.c_double],integer)(settings,b'synth.gain',.6)
api('fluid_settings_setint',[ptr,C.c_char_p,integer],integer)(settings,b'synth.reverb.active',0)
api('fluid_settings_setint',[ptr,C.c_char_p,integer],integer)(settings,b'synth.chorus.active',0)
synth=api('new_fluid_synth',[ptr],ptr)(settings)
api('fluid_synth_sfload',[ptr,C.c_char_p,integer],integer)(synth,b'/usr/share/sounds/sf2/TimGM6mb.sf2',1)
program=api('fluid_synth_program_change',[ptr,integer,integer],integer)
on=api('fluid_synth_noteon',[ptr,integer,integer,integer],integer)
off=api('fluid_synth_noteoff',[ptr,integer,integer],integer)
alloff=api('fluid_synth_all_sounds_off',[ptr,integer],integer)
write=api('fluid_synth_write_float',[ptr,integer,ptr,integer,integer,ptr,integer,integer],integer)
cache={}
def instrument(prog,note,duration,vel=95):
    key=(prog,note,round(duration,3),vel)
    if key in cache:return cache[key]
    alloff(synth,0);program(synth,0,prog);on(synth,0,note,vel)
    n=round(duration*SR);tail=round(.3*SR)
    a=np.zeros((n+tail,2),np.float32)
    write(synth,n,a.ctypes.data,0,2,a.ctypes.data,1,2);off(synth,0,note)
    write(synth,tail,a[n:].ctypes.data,0,2,a[n:].ctypes.data,1,2)
    a*=env(len(a),.006,.12)[:,None];cache[key]=a
    return a

# Drum sound design: swept sine kick, layered clap/noise snare, hats, toms and crashes.
t=np.arange(round(.65*SR))/SR
kick=(np.sin(2*np.pi*(47*t+3.8*(1-np.exp(-t*34))))*np.exp(-t*10.5)+rng.normal(0,1,len(t))*np.exp(-t*220)*.13)*env(len(t),.001,.07)
t=np.arange(round(.35*SR))/SR
noise=signal.sosfilt(signal.butter(2,1100,fs=SR,btype='highpass',output='sos'),rng.normal(0,1,len(t)))
clap=np.zeros(len(t))
for delay in [0,.011,.024]:
    local=np.maximum(0,t-delay);clap+=noise*np.exp(-local*33)*(t>=delay)*.24
clap+=np.sin(2*np.pi*185*t)*np.exp(-t*28)*.17
clap*=env(len(t),.001,.04)
def hat(opened=False):
    dur=.3 if opened else .09;t=np.arange(round(dur*SR))/SR
    n=signal.sosfilt(signal.butter(2,6500,fs=SR,btype='highpass',output='sos'),rng.normal(0,1,len(t)))
    return n*np.exp(-t*(15 if opened else 65))*.18*env(len(t),.001,.02)
def crash():
    t=np.arange(round(2.2*SR))/SR;n=rng.normal(0,1,len(t))
    n=signal.sosfilt(signal.butter(2,5000,fs=SR,btype='highpass',output='sos'),n)
    return n*np.exp(-t*2)*.18*env(len(t),.002,.2)
def snare_roll(duration):
    t=np.arange(round(duration*SR))/SR
    return (rng.normal(0,1,len(t))*.2+np.sin(2*np.pi*190*t)*.1)*np.exp(-t*32)*env(len(t),.001,.02)

def synth_note(note,duration,kind='lead',bright=True):
    n=round((duration+.18)*SR);t=np.arange(n)/SR;f=hz(note);vibrato=.0018*np.sin(2*np.pi*5.5*t)*np.minimum(1,t*5)
    if kind=='bass':
        phase=2*np.pi*f*t
        x=np.sin(phase)+.25*np.sin(phase*2)+.12*np.sin(phase*3)
        return np.tanh(x*1.4)*np.exp(-t*.8)*env(n,.005,.12)*.34
    # Smooth harmonic saw stacks, detuned in stereo; no alias-prone discontinuities.
    phase=2*np.pi*f*t*(1+vibrato)
    left=np.zeros(n);right=np.zeros(n)
    harmonics=9 if bright else 4
    for h in range(1,harmonics):
        strength=np.exp(-h/(5 if bright else 2.2))/h
        left+=strength*(np.sin(phase*h*.997)+np.sin(phase*h*1.001))/2
        right+=strength*(np.sin(phase*h*1.003)+np.sin(phase*h*.999))/2
    e=env(n,.018,.16)*(.8+.2*np.exp(-t*4))
    return np.column_stack((left,right))*e[:,None]*.25

progression=[(38,[62,65,69,76]),(34,[58,62,65,69]),(41,[60,65,69,72]),(36,[60,64,67,74]),(38,[62,65,69,76]),(34,[58,62,65,69]),(43,[58,62,67,69]),(33,[61,64,67,73])]
# Each chorus is a complete eight-bar call/response melody, with room between phrases.
hook=[[(0,74,.75),(1,77,.25),(1.5,81,.5),(2.5,79,.5),(3,77,.5),(3.5,76,.5)],
[(0,74,.5),(.75,69,.25),(1,72,.75),(2,74,.75),(3,77,.5),(3.5,76,.5)],
[(0,72,.75),(1,77,.25),(1.5,81,.5),(2.5,84,.75),(3.5,81,.5)],
[(0,79,1),(1.5,76,.5),(2,74,.75),(3.25,72,.5)],
[(0,70,.75),(1,74,.25),(1.5,77,.75),(2.75,74,.5),(3.5,72,.5)],
[(0,69,.75),(1,72,.5),(2,77,.75),(3,76,.5),(3.5,74,.5)],
[(0,72,.5),(.75,76,.25),(1,79,.5),(2,82,.5),(2.75,81,.5),(3.5,79,.5)],
[(0,81,1),(1.25,79,.25),(1.75,76,.5),(2.5,73,.5),(3,74,.9)]]
sections=[(0,4,'Intro'),(4,12,'Verse 1'),(12,20,'Pre-chorus'),(20,28,'Chorus'),(28,32,'Dance break'),(32,40,'Verse 2'),(40,44,'Build'),(44,48,'Bridge'),(48,60,'Final chorus'),(60,64,'Outro')]

def section(bar):return next(name for start,end,name in sections if start<=bar<end)
for bar in range(64):
    name=section(bar);at=bar*BAR;root,chord=progression[bar%8]
    big=name in ['Chorus','Final chorus','Dance break'];verse=name.startswith('Verse');build=name in ['Pre-chorus','Build'];bridge=name=='Bridge';intro=name=='Intro';outro=name=='Outro'
    energy=1.0 if big else .7 if verse else .75 if build else .4
    # Strings/piano carry voice-led harmonies; chorus adds a wide, pumping synth stack.
    for j,note in enumerate(chord):
        add('harmony',instrument(48,note,BAR+.1,76),at,.13 if big else .10 if build or bridge else .025,(-.45+j*.3))
        if intro or bridge or build or outro:
            add('harmony',instrument(0,note,BAR*.8,88),at+j*.018,.22 if bridge else .12)
        if big:
            for beat in [0,1.5,2.5]:add('harmony',synth_note(note,BEAT*.75,'chord'),at+beat*BEAT,.18)
    # Koto-like picked arpeggios and bell answers are sparse under the main hook.
    for step in range(8):
        if big and step%2==1:continue
        note=chord[[0,2,1,3,2,1,3,2][step]]+(12 if intro or outro else 0)
        add('harmony',instrument(107,note,BEAT*.35,85),at+step*.5*BEAT,.35 if verse else .2 if intro else .08,(-.45 if step%2 else .45))
    if not intro and not bridge and not outro:
        kicks=[0,1,2,3] if big or build else [0,1.75,2.5,3.25] if bar%2 else [0,1.5,2.75]
        for beat in kicks:add('drums',kick,at+beat*BEAT,.82*energy)
        for beat in ([1,3] if not bridge else [2]):add('drums',clap,at+beat*BEAT,.85*energy)
        for step in range(8):add('drums',hat(),at+step*.5*BEAT,.55*energy*(.6 if step%2==0 else 1),(-.22 if step%2 else .22))
        if big:
            for beat in [.5,1.5,2.5,3.5]:add('drums',hat(True),at+beat*BEAT,.30,.30)
        if verse and bar%2:
            for step in [12,13,14,15]:add('drums',hat(),at+step*.25*BEAT,.3,(-.4 if step%2 else .4))
        bass_pattern=[(0,root,.65),(.75,root,.3),(1.5,root,.7),(2.5,root+12,.4),(3,root,.6),(3.75,root+7,.2)] if big else [(0,root,1.25),(1.5,root,.65),(2.75,root+7,.45),(3.5,root,.4)]
        for beat,note,dur in bass_pattern:add('bass',synth_note(note,BEAT*dur,'bass'),at+beat*BEAT,.9 if big else .75)
    elif bridge:
        add('bass',synth_note(root,BAR*.8,'bass'),at,.38)
        if bar>=46:
            for beat in [0,2]:add('drums',kick,at+beat*BEAT,.4)
    if big:
        phrase=(bar-20)%8 if bar<32 else (bar-48)%8
        for beat,note,dur in hook[phrase]:
            add('lead',synth_note(note,BEAT*dur),at+beat*BEAT,.92)
            if name=='Final chorus':add('lead',synth_note(note+12,BEAT*dur,bright=False),at+beat*BEAT,.17)
        # Short, percussive counter-melody replies in the phrase gaps.
        if phrase in [1,3,5,7]:
            for beat,note in [(2.9,chord[2]+12),(3.25,chord[1]+12)]:add('lead',instrument(10,note,.22,85),at+beat*BEAT,.13)
    elif verse:
        # Rhythm-led lower-register phrase leaves room as a pop verse would.
        phrase=hook[bar%8][:3]
        for beat,note,dur in phrase:add('lead',synth_note(note-12,BEAT*dur,bright=False),at+(beat+.25)*BEAT,.42)
    elif build:
        for k in range(4):add('lead',synth_note(chord[k]+(12 if bar%4>=2 else 0),BEAT*.65,bright=False),at+k*BEAT,.35+(.035*(bar%4)))
    elif intro or bridge or outro:
        for beat,note,dur in hook[bar%8][::2]:add('lead',instrument(10,note,BEAT*dur,80),at+beat*BEAT,.22 if bridge else .3)
    if bar in [4,12,20,28,32,40,44,48,56,60]:add('air',crash(),at,.7 if big else .4, .1)
    if bar in [11,19,27,31,39,43,47,55,59]:
        # Real fills and rising energy into the next section.
        count=16 if bar in [19,47] else 8
        for j in range(count):add('drums',snare_roll(.12),at+3*BEAT+j*BEAT/count,.2+j/count*.35,(-.2 if j%2 else .2))
        dur=BEAT*2;t=np.arange(round(dur*SR))/SR
        sweep=signal.sosfilt(signal.butter(2,2400,fs=SR,btype='highpass',output='sos'),rng.normal(0,1,len(t)))
        sweep*=np.linspace(0,1,len(t))**1.7*.10*env(len(t),.02,.005)
        add('air',sweep,at+2*BEAT,1)
    if intro:
        add('air',hat(True),at+3.5*BEAT,.15)
    print(f'Arranged {bar+1}/64: {name}',flush=True) if bar%8==7 else None

# Sidechain the musical bed to the kick pulse, with extra lift in choruses.
timeline=np.arange(N)/SR
phase=(timeline/BEAT)%1
pump=1-.32*np.exp(-phase*13)
for name in ['bass','harmony','lead']:stems[name]*=pump[:,None]
# Stereo eighth/dotted-eighth delays and a diffuse room make the hook feel produced.
for name,gain in [('lead',.22),('harmony',.14)]:
    original=stems[name].copy()
    for beats,level in [(.75,gain),(1.5,gain*.52),(2.25,gain*.25)]:
        shift=round(beats*BEAT*SR);stems[name][shift:]+=original[:-shift,::-1]*level
for name,gain in [('drums',.07),('lead',.10),('harmony',.14)]:
    original=stems[name].copy()
    for delay,mix in [(.043,.65),(.079,.47),(.113,.36),(.157,.27),(.199,.20),(.269,.15),(.331,.10)]:
        shift=round(delay*SR);filtered=signal.sosfilt(signal.butter(1,5000,fs=SR,output='sos'),original[:-shift],axis=0)
        stems[name][shift:]+=filtered[:,::-1]*gain*mix
mix=sum(stems.values())[:round(SECONDS*SR)]
# Fade into the opening; a short outro fade avoids clicks when it repeats.
fade=np.ones(len(mix));fade[:round(.025*SR)]=np.linspace(0,1,round(.025*SR));fade[-round(1.8*SR):]=np.linspace(1,0,round(1.8*SR))
mix*=fade[:,None]
mix=np.tanh(mix*1.1)*.9
wav=OUT/'neon-overdrive-mix.wav';wavfile.write(wav,SR,mix.astype(np.float32))
mp3=OUT/'neon-overdrive.mp3'
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(wav),'-af','highpass=f=28,loudnorm=I=-15:TP=-1.5:LRA=8','-ar',str(SR),'-c:a','libmp3lame','-b:a','160k','-metadata','title=Neon Overdrive','-metadata','artist=Dirtbike Game — Original instrumental',str(mp3)],check=True)
meta={'title':'Neon Overdrive','bpm':BPM,'duration':SECONDS,'kind':'Original K-pop-style instrumental','sections':[{'name':name,'start':start*BAR,'end':end*BAR} for start,end,name in sections]}
(OUT/'track.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps({'mp3':str(mp3),'bytes':mp3.stat().st_size,**meta}),flush=True)
