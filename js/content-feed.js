(function(){
  "use strict";
  // Pulls Notices / Events / Achievements / Gallery from the private
  // Google Sheet feed. If a section has no rows yet, its existing
  // "Coming Soon" card is left exactly as-is.
  var FEED_URL = "https://script.google.com/macros/s/AKfycbxEFciYSaJO0F8jtnPuHL2AHQkCIKXaEFI54RXupe-1hic8nlJlDvfxz1-mU-A_qUWD/exec";

  function escapeHtml(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }

  function isUrl(s){
    return /^https?:\/\//i.test(String(s || "").trim());
  }

  function buildCard(icon, title, sub, link, sectionKey){
    var inner =
      '<span class="action-icon">' + icon + '</span>' +
      '<span class="action-text">' +
        '<span class="action-label">' + escapeHtml(title) + '</span>' +
        '<span class="action-sub">' + escapeHtml(sub) + '</span>' +
      '</span>' +
      '<span class="action-chevron">\u203A</span>';
    return '<button type="button" class="action-card live-content" data-content-section="' + escapeHtml(sectionKey) + '">' +
             inner + '</button>';
  }

  function renderSection(slotId, icon, rows, mapRow, sectionKey){
    var slot = document.getElementById(slotId);
    if (!slot || !rows || !rows.length) return; // keep existing "Coming Soon" card

    if (sectionKey === "Events") {
      slot.outerHTML =
        '<li>' +
          buildCard(icon, "Upcoming Events", rows.length + " event" + (rows.length === 1 ? "" : "s") + " available", null, sectionKey) +
        '</li>';
      return;
    }

    var html = "";
    rows.forEach(function(row){
      var c = mapRow(row);
      html += '<li>' + buildCard(icon, c.title, c.sub, c.link, sectionKey) + '</li>';
    });
    slot.outerHTML = html;
  }

  var liveData = {Notices:[], Events:[], Achievements:[], Gallery:[]};
  var sectionMeta = {
    Notices:{title:"Latest Notices", kicker:"Circulars, dates & instructions", icon:"📢"},
    Events:{title:"Upcoming Events", kicker:"Camps, drives & workshops", icon:"📅"},
    Achievements:{title:"Volunteer Achievements", kicker:"Recognitions & honours", icon:"🎖"},
    Gallery:{title:"Photo Gallery", kicker:"Camps, events & activities", icon:"📷"}
  };

  function openContentModal(sectionKey){
    var modal=document.getElementById("content-modal");
    var body=document.getElementById("content-modal-body");
    var title=document.getElementById("content-modal-title");
    var kicker=document.getElementById("content-modal-kicker");
    if(!modal || !body || !title || !kicker) return;

    var meta=sectionMeta[sectionKey] || sectionMeta.Notices;
    var rows=liveData[sectionKey] || [];
    title.textContent=meta.icon+"  "+meta.title;
    kicker.textContent=meta.kicker;

    if(!rows.length){
      body.innerHTML='<div class="content-empty"><strong>No updates yet</strong><span>New '+escapeHtml(meta.title.toLowerCase())+' will appear here automatically.</span></div>';
    }else{
      body.innerHTML=rows.map(function(r){
        var titleText=r.Title || "Untitled";
        var date=r.Date || "";
        var desc=r.Description || "";
        var link=r.Link || "";
        var media = r.ImageURL || r.ImageUrl || r.Image || r.PhotoURL || r.PhotoUrl || r.Photo || r.Thumbnail || r.ThumbnailURL || r.MediaURL || r.MediaUrl || "";
        if(!media && /\.(?:png|jpe?g|gif|webp|svg)(?:[?#].*)?$/i.test(String(link || ""))) media=link;
        var mediaHtml = isUrl(media) ? '<a class="content-item-media-link" href="'+escapeHtml(media)+'" target="_blank" rel="noopener"><img class="content-item-media" src="'+escapeHtml(media)+'" alt="'+escapeHtml(titleText)+'" loading="lazy"></a>' : "";
        var pdfHtml = !media && isUrl(link) && /\.pdf(?:[?#].*)?$/i.test(String(link)) ? '<a class="content-item-pdf" href="'+escapeHtml(link)+'" target="_blank" rel="noopener">📄 View PDF document ↗</a>' : "";
        var linkHtml=isUrl(link) && link !== media && !/\.pdf(?:[?#].*)?$/i.test(String(link)) ? '<a class="content-item-link" href="'+escapeHtml(link)+'" target="_blank" rel="noopener">Open update ↗</a>' : "";
        return '<article class="content-item">'+
          mediaHtml+
          pdfHtml+
          '<div class="content-item-title">'+escapeHtml(titleText)+'</div>'+
          (date ? '<div class="content-item-meta">'+escapeHtml(date)+'</div>' : '')+
          (desc ? '<div class="content-item-desc">'+escapeHtml(desc)+'</div>' : '')+
          linkHtml+
        '</article>';
      }).join("");
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
  }

  function closeContentModal(){
    var modal=document.getElementById("content-modal");
    if(!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    document.body.style.overflow="";
  }

  document.addEventListener("click", function(e){
    var card=e.target.closest ? e.target.closest("[data-content-section]") : null;
    if(card) openContentModal(card.getAttribute("data-content-section"));
    if(e.target.id==="content-modal-close" || e.target.id==="content-modal") closeContentModal();
  });
  document.addEventListener("keydown", function(e){
    if(e.key==="Escape") closeContentModal();
  });

  function apply(data){
    if (!data) return;
    liveData.Notices = data.Notices || [];
    liveData.Gallery = data.Gallery || [];
    liveData.Achievements = data.Achievements || [];
    liveData.Events = data.Events || [];

    renderSection("notices-slot", "📢", liveData.Notices, function(r){
      return { title: r.Title, sub: r.Date || "", link: r.Link };
    }, "Notices");
    renderSection("gallery-slot", "📷", liveData.Gallery, function(r){
      return { title: r.Title, sub: "Camps, events & activities", link: r.Link };
    }, "Gallery");
    renderSection("achievements-slot", "🎖", liveData.Achievements, function(r){
      return { title: r.Title, sub: r.Description || "", link: null };
    }, "Achievements");
    renderSection("events-slot", "📅", liveData.Events, function(r){
      return { title: r.Title, sub: (r.Date ? r.Date + " — " : "") + (r.Description || ""), link: null };
    }, "Events");
  }

  fetch(FEED_URL)
    .then(function(res){ return res.json(); })
    .then(apply)
    .catch(function(){ /* offline or feed unreachable: leave "Coming Soon" cards as-is */ });
})();
