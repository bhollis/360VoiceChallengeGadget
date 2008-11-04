/**
 * @author Benjamin Hollis
 * 
 * Copyright 2008 Benjamin Hollis
 * See license.txt for additional license information.
 */

var HEADER_HEIGHT = 29;
var FOOTER_HEIGHT = 11;
var MIDDLE_HEIGHT = 300;

function init() {  

	window.bgtop  = bg.addImageObject("images/bg_top.png", 0, 0);
	window.middle = bg.addImageObject("images/bg_middle2.png", 0, HEADER_HEIGHT);
	window.footer = bg.addImageObject("images/bg_bottom.png", 0, MIDDLE_HEIGHT + HEADER_HEIGHT); 
  
  updateBackground();
/*
  System.Gadget.background = "images/bg_top.png";
*/  
  /*
  System.Gadget.onUndock = dockedState;
  System.Gadget.onDock = dockedState; 
  
  System.Gadget.settingsUI = "Settings.html";
  System.Gadget.onSettingsClosed = LoadSettings;
  
  System.Gadget.Flyout.file = "Gamercard.html";
  System.Gadget.Flyout.onShow = setupFlyout;
  
  var bungieCardImg = document.getElementById("bungieCardImg");
  bungieCardImg.ondblclick = loadHaloStats;
      
	LoadSettings();
	dockedState();
	update();
	*/
}

function updateBackground() {
  var height = $('#container').height() + FOOTER_HEIGHT - 5;
  $('body').css('height', height);
	bg.style.height = height;
	window.middle.height = height - HEADER_HEIGHT - FOOTER_HEIGHT;
	
  // I think this is required or else it goes all screwy.
	if(window.middle.height % 2 > 0)
		window.middle.height += 1;
	
	//workaround for a bug:
  // Apparently top is calculated from the middle  of the original image size backwards or something?
	window.middle.top = HEADER_HEIGHT - (MIDDLE_HEIGHT - window.middle.height) / 2;
	window.footer.top = height - FOOTER_HEIGHT;
  window.bgtop.top = 0;
  
  $('#timer').focus();
}

// Load the Halo 3 stats
function loadHaloStats() {
     System.Shell.execute("http://www.bungie.net/Stats/Halo3/Default.aspx?player=" + encodeURIComponent(window.gamertag));     
}

function cardClick() {
  if( System.Gadget.docked ) {
    System.Gadget.Flyout.show = ! System.Gadget.Flyout.show;
  }
  return true;
}

function setupFlyout() {
  if(System.Gadget.Flyout.show) {
    var flyoutDoc = System.Gadget.Flyout.document;
    var flyoutImg = flyoutDoc.getElementById("bungieCardFlyoutImg");
    flyoutImg.src = getCardUrl("halo3");
    flyoutImg.ondblclick = loadHaloStats;
  }
}

function updateBungieCard() {
		var bungieCardImg = document.getElementById("bungieCardImg");
		var imgSrc = getCardUrl( ( System.Gadget.docked ) ? "halo3sm" : window.cardType );
    //Might be needed to refresh?
    //bungieCardImg.src = "";
    bungieCardImg.src = imgSrc;
}

function getCardUrl(cardType) {
  return "http://www.bungie.net/card/"
      + cardType
      + "/" 
      + window.gamertag 
      + ".ashx";
}

function update() {
	try {
		// Refresh
    updateBungieCard();
		setTimeout("update()", 30 * 60 * 1000); // 30 mins
	}
	catch (err) {
		throw err;
	}
}

function updateCardType() {
  if ( ! System.Gadget.docked ) {
    if (window.cardType == "halo3sm" ) {
	   document.body.style.width = "204px";
	   document.body.style.height = "140px";
    }
    else {
	   document.body.style.width = "550px";
	   document.body.style.height = "86px";
    }
  }
}

function dockedState() {
  var bungieCardImg = document.getElementById("bungieCardImg")
	System.Gadget.beginTransition();
	if (System.Gadget.docked) {
	   document.body.style.width="130px";
	   document.body.style.height="91px";
     // This could be used to scale the card better, but seems to be disallowed
     bungieCardImg.style.filter ="progid:DXImageTransform.Microsoft.BasicImage(opacity=100)";
     document.body.style.zoom = "64%";
     
     bungieCardImg.onclick = cardClick;
	}
	else {
     //bungieCardImg.style.filter = "";
	   document.body.style.zoom="100%";
     updateCardType();
     bungieCardImg.onclick = null;
	}
	System.Gadget.endTransition(System.Gadget.TransitionType.morph, 0.2);
  updateBungieCard();
}

function LoadSettings() {
	try {
		var gamercard = document.getElementById("gamercard");
		var gamertag = System.Gadget.Settings.read("gamertag") || "ChangeAgent";
		
		window.gamertag = gamertag;
    
		updateBungieCard();
	}
	catch (err) {
		debug.innerHTML = err.description;
		throw err;
	}
}