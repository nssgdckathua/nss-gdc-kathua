(function(){
  "use strict";
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= 3D ROTATING SEAL ================= */
  function initSeal(){
    var stage = document.querySelector('.seal-stage');
    var canvas = document.getElementById('seal-canvas');
    if (!window.THREE || !stage || !canvas) { document.body.classList.add('no-webgl'); return; }

    var renderer;
    try{
      renderer = new THREE.WebGLRenderer({canvas: canvas, alpha:true, antialias:true, powerPreference:'high-performance'});
    }catch(e){ document.body.classList.add('no-webgl'); return; }

    var W = stage.clientWidth, H = stage.clientHeight;
    renderer.setSize(W,H,false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000,0);

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(34,W/H,.1,100);
    camera.position.set(0,0,8);

    var gold=0xC9A227, goldSoft=0xE7CE86, navy=0x0B2D5C;
    scene.add(new THREE.HemisphereLight(0xffffff,0x081a35,1.05));
    var key=new THREE.DirectionalLight(0xffffff,1.25); key.position.set(4,5,7); scene.add(key);
    var rim=new THREE.PointLight(gold,2.0,18); rim.position.set(-4,2,4); scene.add(rim);
    var blue=new THREE.PointLight(0x3978c9,1.1,16); blue.position.set(3,-3,3); scene.add(blue);

    var group=new THREE.Group(); scene.add(group);
    var coin=new THREE.Mesh(
      new THREE.CylinderGeometry(1.80,1.80,.34,96),
      new THREE.MeshStandardMaterial({color:navy,metalness:.82,roughness:.2,emissive:0x06162e,emissiveIntensity:.35})
    );
    coin.rotation.x=Math.PI/2; group.add(coin);

    var loader=new THREE.TextureLoader();
    var gdcTex=loader.load('gdc-logo.png'); var nssTex=loader.load('nss-logo.png');
    if('colorSpace' in gdcTex){gdcTex.colorSpace=THREE.SRGBColorSpace;nssTex.colorSpace=THREE.SRGBColorSpace;}
    else if('encoding' in gdcTex){gdcTex.encoding=THREE.sRGBEncoding;nssTex.encoding=THREE.sRGBEncoding;}

    var gdcGeo=new THREE.PlaneGeometry(3.25,2.65);
    var gdcMat=new THREE.MeshBasicMaterial({map:gdcTex,transparent:true,side:THREE.DoubleSide,depthWrite:false});
    var gdcPlane=new THREE.Mesh(gdcGeo,gdcMat); gdcPlane.position.z=.23; gdcPlane.visible=false; group.add(gdcPlane);
    var nssGeo=new THREE.PlaneGeometry(2.72,2.72);
    var nssMat=new THREE.MeshBasicMaterial({map:nssTex,transparent:true,side:THREE.DoubleSide,depthWrite:false});
    var nssPlane=new THREE.Mesh(nssGeo,nssMat); nssPlane.position.z=-.23; nssPlane.rotation.y=Math.PI; group.add(nssPlane);

    function torus(radius,tube,opacity,rotX){
      var m=new THREE.MeshStandardMaterial({color:goldSoft,metalness:.9,roughness:.18,transparent:opacity<1,opacity:opacity,emissive:0x3a2c05,emissiveIntensity:.25});
      var t=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,18,128),m); t.rotation.x=rotX; group.add(t); return t;
    }
    var ring3=torus(2.35,.012,0,Math.PI/2);
    var orbit=torus(2.52,.012,0,.35);

    var beadGeo=new THREE.SphereGeometry(.055,12,12), beadMat=new THREE.MeshStandardMaterial({color:gold,metalness:.85,roughness:.2,emissive:0x3a2c05,emissiveIntensity:.35});
    var beads=[];
    for(var i=0;i<6;i++){var b=new THREE.Mesh(beadGeo,beadMat); var a=i*Math.PI/3; b.position.set(Math.cos(a)*2.38,Math.sin(a)*2.38,0); group.add(b); beads.push(b);}

    var targetX=0,targetY=0;
    stage.addEventListener('pointermove',function(e){var r=stage.getBoundingClientRect();var nx=(e.clientX-r.left)/r.width*2-1;var ny=(e.clientY-r.top)/r.height*2-1;targetY=nx*.42;targetX=ny*.3;});
    stage.addEventListener('pointerleave',function(){targetX=0;targetY=0;});

    var clock=new THREE.Clock();
    function animate(){
      requestAnimationFrame(animate); var t=clock.getElapsedTime();

      if(!reduceMotion){
        /* Equal logo timing: GDC 4s → flip 2s → NSS 4s → flip 2s */
        var cycle=t%12;
        var autoFlip;

        if(cycle<4){
          autoFlip=0;
        }else if(cycle<6){
          var p=(cycle-4)/2;
          p=p*p*(3-2*p);
          autoFlip=Math.PI*p;
        }else if(cycle<10){
          autoFlip=Math.PI;
        }else{
          var p=(cycle-10)/2;
          p=p*p*(3-2*p);
          autoFlip=Math.PI+(Math.PI*p);
        }

        /* Keep the completed flip as the base rotation so the next cycle never jumps backward. */
        var cycleBase=Math.floor(t/12)*Math.PI*2;
        var desiredRotation=cycleBase+autoFlip;
        group.rotation.y += (targetY + desiredRotation + .0015 - group.rotation.y)*.08;
        group.rotation.x += (targetX + Math.sin(t*.5)*.035 - group.rotation.x)*.035;
        ring3.rotation.z=t*.16; orbit.rotation.y=t*.32;
        beads.forEach(function(b,i){var a=i*Math.PI/3+t*.28;b.position.x=Math.cos(a)*2.38;b.position.y=Math.sin(a)*2.38;b.position.z=Math.sin(a*2)*.16;});
      } else {
        group.rotation.y=.35;
      }

      renderer.render(scene,camera);
    }
    animate();
    window.addEventListener('resize',function(){var w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);});
  }

  /* ================= PARTICLE BACKDROP ================= */
  function initParticles(){
    var canvas = document.getElementById('bg-particles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, particles = [];

    function resize(){
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W * DPR; canvas.height = H * DPR;
      canvas.style.width = W+'px'; canvas.style.height = H+'px';
      ctx.setTransform(DPR,0,0,DPR,0,0);
      var count = Math.min(60, Math.floor((W*H)/28000));
      particles = [];
      for (var i=0;i<count;i++){
        particles.push({
          x: Math.random()*W,
          y: Math.random()*H,
          vx: (Math.random()-0.5)*0.18,
          vy: (Math.random()-0.5)*0.18,
          r: Math.random()*1.6 + 0.6,
          gold: Math.random() < 0.35
        });
      }
    }
    resize();
    window.addEventListener('resize', resize);

    function step(){
      ctx.clearRect(0,0,W,H);
      for (var i=0;i<particles.length;i++){
        var p = particles[i];
        if (!reduceMotion){
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.shadowBlur = p.gold ? 10 : 0; ctx.shadowColor = p.gold ? 'rgba(201,162,39,0.45)' : 'transparent'; ctx.fillStyle = p.gold ? 'rgba(201,162,39,0.62)' : 'rgba(11,45,92,0.25)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      // connecting lines for nearby particles
      for (var a=0; a<particles.length; a++){
        for (var b=a+1; b<particles.length; b++){
          var dx = particles[a].x - particles[b].x;
          var dy = particles[a].y - particles[b].y;
          var d = Math.sqrt(dx*dx+dy*dy);
          if (d < 110){
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.strokeStyle = 'rgba(11,45,92,' + (0.08 * (1 - d/110)) + ')';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(step);
    }
    step();
  }


  /* ================= SCROLL REVEAL + DEPTH LIGHT ================= */
  function initDepth(){
    var sections=document.querySelectorAll('main section');
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in-view');io.unobserve(e.target);}})},{threshold:.12});
      sections.forEach(function(s){s.classList.add('reveal');io.observe(s);});
    }
    if(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduceMotion){
      document.addEventListener('pointermove',function(e){
        document.documentElement.style.setProperty('--mx',(e.clientX/window.innerWidth*100).toFixed(2)+'%');
        document.documentElement.style.setProperty('--my',(e.clientY/window.innerHeight*100).toFixed(2)+'%');
      });
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      initSeal(); initParticles(); initDepth();
    });
  } else {
    initSeal(); initParticles(); initDepth();
  }
})();
