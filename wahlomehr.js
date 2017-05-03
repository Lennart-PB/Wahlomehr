//console.log("Wahl-O-Mehr aktiv");

// Die Kennnummern aller teilnehmenden Parteien in ein Array speichern
function getPartyNo() {
	var partyNoArray = [];
	var ul = document.getElementsByClassName("wom_parteien_list");
	
	// ul -> li -> label
	for (var i = 0; i < ul.length; i++) {
		var child = ul[i].children;
		for (var j = 0; j < child.length; j++) {
			var strNo = child[j].children[0].getAttribute("for");
			var partyNo = strNo.split("cb_parteien_");			
			partyNoArray.push(partyNo[1]);
		}		
	}	
	return partyNoArray;
}

// Redirected bis alle Parteien einmal mit dem Nutzerergebnis verglichen wurden
function redirect(parties) {
	var next = '';
	// Erstes aufrufen
	var loc = window.location.href;
	if(loc.includes("cb_themen")) {
		next = window.location.href.replace("cb_themen","cb_parteien");	
	}
	// Wurde schon redirected
	else if(loc.includes("cb_parteien")){
		var urlParts = loc.split("&cb_parteien");
		next = urlParts[0];
	}
	
	var append = 8;
	if(parties.length < 8) {
		append = parties.length;
	}
	
	for(var k = 0; k < append; k++) {
		var nr = parties.shift();
		next += '&cb_parteien_' + nr + '=1';		
	}
	
	// Store Array
	chrome.storage.local.set({'partyNo': parties});		
	// Redirect
	window.location.href = next;
}

// Speichert Name, Übereinstimmung, CSS, Bild und Beschreibung aller Parteien in ein Array/Local
function getResults(resultArray = []) {
	// Länge des evtl schon existierenden resultarrays abfragen
	var stock = resultArray.length;
	var ul = document.getElementsByClassName("wom_ergebnis_list");	
	var li = ul[0].children;
	
	// li -> span -> span; li -> div -> div -> img; li -> div -> div -> p
	for (var j = 0; j < li.length; j++) {
		var partyName = li[j].children[0].children[0].textContent;
		var partyPercent = li[j].children[0].children[1].textContent;
		var partyStyle = li[j].children[0].children[1].getAttribute("style");	
		var partyImg = li[j].children[1].children[0].children[0].getAttribute("src");
		var partyDesc = li[j].children[1].children[0].children[2].textContent;
		// j + resultArray length
		if (!resultArray[j+stock]) resultArray[j+stock] = [];
		resultArray[j+stock][0] = partyName;
		resultArray[j+stock][1] = partyPercent;
		resultArray[j+stock][2] = partyStyle;
		resultArray[j+stock][3] = partyImg;
		resultArray[j+stock][4] = partyDesc;
	}	
	chrome.storage.local.set({'results': resultArray});		
}

// Sort function
function sortByPercent(a, b) {
	if(a[1] === b[1]) {
		return 0;
	}
	else {
		return (a[1] > b[1]) ? -1 : 1;
	}
}

// Ergebnisse geordnet anzeigen
function showResults(results) {
	results.sort(sortByPercent);	
	$('.wom_ergebnis_list').empty();
	var ul = document.getElementsByClassName("wom_ergebnis_list");
	ul[0].id = 'wel';
	for(var i = 0; i < results.length; i++) {
		$('#wel').append('<li id="li'+i+'"></li>');
		
			$('#li'+i).append('<span class="wom_ergebnis_balken" role="tab" id="result'+i+'"></span>');
				$('#result'+i).append('<span class="wom_ergebnis_partei" id="party'+i+'">'+results[i][0]+'</span>');
				$('#result'+i).append('<span class="wom_ergebnis_prozent ep1 transition" id="percent'+i+'">'+results[i][1]+'</span>');
				
			$('#li'+i).append('<div style="display:none" id="info'+i+'"></div>');
				$('#info'+i).append('<img width="90" height="90" style="border:0px;" src="'+results[i][3]+'" alt="Logo von:'+results[i][0]+'">');
				$('#info'+i).append('<h2>'+results[i][0]+'</h2>');
				$('#info'+i).append('<p>'+results[i][4]+'</p>');
				
		setClick(i);
	}	
}

// Balken klickbar machen
function setClick(i) {
	$('#percent'+i).click(function() {
		$('#info'+i).toggle();
	});
}

$(document).ready(function() {	
	// Ergebnisseite
	var loc = window.location.href;
	if(loc.includes("cb_parteien")) {
		// Ergebnisdaten abgreifen
		chrome.storage.local.get("results", function (data) {
			// Falls noch keine Datei existiert
			if(chrome.runtime.lastError) {
				getResults();
			}
			else {
				getResults(data.results);
			}
		})		
		chrome.storage.local.get("partyNo", function (data) {
			// Wenn alle Ergebnisse abgefragt wurden
			if(data.partyNo.length == 0) {
				chrome.storage.local.get("results", function (data) {
					showResults(data.results);
				})
			}
			else {
				chrome.storage.local.get("partyNo", function (data) {
					redirect(data.partyNo);
				})
			}
		})
	}
	// Auswahl
	else if(loc.includes("cb_themen")) {		
		chrome.storage.local.clear();
		// Kennnummern aller Parteien abgreifen und auf Ergebnisseite mit den ersten 8 redirecten
		redirect(getPartyNo());
	}
});