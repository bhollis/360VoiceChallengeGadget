/**
 * @author Benjamin Hollis
 * 
 * Copyright 2008 Benjamin Hollis
 * See license.txt for additional license information.
 */

var HEADER_HEIGHT = 29;
var FOOTER_HEIGHT = 11;
var MIDDLE_HEIGHT = 300;
var SECOND = 1000;
var MINUTE = SECOND * 60;
var HOUR = MINUTE * 60;
var DAY = HOUR * 24;

function init() {  
  if (window.System) {
    window.bgtop  = bg.addImageObject("images/bg_top.png", 0, 0);
    window.middle = bg.addImageObject("images/bg_middle2.png", 0, HEADER_HEIGHT);
    window.footer = bg.addImageObject("images/bg_bottom.png", 0, MIDDLE_HEIGHT + HEADER_HEIGHT); 
        
    updateBackground();
    
    // TODO: Get this working
    System.Gadget.Flyout.file = "Gamercard.html";
    System.Gadget.Flyout.onShow = setupFlyout;
    System.Gadget.Flyout.onHide = hideFlyout;
    
    System.Gadget.settingsUI = "Settings.html";
    System.Gadget.onSettingsClosed = LoadSettings;
  }

  $('#timer a').click(function() {
    if (window.challengeId) {
      System.Shell.execute("http://www.360voice.com/challenge/" + encodeURIComponent(window.challengeId));
    }
    return false;
  });

  LoadSettings();
}

// returns whether or not the challenge is still going
function updateTimeLeft() {
  if( window.clockTimer ) {
    clearTimeout(window.clockTimer);
  }
  
  var dateString = window.endDate + ' 00:00:00 PST';
  var endDate = new Date(dateString);
  
  var nowMs = (new Date()).getTime();
  
  var diff = endDate.getTime() - nowMs;
  
  if (diff < 0) {
    $('#timer')
      .removeClass('finishing')
      .addClass('over')
      .find('.time').text(window.endDate);
    
    return false;
  } else {
    $('#timer').removeClass('over');
  }
  
  var days = Math.floor(diff / DAY);
  diff -= days * DAY;
  var hours = Math.floor(diff / HOUR);
  diff -= hours * HOUR;
  var minutes = Math.floor(diff / MINUTE);
  diff -= minutes * MINUTE;
  var seconds = Math.floor(diff / SECOND);
  
  if ( days == 0 && hours <= 12 ) {
    $('#timer').addClass('finishing')
    .find('.time').text(hours + 'h ' + minutes + 'm');
    
    var timerVal = ((Math.floor(nowMs / MINUTE) + 1) * MINUTE) - nowMs;
    window.clockTimer = setTimeout("updateTimeLeft()", timerVal);
    
  } else {
    $('#timer').removeClass('finishing')
    .find('.time').text(days + 'd ' + hours + 'h');
    
    var timerVal = ((Math.floor(nowMs / HOUR) + 1) * HOUR) - nowMs;
    window.clockTimer = setTimeout("updateTimeLeft()", timerVal);
  }
  
  
  return true;
}

// Check for updated standings every 30 minutes until we get one!
function checkUpdateStandings() {
  clearTimeout(window.checkUpdateTimeout);
  window.checkUpdateTimeout = setTimeout("checkUpdateStandings()", 30 * MINUTE);
  
  $.ajax({
    url: 'http://www.360voice.com/api/jobs.php',
    cache: false,
    timeout: 30 * SECOND,
    dataType: 'xml',
    success: function(data) {
      if ($('job[name=Challenges]', data).attr('complete') == "1") {
        clearTimeout(window.checkUpdateTimeout);
        
        updateStandings();
      }
    }
  });  
}

