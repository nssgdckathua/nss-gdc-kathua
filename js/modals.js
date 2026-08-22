(function(){
  var modal = document.getElementById("join-modal");
  var openButton = document.getElementById("join-nss-button");
  var closeButton = document.getElementById("join-modal-close");

  if (!modal || !openButton || !closeButton) return;

  function openJoinModal(){
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
  }

  function closeJoinModal(){
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    document.body.style.overflow="";
  }

  openButton.addEventListener("click", openJoinModal);
  closeButton.addEventListener("click", closeJoinModal);

  modal.addEventListener("click", function(e){
    if(e.target === modal) closeJoinModal();
  });

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape") closeJoinModal();
  });
})();
</script>


<script>
(function(){
  var modal = document.getElementById("programme-modal");
  var openButton = document.getElementById("programme-officers-button");
  var closeButton = document.getElementById("programme-modal-close");

  if (!modal || !openButton || !closeButton) return;

  function openProgrammeModal(){
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
    document.body.style.overflow="hidden";
  }

  function closeProgrammeModal(){
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden","true");
    document.body.style.overflow="";
  }

  openButton.addEventListener("click", openProgrammeModal);
  closeButton.addEventListener("click", closeProgrammeModal);

  modal.addEventListener("click", function(e){
    if(e.target === modal) closeProgrammeModal();
  });

  document.addEventListener("keydown", function(e){
    if(e.key === "Escape") closeProgrammeModal();
  });
})();
