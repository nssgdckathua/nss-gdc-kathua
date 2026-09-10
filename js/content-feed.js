(function(){
  "use strict";

  // Google Apps Script feed
  var FEED_URL = "https://script.google.com/macros/s/AKfycbxEFciYSaJO0F8jtnPuHL2AHQkCIKXaEFI54RXupe-1hic8nlJlDvfxz1-mU-A_qUWD/exec";

  function escapeHtml(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
      return {
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
      }[c];
    });
  }

  function isUrl(s){
    return /^https?:\/\//i.test(String(s || "").trim());
  }

  /*
   * Supports:
   * - Full URLs
   * - Relative paths such as:
   *   media/gallery/photo.jpg
   *   media/gallery/video.mp4
   *   media/documents/notice.pdf
   *
   * Relative paths are automatically resolved from the website URL.
   */
  function resolveMediaUrl(s){
    var value = String(s || "").trim();

    if(!value) return "";

    if(isUrl(value)){
      return value;
    }

    try{
      return new URL(value, document.baseURI).href;
    }catch(e){
      return value;
    }
  }

  function isImage(url){
    return /\.(?:png|jpe?g|gif|webp|svg)(?:[?#].*)?$/i.test(String(url || ""));
  }

  function isVideo(url){
    return /\.(?:mp4|webm|ogg)(?:[?#].*)?$/i.test(String(url || ""));
  }

  function isPdf(url){
    return /\.pdf(?:[?#].*)?$/i.test(String(url || ""));
  }

  function getMediaUrl(row){
    return String(
      row.VideoURL ||
      row.VideoUrl ||
      row.Video ||
      row.ImageURL ||
      row.ImageUrl ||
      row.Image ||
      row.PhotoURL ||
      row.PhotoUrl ||
      row.Photo ||
      row.Thumbnail ||
      row.ThumbnailURL ||
      row.MediaURL ||
      row.MediaUrl ||
      ""
    ).trim();
  }

  function buildCard(icon, title, sub, link, sectionKey){
    var inner =
      '<span class="action-icon">' + icon + '</span>' +
      '<span class="action-text">' +
        '<span class="action-label">' + escapeHtml(title) + '</span>' +
        '<span class="action-sub">' + escapeHtml(sub) + '</span>' +
      '</span>' +
      '<span class="action-chevron">\u203A</span>';

    return '<button type="button" class="action-card live-content" data-content-section="' +
      escapeHtml(sectionKey) + '">' +
      inner +
      '</button>';
  }

  function renderSection(slotId, icon, rows, mapRow, sectionKey){
    var slot = document.getElementById(slotId);
    if(!slot) return;

    if(sectionKey === "Volunteers" && (!rows || !rows.length)){
      slot.remove();
      return;
    }

    if(!rows || !rows.length){
      return;
    }

    // Volunteers always appear as ONE card
    if(sectionKey === "Volunteers"){
      slot.outerHTML =
        '<li>' +
          buildCard(
            icon,
            "NSS Volunteers",
            rows.length + " active volunteer" +
              (rows.length === 1 ? "" : "s") +
              " available",
            null,
            sectionKey
          ) +
        '</li>';
      return;
    }

    var card = slot.querySelector(".action-card");
    if(!card) return;

    var fixedTitle =
      sectionKey === "Notices" ? "Notices" :
      sectionKey === "Gallery" ? "Photo & Video Gallery" :
      sectionKey === "Achievements" ? "Volunteer Achievements" :
      sectionKey;

    var fixedSub =
      sectionKey === "Notices"
        ? rows.length + " notice" + (rows.length === 1 ? "" : "s") + " available"
        : sectionKey === "Gallery"
          ? rows.length + " media item" + (rows.length === 1 ? "" : "s") + " available"
          : sectionKey === "Achievements"
            ? rows.length + " achievement" + (rows.length === 1 ? "" : "s") + " available"
            : rows.length + " updates available";

    var label = card.querySelector(".action-label");
    var sub = card.querySelector(".action-sub");

    if(label) label.textContent = fixedTitle;
    if(sub) sub.textContent = fixedSub;

    card.setAttribute("data-content-section", sectionKey);
  }

  var liveData = {
    Notices: [],
    Events: [],
    Achievements: [],
    Gallery: [],
    Volunteers: []
  };

  var sectionMeta = {
    Notices: {
      title: "Latest Notices",
      kicker: "Circulars, dates & instructions",
      icon: "📢"
    },

    Events: {
      title: "Upcoming Events",
      kicker: "Camps, drives & workshops",
      icon: "📅"
    },

    Achievements: {
      title: "Volunteer Achievements",
      kicker: "Recognitions & honours",
      icon: "🎖"
    },

    Gallery: {
      title: "Photo & Video Gallery",
      kicker: "Camps, events & activities",
      icon: "📷"
    },

    Volunteers: {
      title: "NSS Volunteers",
      kicker: "Active NSS volunteers",
      icon: "👥"
    }
  };

  function parseSheetDate(dateText){
    var text = String(dateText || "").trim();

    var match = text.match(
      /(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/
    );

    if(!match) return null;

    var day = parseInt(match[1], 10);
    var month = parseInt(match[2], 10);
    var year = parseInt(match[3], 10);

    if(!day || !month || !year) return null;

    return new Date(year, month - 1, day);
  }

  function parseEventDate(dateText){
    var text = String(dateText || "").trim();

    var match = text.match(
      /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
    );

    if(!match) return null;

    var day = parseInt(match[1], 10);
    var month = parseInt(match[2], 10);
    var year = parseInt(match[3], 10);

    if(!day || !month || !year) return null;

    return new Date(year, month - 1, day);
  }

  function sortByNewest(rows){
    return rows.slice().sort(function(a, b){

      function parseTimestamp(value){
        var text = String(value || "").trim();

        var match = text.match(
          /^(\d{1,2})\s+(\d{1,2})\s+(\d{4}),\s+(\d{1,2}):(\d{2}):(\d{2})$/
        );

        if(!match) return null;

        return new Date(
          parseInt(match[3], 10),
          parseInt(match[2], 10) - 1,
          parseInt(match[1], 10),
          parseInt(match[4], 10),
          parseInt(match[5], 10),
          parseInt(match[6], 10)
        );
      }

      var timestampA = parseTimestamp(a.Timestamp);
      var timestampB = parseTimestamp(b.Timestamp);

      if(!timestampA && !timestampB) return 0;
      if(!timestampA) return 1;
      if(!timestampB) return -1;

      return timestampB - timestampA;
    });
  }

  function renderContentItem(r){
    var titleText = r.Title || "Untitled";
    var date = r.Date || "";
    var desc = r.Description || "";
    var link = String(r.Link || "").trim();

    var media = getMediaUrl(r);

    /*
     * If MediaURL etc. is empty,
     * Link itself can be an image/video.
     */
    if(!media && (isImage(link) || isVideo(link))){
      media = link;
    }

    var mediaUrl = resolveMediaUrl(media);
    var linkUrl = resolveMediaUrl(link);

    var mediaHtml = "";

    if(mediaUrl){

      if(isVideo(mediaUrl)){

        mediaHtml =
          '<video class="content-item-video" controls preload="metadata" playsinline>' +
            '<source src="' + escapeHtml(mediaUrl) + '">' +
            'Your browser does not support video playback.' +
          '</video>';

      }else if(isImage(mediaUrl)){

        mediaHtml =
          '<a class="content-item-media-link" href="' +
            escapeHtml(mediaUrl) +
            '" target="_blank" rel="noopener">' +
            '<img class="content-item-media" src="' +
              escapeHtml(mediaUrl) +
              '" alt="' +
              escapeHtml(titleText) +
              '" loading="lazy">' +
          '</a>';
      }
    }

    var pdfHtml =
      !media &&
      linkUrl &&
      isPdf(linkUrl)
        ? '<a class="content-item-pdf" href="' +
            escapeHtml(linkUrl) +
            '" target="_blank" rel="noopener">' +
            '📄 View PDF document ↗' +
          '</a>'
        : "";

    var linkHtml =
      linkUrl &&
      linkUrl !== mediaUrl &&
      !isPdf(linkUrl) &&
      !isImage(linkUrl) &&
      !isVideo(linkUrl)
        ? '<a class="content-item-link" href="' +
            escapeHtml(linkUrl) +
            '" target="_blank" rel="noopener">' +
            'Open update ↗' +
          '</a>'
        : "";

    return '<article class="content-item">' +
      mediaHtml +
      pdfHtml +
      '<div class="content-item-title">' +
        escapeHtml(titleText) +
      '</div>' +
      (date
        ? '<div class="content-item-meta">' +
            escapeHtml(date) +
          '</div>'
        : '') +
      (desc
        ? '<div class="content-item-desc">' +
            escapeHtml(desc) +
          '</div>'
        : '') +
      linkHtml +
    '</article>';
  }

  function openContentModal(sectionKey){
    var modal = document.getElementById("content-modal");
    var body = document.getElementById("content-modal-body");
    var title = document.getElementById("content-modal-title");
    var kicker = document.getElementById("content-modal-kicker");

    if(!modal || !body || !title || !kicker) return;

    var meta = sectionMeta[sectionKey] || sectionMeta.Notices;
    var rows = liveData[sectionKey] || [];

    title.textContent = meta.icon + "  " + meta.title;
    kicker.textContent = meta.kicker;

    if(!rows.length){

      body.innerHTML =
        '<div class="content-empty">' +
          '<strong>No updates yet</strong>' +
          '<span>New ' +
            escapeHtml(meta.title.toLowerCase()) +
            ' will appear here automatically.' +
          '</span>' +
        '</div>';

    }else{

      if(sectionKey === "Events"){

        var today = new Date();

        today = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );

        var upcoming = [];
        var past = [];

        rows.forEach(function(r){
          var eventDate = parseEventDate(r.Date);

          if(eventDate && eventDate >= today){
            upcoming.push(r);
          }else{
            past.push(r);
          }
        });

        // Nearest upcoming event first
        upcoming.sort(function(a, b){
          var dateA = parseEventDate(a.Date);
          var dateB = parseEventDate(b.Date);

          if(!dateA && !dateB) return 0;
          if(!dateA) return 1;
          if(!dateB) return -1;

          return dateA - dateB;
        });

        // Most recent past event first
        past.sort(function(a, b){
          var dateA = parseEventDate(a.Date);
          var dateB = parseEventDate(b.Date);

          if(!dateA && !dateB) return 0;
          if(!dateA) return 1;
          if(!dateB) return -1;

          return dateB - dateA;
        });

        var html = "";

        if(upcoming.length){
          html +=
            '<div class="content-section-title">' +
              'Upcoming Events' +
            '</div>';

          html += upcoming.map(renderContentItem).join("");
        }

        if(past.length){
          html +=
            '<div class="content-section-title">' +
              'Past Events' +
            '</div>';

          html += past.map(renderContentItem).join("");
        }

        body.innerHTML = html;

      }else{

        body.innerHTML = rows.map(function(r){
          return renderContentItem(r);
        }).join("");
      }
    }

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeContentModal(){
    var modal = document.getElementById("content-modal");

    if(!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", function(e){

    var card =
      e.target.closest
        ? e.target.closest("[data-content-section]")
        : null;

    if(card){
      openContentModal(
        card.getAttribute("data-content-section")
      );
    }

    if(
      e.target.id === "content-modal-close" ||
      e.target.id === "content-modal"
    ){
      closeContentModal();
    }
  });

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape"){
      closeContentModal();
    }
  });

  function apply(data){
    if(!data) return;

    liveData.Notices =
      sortByNewest(data.Notices || []);

    liveData.Gallery =
      sortByNewest(data.Gallery || []);

    liveData.Achievements =
      sortByNewest(data.Achievements || []);

    liveData.Events =
      data.Events || [];

    liveData.Volunteers =
      data.Volunteers || [];

    renderSection(
      "notices-slot",
      "📢",
      liveData.Notices,
      function(r){
        return {
          title: r.Title,
          sub: r.Date || "",
          link: r.Link
        };
      },
      "Notices"
    );

    renderSection(
      "gallery-slot",
      "📷",
      liveData.Gallery,
      function(r){
        return {
          title: r.Title,
          sub: "Camps, events & activities",
          link: r.Link
        };
      },
      "Gallery"
    );

    renderSection(
      "achievements-slot",
      "🎖",
      liveData.Achievements,
      function(r){
        return {
          title: r.Title,
          sub: r.Description || "",
          link: null
        };
      },
      "Achievements"
    );

    renderSection(
      "events-slot",
      "📅",
      liveData.Events,
      function(r){
        return {
          title: r.Title,
          sub:
            (r.Date ? r.Date + " — " : "") +
            (r.Description || ""),
          link: null
        };
      },
      "Events"
    );

    renderSection(
      "volunteers-slot",
      "👥",
      liveData.Volunteers,
      function(r){
        return {
          title: r.Title,
          sub: r.Description || "",
          link: null
        };
      },
      "Volunteers"
    );
  }

  fetch(FEED_URL)
    .then(function(res){
      return res.json();
    })
    .then(apply)
    .catch(function(){
      /*
       * Offline or feed unreachable:
       * leave existing "Coming Soon" cards as-is.
       */
    });

})();