// Get the new standings. This will retry every minute until it works.
function updateStandings() {
  clearTimeout(window.updateStandingsTimer);
  window.updateStandingsTimer = setTimeout('updateStandings()', MINUTE);

  $.ajax({
    url: 'http://www.360voice.com/api/challenge-details.asp?tag=' + window.gamertag,
    dataType: 'xml',
    cache: false,
    timeout: 30 * SECOND,
    success: function(data) {
      window.challengeId = parseInt($('challengeid', data).text());
      
      $('#loading').hide();
      
      if ( $('error', data).text().indexOf('Invalid:') >= 0) {
        window.challengeId = null;
        clearLiveScoreIntervals();
        $('#noChallenges').show();
        $('#standings, #timer').hide();
        updateBackground();
        return;
      } else {
        $('#noChallenges').hide();
        $('#standings, #timer').show();        
      }
      
      clearTimeout(window.updateStandingsTimer);

      // Really? Not the previous day?
      window.endDate = $('end', data).text();
      
      var stillGoing = updateTimeLeft();
      
      var gamers = [];
      var gamers = $('gamer', data).map(function() {
        return {
          gamertag: $('tag', this).text(),
          score: parseInt($('totalgain', this).text()),
          dailygs: parseInt($('dailygs', this).text())
        };
      }).get();
      
      window.gamers = gamers;
      
      updateGamerList();
      
      if( ! stillGoing ) {
        $('#standings .info:first .emblem').append(
          $('<img/>').attr({
            src: 'images/crown.png'
          })
        );
      } else {
        $('#standings .info:first .emblem').empty();
      }
      
      updateBackground();
      
      // Schedule an update check again at 5AM PST
      var now = new Date();
      
      // If it's less than 5AM PST
      if ( now.getUTCHours() < 13 ) {
        timeToUpdate = now;
      } else {
        timeToUpdate = new Date(now.getTime() + DAY);
      }
      timeToUpdate.setUTCHours(13, 0, 0, 0);
      
      var msToUpdate = timeToUpdate.getTime() - now.getTime();
  		setTimeout("checkUpdateStandings()", msToUpdate); 		

      clearLiveScoreIntervals();

      if (stillGoing) {
        kickOffLiveScoreUpdates(gamers);
      }
    }
  });
}

function handleGamerClick() {
  var alreadySelected = $(this).hasClass('selected');
  $('#standings a').removeClass('selected');

  window.selectedGamertag = $(this).text();

  if ( ! System.Gadget.Flyout.show ) {
    $(this).addClass('selected');
    System.Gadget.Flyout.show = true;
  } else if ( ! alreadySelected ) {
    $(this).addClass('selected');
    setupFlyout();
  } else {
    System.Gadget.Flyout.show = false;
  }
  
  return false;
}

function updateGamerList() {
  $('#standings')
    .items('replace', window.gamers)
    .chain({
      '.livescore': function(data, el) {
        if ( data.livescore ) {
          return '+' + data.livescore;
        } else {
          return '';
        }
      },
      '.score': '{score}',
      '.gamertag': '<a href="#">{gamertag}</a>'
    })
    .find('.gamertag a')
      .click(handleGamerClick)
    .end()
    .find('tr:last')
      .addClass('last');
}

function clearLiveScoreIntervals() {
  // kill all the old intervals
  if (window.liveScoreIntervals) {
    $.each(window.liveScoreIntervals, function(i, interval) {
      clearInterval(interval);
    });
  }
  
  window.liveScoreIntervals = [];
}

function kickOffLiveScoreUpdates(gamers) {  
  // Check each gamertag once an hour
  $.each(gamers, function(i, gamer) {
    updateLiveScore(gamer);
    window.liveScoreIntervals.push(setInterval(function() { updateLiveScore(gamer); }, HOUR));
  });
}

// Every hour. If it fails it'll just get run next hour.
function updateLiveScore(gamer) {
  $.ajax({
    url: 'http://duncanmackenzie.net/services/GetXboxInfo.aspx?GamerTag=' + gamer.gamertag,
    cache: false,
    dataType: 'xml',
    timeout: 30 * SECOND,
    success: function (data) {
      var score = parseInt($('XboxInfo > GamerScore', data).text());
      gamer.livescore = score - gamer.dailygs;
      updateGamerList();
    }
  });
}

function updateBackground() {  
  if ( ! window.System) {
    return;
  }
  
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
}

function setupFlyout() {
  if(System.Gadget.Flyout.show) {
    var flyoutDoc = System.Gadget.Flyout.document;    
		var gamercard = flyoutDoc.getElementById("gamercard");
		gamercard.src = "http://gamercard.xbox.com/" + window.selectedGamertag + ".card";
  }
}

function hideFlyout() {
  $('#standings a').removeClass('selected');
}

// call this at startup / whenever the gamertag is changed
function reset() {
	try {
    $('#loading').show();
    $('#standings, #timer, #noChallenges').hide();
    updateBackground();
    
		// Refresh    
    updateStandings();
	}
	catch (err) {
		throw err;
	}
}

function LoadSettings() {
	try {
    if (window.System) {
      var gamertag = System.Gadget.Settings.read("gamertag") || "Vid Boi" || "ChangeAgent";
      
      window.gamertag = gamertag;
    } else {
      window.gamertag = "Vid Boi";
    }
    
    reset();
	}
	catch (err) {
		debug.innerHTML = err.description;
		throw err;
	}
}