// ==UserScript==
// @name        PlayFilter
// @namespace   MrBrax
// @description Hide unwanted shows from VOD sites.
// @include     http://www.svtplay.se/*
// @include     http://www.oppetarkiv.se/*
// @include     http://www.tv6play.se/*
// @include     http://www.tv3play.se/*
// @include     http://www.tv8play.se/*
// @include     http://www.tv10play.se/*
// @include     http://www.dplay.se/*
// @include     https://www.twitch.tv/directory/*
// @require		https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js
// @updateURL 	http://files.dongers.net/userscripts/svtplay_filter.user.js
// @version     1.46
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_addStyle
// ==/UserScript==

// TODO: Transition from jQuery
// TODO: Transition from this cpu-intensive function below

/*--- waitForKeyElements():  A utility function, for Greasemonkey scripts,
	that detects and handles AJAXed content.

	Usage example:

		waitForKeyElements (
			"div.comments"
			, commentCallbackFunction
		);

		//--- Page-specific function to do what we want when the node is found.
		function commentCallbackFunction (jNode) {
			jNode.text ("This comment changed by waitForKeyElements().");
		}

	IMPORTANT: This function requires your script to have loaded jQuery.
*/
function waitForKeyElements ( selectorTxt, actionFunction, bWaitOnce, iframeSelector ) {
	var targetNodes, btargetsFound;

	if (typeof iframeSelector == "undefined")
		targetNodes     = $(selectorTxt);
	else
		targetNodes     = $(iframeSelector).contents ()
										   .find (selectorTxt);

	if (targetNodes  &&  targetNodes.length > 0) {
		btargetsFound   = true;
		/*--- Found target node(s).  Go through each and act if they
			are new.
		*/
		targetNodes.each ( function () {
			var jThis        = $(this);
			var alreadyFound = jThis.data ('alreadyFound')  ||  false;

			if (!alreadyFound) {
				//--- Call the payload function.
				var cancelFound     = actionFunction (jThis);
				if (cancelFound)
					btargetsFound   = false;
				else
					jThis.data ('alreadyFound', true);
			}
		} );
	}
	else {
		btargetsFound   = false;
	}

	//--- Get the timer-control variable for this selector.
	var controlObj      = waitForKeyElements.controlObj  ||  {};
	var controlKey      = selectorTxt.replace (/[^\w]/g, "_");
	var timeControl     = controlObj [controlKey];

	//--- Now set or clear the timer as appropriate.
	if (btargetsFound  &&  bWaitOnce  &&  timeControl) {
		//--- The only condition where we need to clear the timer.
		clearInterval (timeControl);
		delete controlObj [controlKey]
	}
	else {
		//--- Set a timer, if needed.
		if ( ! timeControl) {
			timeControl = setInterval ( function () {
					waitForKeyElements (    selectorTxt,
											actionFunction,
											bWaitOnce,
											iframeSelector
										);
				},
				300
			);
			controlObj [controlKey] = timeControl;
		}
	}
	waitForKeyElements.controlObj   = controlObj;
}

SVTPlayFilter = {};
SVTPlayFilter.IMG_CROSS 		= "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC30lEQVRYhe2WP2gTURzHf2CEIh1ErGCb97uHdsjQoWCHDh0yuChWOrTQocPl/S4hFIcMHXQqTgXBURw6duiQ0cHBwcFBUbHo4lAwSMrd/V7ADBk6dDiHXNK7y+XuCs0N4g/eknt3n+/3/f68APyPnMKV1rIW9J6ROi6qRq5wjWqFkXqM5PnrVM9sT+cCZ0FrjHQUgHuM9K1j1G5PHB7j3GOkMwcr6xOHj3HezSX/E4Hb0ixptPY0qiYL+shI7eDHGamlUa1c6rF3pXmdhar7QC9puagalwb37tWuOgY9YbR+pIEZ6dRF9TTp2G1pljwoFzLBT+asokbrTQZwJueBZx9O5qxiItwpWmU/n1HQcSDnp2zQW995VnjgRCqPYuFjPuSwUHUPygVG6jCS5wpaAADQM9vTadXuP2/HiQvDZXUxCteomi1pTgEA6CLNDwSlCB46t4VaAvALGekguk+jWgGAfnsxkhPeYL0OFk1AgGdLs5TkfCBsIOBcsLUX2d/TsroIGulL5MFBXIoGAFeox+PgrqBNjeonG6R7d+u3RtM8IuII+u0WVsaC1uJqRBvWwxjB3dFitN5F33cFLYyctEE74MHGFUb1Ipx/+qORngXTEJ+qfs6Hzvu//WJU98PiaYMN+h6Bv7Rna9cAAMCDckGjakbbTyPtAwC4SKsa1ed059RjtLbO06buMNJzFvQ79K6gV+0i3QgdkQflgjboMLhxMMXGOQ/Au9qgQ0eaEgCgJc0pV9AmI7VGTalm4lRkVLtZ4AAAtlBLukjzemZ72pZmycHKut9y0fb0GOmMUe1mGsm2NEsZnbc5fnJG15GW1cVU8LBojOoDFvQpQ87T1jEbtJP5Ihq4z+A8CdrTSPvDSXeR6CCtMtLXOOdDgbO1m7ZQSyxozUXVcFE1HKysu9JaTr3tkiJ2UOT1BxIAINqCUecTj0jP5uf8XIC1xf07vx13F+QSLWlOXahl/oX4C5DN/R7VUqVHAAAAAElFTkSuQmCC";
SVTPlayFilter.IMG_CONFIG 		= "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/GMzLdsAADowaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/Pgo8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzExMSA3OS4xNTgzMjUsIDIwMTUvMDkvMTAtMDE6MTA6MjAgICAgICAgICI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iCiAgICAgICAgICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZXhpZj0iaHR0cDovL25zLmFkb2JlLmNvbS9leGlmLzEuMC8iPgogICAgICAgICA8eG1wOkNyZWF0b3JUb29sPkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE1IChXaW5kb3dzKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxNi0wMS0yNVQxNDo0Mjo0OCswMTowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TWV0YWRhdGFEYXRlPjIwMTYtMDEtMjVUMTQ6NDI6NDgrMDE6MDA8L3htcDpNZXRhZGF0YURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE2LTAxLTI1VDE0OjQyOjQ4KzAxOjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcE1NOkluc3RhbmNlSUQ+eG1wLmlpZDpjYjc0ZjE4Zi02MzJmLTE0NDItODZkNS0xN2E2YzFkODY2MDc8L3htcE1NOkluc3RhbmNlSUQ+CiAgICAgICAgIDx4bXBNTTpEb2N1bWVudElEPmFkb2JlOmRvY2lkOnBob3Rvc2hvcDo4MDYyYTJkNi1jMzY5LTExZTUtYmYwYi1lYzY2YWU5NTZkMjM8L3htcE1NOkRvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+eG1wLmRpZDo4ZDlkZjY3MS00OGUwLTVhNDAtYWYxZi05MmExYjVjNDkyOWY8L3htcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD4KICAgICAgICAgPHhtcE1NOkhpc3Rvcnk+CiAgICAgICAgICAgIDxyZGY6U2VxPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5jcmVhdGVkPC9zdEV2dDphY3Rpb24+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDppbnN0YW5jZUlEPnhtcC5paWQ6OGQ5ZGY2NzEtNDhlMC01YTQwLWFmMWYtOTJhMWI1YzQ5MjlmPC9zdEV2dDppbnN0YW5jZUlEPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6d2hlbj4yMDE2LTAxLTI1VDE0OjQyOjQ4KzAxOjAwPC9zdEV2dDp3aGVuPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6c29mdHdhcmVBZ2VudD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNSAoV2luZG93cyk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOmNiNzRmMThmLTYzMmYtMTQ0Mi04NmQ1LTE3YTZjMWQ4NjYwNzwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxNi0wMS0yNVQxNDo0Mjo0OCswMTowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTUgKFdpbmRvd3MpPC9zdEV2dDpzb2Z0d2FyZUFnZW50PgogICAgICAgICAgICAgICAgICA8c3RFdnQ6Y2hhbmdlZD4vPC9zdEV2dDpjaGFuZ2VkPgogICAgICAgICAgICAgICA8L3JkZjpsaT4KICAgICAgICAgICAgPC9yZGY6U2VxPgogICAgICAgICA8L3htcE1NOkhpc3Rvcnk+CiAgICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2UvcG5nPC9kYzpmb3JtYXQ+CiAgICAgICAgIDxwaG90b3Nob3A6Q29sb3JNb2RlPjM8L3Bob3Rvc2hvcDpDb2xvck1vZGU+CiAgICAgICAgIDxwaG90b3Nob3A6SUNDUHJvZmlsZT5zUkdCIElFQzYxOTY2LTIuMTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICAgIDx0aWZmOk9yaWVudGF0aW9uPjE8L3RpZmY6T3JpZW50YXRpb24+CiAgICAgICAgIDx0aWZmOlhSZXNvbHV0aW9uPjcyMDAwMC8xMDAwMDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+NzIwMDAwLzEwMDAwPC90aWZmOllSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpSZXNvbHV0aW9uVW5pdD4yPC90aWZmOlJlc29sdXRpb25Vbml0PgogICAgICAgICA8ZXhpZjpDb2xvclNwYWNlPjE8L2V4aWY6Q29sb3JTcGFjZT4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjY0PC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxZRGltZW5zaW9uPjY0PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgCjw/eHBhY2tldCBlbmQ9InciPz5V/AdMAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAZTSURBVHja5Jt5bBVVFMZ/HRSUshS0VIJgFESDEsIAEaM1VnGHBCsqGEeNK0YwMRhiWYQWw6qYKImokZiMCyqoCYvgRiREIcXRxCUCRcOiFIpQVpeGqX/cUxiG1/funRkfHfgSQjPvLud+c+fOOd85U9DY2MjpjDPiDuBZjknzQcA04EKgNdARsIB64CCwC5gPvK87oO27J5cAQ7wJ9MlwvaP8fxlQBqwGavNhkJXHxRcC52m27Zkvo/JJQGegvWbbtqciAVcCZ2q2HXwqEvCMQdvHWuxbwLOcXsBM4E/gaeCARrfJQH+DaboBLwDjNG26ExgIvGH77kaT9RSY+AGe5VwLfAQUyaWNwL1AdZZuFcD0iDeoQsjOhucDRO0Dbrd9d1XiBHiWMwJYCLQK/dQAvA24wBZgL9AV6AeMkWc/DlbIIquB/XKtBLgReAK4ItTeB0bavvtBYgR4ljNc7nwuHBanpiQDUXGxFdgOtAF6AMU52o+wfXdxbAI8yykVxySNKLV9d01kAjzLuRRYB3RIKQH1wGDbdzdEfQ2OTfHikcN6Zhw/YBXpR01kAmzfXQTMTvHi1wOTkngLrAZKU7b4vcAltu/WJeEKP5fCuz8v1+JNCPhcnJy0oAF4N7FgyPZdX5yQtGC3rr0m0eA/KSLgsK69WgR4ltMGuDhFBHRFU33S3QGDgO4pIqCt2JwYAXHfAl8Bo4DLJYp7saUIMDrBUCXwrOHkB4F28vdrzSg8NwOfRBxTF1Ns362KtAM8yynxLGe+4eJ3Ak7gBK6heXlrBTDLYOztMvYugz6VnuVM9yzHyrkDPMspQWn2xcBVwD3AuQaTVctdPSJRGEAlMDVLn4uEpAKD4KYV8CkwwMC2n4BXxDXeZPvunuMI8CxnGCpp0Tni87YcGAo0igr0slx/CFiQpV8HoA6VJdLBWGCeELYUuDWCrbuAb4Hxtu/+2LQ1KmIsfiVwmyweoFPgtz45+vYwWHxw7EaZc2kEe7sAt6BScEfPgE4RF78FeDCLw+SQPRcwznC+sHMzTO5mFBQHCTg7wgD/AuOBQxlUmCDby5sRVcYADxjOuSPDtSHyhjBF6yABRYadG1FK7VqUFB3ErxkM/BmoAu4CHgU+C5wTJqgLH5i279YDN6DUYBN0hGOJET+CMZuBbRmufwf8jkpuNKEbKjkSB1vl9E8KVnAH7DPsXAC8xLG0djgQee9/8OwWyI1qDPkrRbKjTNN89UECokR6haIThPGXPB6HE47uZmfRKtpFGPNgkIDdEQ0bACxp5rB6OEEC7hdiw1hi6BCFD/GjBDwufvnOCAMNBZZl8OYWAjMSWPwMYFGGR3CZzB0Fe4E5JwRDnuV0Eve0PzDakN1qcZ9rQoZOjRBMNaEKmBK61gt4RzfcDcQRrwPfo0pvttm+uyNnNOhZTpXh6f038KRMFsQdqARFL81xaiScDef2HpHD9ywDm+YClbbv7o8aDk/JEdBkwmpUSnxlaDeMBspRGePCUJ9DwDfAh+KmBg27CZgAXGNoR4XtuzNj6QFCwvqIh82XqLT5xyEPEVRFWJNsVSsRWzjyGy7u9HUR5v7C9t0hsQURIaA8w3Y0PXRWid++BvhBroUDnb7A1UJ2WYwYBTQyw0FPUOeAO5Rh25pEceXyL7jlm8pr2scYOxO2kb1qxZiAHeLe9k7QyMKEFx3EJtt3k5PF5dRtR3rQxigg0EB3cpektCScn00HjELAKPSLHFsCLpAwPD4BnuUUi3iRNkyKTYCkxJbHfB2dLJR6ljMr7g6YhqrATCvGS31jZAJ6kn6UxSFgQgS1qCXhADm0x1xFUhtixNwtAUNt3/0l1ltA/OkRGpPVia//NUrATBo+8AcnyvDNodz23ZwVrrolMotRkvaRDD+vA+6TQGYgKq/YFyVVJ6HiNo3fT8btB1yPSuU1NEPUSNt3dWqbjcvly1BF001q8BxUciQbJhK9vmAi2UvtBwFvBWKUernzyZfLB0jojUp6Vtu+u0jzs7m5wFOGi5+sSVx7lAp9jgggm0wmKYj74aTBd4PbOT5ZknVYXQEm7neD+fxm6FWDtrPyZVQ+CVir2a4BpQ2ecgToZooOAHtORQI2a7arNXjXx0Y+vx2uBe5GSeNdUHJYkfy2D5Wf/I34WWQjFJzun8//NwDdALirWZnEEwAAAABJRU5ErkJggg==";
SVTPlayFilter.Data = {};
SVTPlayFilter.Trigger = {};
SVTPlayFilter.CurrentSite = "unknown";
SVTPlayFilter.CurrentlyHidden = 0;
SVTPlayFilter.Ignore = {
	"undefined":true,
	"http://cdn.playstatic.mtgx.tv/static/ui/img/clip-small-placeholder.png":true
}

// html
SVTPlayFilter.HTMLCross = "<img title='Hide show permanently' class='playfilter-button-hide' src='data:image/gif;base64," + SVTPlayFilter.IMG_CROSS + "'>";
SVTPlayFilter.ConfigButton = "<img title='Config' class='hidebutton' id='playfilter-button-config' src='data:image/png;base64," + SVTPlayFilter.IMG_CONFIG + "'>";

var xml_parser = new DOMParser();
SVTPlayFilter.NodeCross = xml_parser.parseFromString(SVTPlayFilter.HTMLCross, "text/xml");
SVTPlayFilter.NodeConfig = xml_parser.parseFromString(SVTPlayFilter.ConfigButton, "text/xml");

console.log( "NodeCross", SVTPlayFilter.NodeCross );

GM_addStyle(".playfilter-bar { position:fixed; left:0; bottom:0; padding:5px; color#fff; background: rgba(0,0,0,.6); }");
GM_addStyle(".playfilter-bar-config { width:16px !important; height:16px !important; vertical-align:-3px; cursor:pointer }");
GM_addStyle(".playfilter-bar-num { width:16px !important; height:16px !important; margin-left: 5px; cursor:pointer; color:#fff; font-size:12px; }");
GM_addStyle(".playfilter-button-hide { width:16px !important; height:16px !important; vertical-align:-3px; margin-right:4px; cursor:pointer; opacity:0.6; }");
GM_addStyle(".playfilter-button-hide:hover { opacity:1; }");
GM_addStyle("#playconfig { all:initial; * { all:unset; } }");
GM_addStyle("#playconfig { font-size:18px; font: 14px Arial; background:#111; color:#dfd; padding:20px; position:fixed; width:800px; margin-left:-410px; left:50%; top:50px; z-index:9999999 }");
GM_addStyle("#playconfig h1 { font-size:24px; font-weight:bold; }");
GM_addStyle("#playconfig input, #playconfig button, #playconfig select { font-size:14px; font-family:Arial; padding:2px 6px; border:1px solid #888; background:#000; border-radius:0; margin:2px; color:#eee; }");
GM_addStyle("#playconfig select { font-size: 14px; width:800px }");
//GM_addStyle("#playconfig button { font-size:14px; font-family:monospace; padding:2px 6px; border:1px solid #0f0; background:#000; border-radius:0; margin:2px; color:#0f0; }");

SVTPlayFilter.OpenConfig = function(){

	SVTPlayFilter.LoadData();
	
	var conf = "<div id='playconfig'></div>";
	
	var w = $(conf).appendTo("body");
	
	$("<h1>PlayFilter v" + GM_info.script.version + " config (" + SVTPlayFilter.CurrentSite + ")</h1>").appendTo(w);
	
	var rearrange = $("<input type='checkbox' " + ( SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].DisableRearrange ? "checked='checked'" : "") + ">").appendTo(w);
	$("<span> Disable rearranging of items after hiding</span>").appendTo(w);

	var hidepremium = $("<br><input type='checkbox' " + ( SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].HidePremium ? "checked='checked'" : "") + ">").appendTo(w);
	$("<span> Hide premium/subscription videos</span>").appendTo(w);

	// video list
	var videolist = $("<br><br>Video list<br><select multiple size=12></select>").appendTo(w);
	var videolist_remove = $("<br><button>Remove</button>").appendTo(w).click(function(){
		$('option:selected', videolist).each(function(){
			delete SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide[ $(this).val() ];
			$(this).remove();
		});
	});

	//for(var ident in SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide){
	//	if( ident != SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide[ ident.trim() ]){
	//		SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide[ ident.trim() ] = true;
	//		delete SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide[ ident ];
	//	}
	//}

	var sortable = [];
	for(var ident in SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide){
		sortable.push( ident.trim() );
	}

	sortable.sort();

	for(var i = 0; i < sortable.length; i++){
	//$.each(SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide, function(key, value) {
		var key = sortable[i];
		if(SVTPlayFilter.Ignore[key]) continue;
		//var short = key.substring(key.length-90,key.length);
		videolist.append($("<option></option>").attr("value",key).text(key + " (" + key.length + ")")); 
	//});
	}
	
	$("<br><br><button>Save</button>").appendTo(w).click(function(){
		SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].DisableRearrange = rearrange.is(":checked");
		SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].HidePremium = hidepremium.is(":checked");
		SVTPlayFilter.SaveData();
		SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite].Update();
		w.remove();
	});
	
	$(" <button>Close</button>").appendTo(w).click(function(){
		w.remove();
	});
	
}

// helper funcs
var matches = function(el, selector) {
  return (el.matches || el.matchesSelector || el.msMatchesSelector || el.mozMatchesSelector || el.webkitMatchesSelector || el.oMatchesSelector).call(el, selector);
};

SVTPlayFilter.Trigger["svtplay"] = {

	Element: "article.play_videolist-element",

	CheckType: "article",
	CheckClass: "play_videolist-element",

	Update: function(){
		var _this = SVTPlayFilter.Trigger[ SVTPlayFilter.CurrentSite ];
		var qs = document.querySelectorAll( _this.Element );
		if(qs){
			for( i in qs ){
				_this.Func( qs[i] );
			}
		}
	},

	Func: function(video){

		if(!video.querySelector){
			console.log("No querySelector for: ", video);
			return;
		}

		var ident = video.querySelector(".play_videolist-element__title-text, .play_videolist-element__title")
		var ident_text = ident ? ident.textContent.trim() : false;

		//console.info("[PlayFilter] Got video node ", ident_text);

		if(!ident_text){ console.error("Couldn't find video info: ", ident, ident_text); return; }
		var _this = SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite];
		
		if(SVTPlayFilter.InFilter(ident_text)){
			console.info("[PlayFilter] Hide video ", ident_text);
			SVTPlayFilter.CurrentlyHidden++;
			SVTPlayFilter.StatusUpdate();
			video.parentNode.removeChild(video);
			if( matches(video, ':last-child') ) _this.Rearrange();
			return;
		}else{
			if( matches(video, ':last-child') ) _this.Rearrange();
		}
		
		if(!video.querySelector("img.playfilter-button-hide")){
			var text = video.querySelectorAll(".play_videolist-element__title-text, .play_videolist-element__title");
			if(!text){
				console.error("[PlayFilter] Could not find place for button: ", ident_text);
				return;
			}
			text = text[0];
			//console.log( "[PlayFilter] Found title node: ", text );
			var button = document.createElement("img");
			button.src = "data:image/png;base64," + SVTPlayFilter.IMG_CROSS; // text[0].insertAdjacentHTML("afterbegin", SVTPlayFilter.HTMLCross); //$(SVTPlayFilter.HTMLCross).prependTo(text);
			button.className = "playfilter-button-hide";
			button.title = "Hide show permanently";
			button.onclick = function(e){
				SVTPlayFilter.LoadData(); // to prevent overwriting other tabs
				SVTPlayFilter.AddFilter(ident_text);
				SVTPlayFilter.SaveData();
				_this.Update();
				$("div.play_info-popoutbox").remove();
				e.preventDefault();
				return false;
			}
			text.insertBefore(button, text.firstChild);
			//console.info("[PlayFilter] Add hide button: ", ident_text);
		}

	},

	Rearrange: function(){
		if( SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].DisableRearrange ) return false;
		var videos = document.querySelectorAll("div.play_js-videolist__item-container article");
		for( i in videos){
			videos[i].className = videos[i].className.replace(/play_nth\-[0-9]+/, "play_nth-" + ( Math.floor( ( $(this).index() ) % 12 ) + 1 ) );
			//$(this).removeClass (function (index, css) {
			//	return (css.match (/(^|\s)play_nth-\S+/g) || []).join(' ');
			//});
			//$(this).addClass("play_nth-" + ( Math.floor( ( $(this).index() ) % 12 ) + 1 ) );
		}
	}

}

SVTPlayFilter.Trigger["oppetarkiv"] = {

	Element: "article.svtUnit",
	
	Config: function(){
		$(SVTPlayFilter.ConfigButton).appendTo("#svtoa_navigation-top").click( SVTPlayFilter.OpenConfig );
	},

	Update: function(){
		var _this = SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite];
		$( _this.Element ).each( function(){ _this.Func( $(this) ); } );
	},

	Func: function(video){
		
		var raw = video.find("img.oaImg").attr("srcset");
		var link = raw.match(/([A-Za-z0-9\/_\-.]+)/)[0];
		var _this = SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite];

		if(!link) return;
		
		if(SVTPlayFilter.InFilter(link)){
			video.remove();
			if(video.is(':last-child')) _this.Rearrange();
			return;
		}else{
			if(video.is(':last-child')) _this.Rearrange();
		}
			
		if(video.find("img.hidebutton").length==0){
			var text = video.find("h1.svt-heading-xs");
			var button = $(SVTPlayFilter.HTMLCross).prependTo(text);
			button.click(function(e){
				SVTPlayFilter.LoadData(); // to prevent overwriting other tabs
				SVTPlayFilter.AddFilter(link);
				SVTPlayFilter.SaveData();
				_this.Update();
				e.preventDefault();
				return false;
			});
		}
	},

	Rearrange: function(){
		$("div.svtGridBlock article").each(function(i){
			$(this).removeClass (function (index, css) {
				return (css.match (/(^|\s)svtNth-\S+/g) || []).join(' ');
			});
			$(this).addClass("svtNth-" + ( Math.floor( ( $(this).index() ) % 12 ) + 1 ) );
		});
	}

}

SVTPlayFilter.Trigger["mtg"] = {

	Element: "div.clip",

	Update: function(){
		var _this = SVTPlayFilter.Trigger["mtg"];
		$( _this.Element ).each( function(){ _this.Func( $(this) ); } );
	},

	Func: function(video){
		
		var link = video.attr("data-title");
		//var link = raw.match(/([A-Za-z0-9\/_\-.]+)/)[0];
		var _this = SVTPlayFilter.Trigger["mtg"];

		if(!link) return;
		
		if(SVTPlayFilter.InFilter(link)){
			video.remove();
			if(video.is(':last-child')) _this.Rearrange();
			return;
		}else{
			if(video.is(':last-child')) _this.Rearrange();
		}
			
		if(video.find("img.hidebutton").length==0){
			var text = video.find("div.clip-additional-info");
			var button = $(SVTPlayFilter.HTMLCross).prependTo(text);
			button.click(function(e){
				SVTPlayFilter.LoadData(); // to prevent overwriting other tabs
				SVTPlayFilter.AddFilter(link);
				SVTPlayFilter.SaveData();
				$(".popover").remove();
				_this.Update();
				e.preventDefault();
				return false;
			});
		}
	},

	Rearrange: function(){}

}

SVTPlayFilter.Trigger["dplay"] = {

	Element: "div.catalogue-item, a.listing-item",

	Config: function(){
		$(SVTPlayFilter.ConfigButton).appendTo("#menu-main-menu").click( SVTPlayFilter.OpenConfig );
	},

	Update: function(){
		var _this = SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite];
		$( _this.Element ).each( function(){ _this.Func( $(this) ); } );
	},

	Func: function(video){
		
		var link = video.find("span.topLine, div.listing-item-title").text();
		//var link = raw.match(/([A-Za-z0-9\/_\-.]+)/)[0];
		var _this = SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite];

		if(!link) return;

		if( SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].HidePremium && video.find("div.label-premium").length > 0 ){
			video.remove();
			return;
		}
		
		if(SVTPlayFilter.InFilter(link)){
			video.remove();
			if(video.is(':last-child')) _this.Rearrange();
			return;
		}else{
			if(video.is(':last-child')) _this.Rearrange();
		}
			
		if(video.find("img.hidebutton").length==0){
			var cat_title = video.find("a.catalogue-item-title");
			var list_title = video.find("div.listing-item-title");
			if(cat_title && cat_title.length > 0){
				var button = $(SVTPlayFilter.HTMLCross).appendTo(cat_title);
				button.click(function(e){
					SVTPlayFilter.LoadData(); // to prevent overwriting other tabs
					SVTPlayFilter.AddFilter(link);
					SVTPlayFilter.SaveData();
					_this.Update();
					e.preventDefault();
					return false;
				});
			}else if(list_title && list_title.length > 0){
				var button = $(SVTPlayFilter.HTMLCross).prependTo(list_title);
				button.click(function(e){
					SVTPlayFilter.LoadData(); // to prevent overwriting other tabs
					SVTPlayFilter.AddFilter(link);
					SVTPlayFilter.SaveData();
					_this.Update();
					e.preventDefault();
					return false;
				});
			}
		}
	},

	Rearrange: function(){}

}

SVTPlayFilter.Trigger["twitch"] = {

	Element: "div.js-streams",

	Config: function(){
		console.log("[PlayFilter] Add config button");
		$(SVTPlayFilter.ConfigButton).appendTo("#small_home").click( SVTPlayFilter.OpenConfig );
	},

	Update: function(){
		var _this = SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite];
		$( _this.Element ).each( function(){ _this.Func( $(this) ); } );
	},

	Func: function(video){
		
		var ident = video.find("a.boxart").attr("original-title");
		//var ident = raw.match(/([A-Za-z0-9\/_\-.]+)/)[0];
		var _this = SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite];

		if(!ident) return;

		console.log("[PlayFilter] Found video with ident " + ident);
		
		if(SVTPlayFilter.InFilter(ident)){
			video.remove();
			if(video.is(':last-child')) _this.Rearrange();
			return;
		}else{
			if(video.is(':last-child')) _this.Rearrange();
		}
			
		if(video.find("img.hidebutton").length==0){
			var text = video.find("a.boxart");
			var button = $(SVTPlayFilter.HTMLCross).appendTo(text);
			button.click(function(e){
				SVTPlayFilter.LoadData(); // to prevent overwriting other tabs
				SVTPlayFilter.AddFilter(ident);
				SVTPlayFilter.SaveData();
				_this.Update();
				e.preventDefault();
				return false;
			});
		}
	},

	Rearrange: function(){}

}

if( document.querySelector("a.svtoa_logo, div.svtGridBlock") ) SVTPlayFilter.CurrentSite = "oppetarkiv";
if( document.querySelector("a.play_logo") ) SVTPlayFilter.CurrentSite = "svtplay";
if( document.querySelector("img.mtg-logo") ) SVTPlayFilter.CurrentSite = "mtg";
if( document.querySelector("div.header-dplay-logo-container") ) SVTPlayFilter.CurrentSite = "dplay";
if( location.href.match(/twitch\.tv\/directory/) ) SVTPlayFilter.CurrentSite = "twitch";

console.log("[PlayFilter] Setting site to '" + SVTPlayFilter.CurrentSite + "' on '" + location.href + "'.");

SVTPlayFilter.LoadData = function(){

	SVTPlayFilter.Data = {};
	SVTPlayFilter.Data[SVTPlayFilter.CurrentSite] = {};

	var cfg_raw = GM_getValue("SVTPlayFilter", '');
	var cfg_parsed;

	if(cfg_raw){
		try {
			cfg_parsed = JSON.parse(cfg_raw);
		}catch(e){
			console.log("invalid json data");
		}
	}

	if(cfg_parsed != undefined){

		SVTPlayFilter.Data = cfg_parsed;

		// init if new site
		if(!SVTPlayFilter.Data[SVTPlayFilter.CurrentSite]) SVTPlayFilter.Data[SVTPlayFilter.CurrentSite] = {};
		if(!SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide) SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide = {};

		// transfer old data
		if(SVTPlayFilter.Data.Hide){
			console.log("[PlayFilter] Transferring old data...")
			SVTPlayFilter.Data["svtplay"].Hide = SVTPlayFilter.Data.Hide;
			SVTPlayFilter.Data.Hide = undefined;
			GM_setValue("SVTPlayFilter", JSON.stringify( SVTPlayFilter.Data ) );
		}

		console.log( "[PlayFilter] Config loaded for " + SVTPlayFilter.CurrentSite, Object.keys(SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide).length, SVTPlayFilter.Data[SVTPlayFilter.CurrentSite] );

	}else{
		SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide = {};
	}

}

SVTPlayFilter.InFilter = function(img){
	if(SVTPlayFilter.Ignore[ img ]) return false;
	return SVTPlayFilter.Data[ SVTPlayFilter.CurrentSite ].Hide[ img ];
}

SVTPlayFilter.AddFilter = function(img){
	console.log("[PlayFilter] Adding '" + img + "' to filter for '" + SVTPlayFilter.CurrentSite + "'.");
	SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide[img] = true;
}

SVTPlayFilter.RemoveFilter = function(img){
	delete SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide[img];
}

SVTPlayFilter.SaveData = function(){
	GM_setValue("SVTPlayFilter", JSON.stringify( SVTPlayFilter.Data ) );
	console.log( "[PlayFilter] Config saved", SVTPlayFilter.Data );
}

SVTPlayFilter.StatusUpdate = function(){
	var num = document.getElementById("playfilter-bar-num");
	if(num){ num.innerHTML = SVTPlayFilter.CurrentlyHidden; }else{ console.error("no num found"); }
}

if(SVTPlayFilter.CurrentSite != "unknown"){
	SVTPlayFilter.LoadData();

	SVTPlayFilter.Data[SVTPlayFilter.CurrentSite].Hide["undefined"] = false;

	if( SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite] ){

		function mutationHandler (mutationRecords) {

			mutationRecords.forEach ( function (mutation) {

				if (    mutation.type               == "childList"
					&&  typeof mutation.addedNodes  == "object"
					&&  mutation.addedNodes.length
				) {
					for (var J = 0, L = mutation.addedNodes.length;  J < L;  ++J) {
						checkForCSS_Class (mutation.addedNodes[J], "nav");
					}
				}
				else if (mutation.type == "attributes") {
					checkForCSS_Class (mutation.target, SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite].CheckClass );
				}
			} );
		}

		function checkForCSS_Class (node, className) {
			//-- Only process element nodes
			if (node.nodeType === 1) {
				if (node.classList.contains (className) ) {
					//console.log ('New node with class "' + className + '" = ', node);
					SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite].Func(node);
				}
			}
		}

		var MutationObserver = window.MutationObserver;
		var myObserver       = new MutationObserver (mutationHandler);
		var obsConfig        = {
			childList: true, attributes: true,
			subtree: true,   attributeFilter: ['class']
		};

		myObserver.observe (document, obsConfig);

		//waitForKeyElements(SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite].Element, SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite].Func );
		//if(SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite].Config) SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite].Config();
		console.info("[PlayFilter] Add config button");

		var place = document.createElement("div");
		place.className = "playfilter-bar";

		var button = document.createElement("img");
		button.className = "playfilter-bar-config";
		button.src = "data:image/png;base64," + SVTPlayFilter.IMG_CONFIG;
		button.addEventListener("click", SVTPlayFilter.OpenConfig );
		button.title = "Open config";

		var num = document.createElement("span");
		num.className = "playfilter-bar-num";
		num.id = "playfilter-bar-num";
		num.innerHTML = "0";
		num.title = "Number of items hidden";

		place.appendChild(button);
		place.appendChild(num);

		document.body.appendChild(place);

		var init_videos = document.querySelectorAll(SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite].Element);
		if(init_videos){
			console.log("[PlayFilter] Hide initial media");
			for( i in init_videos ){
				SVTPlayFilter.Trigger[SVTPlayFilter.CurrentSite].Func( init_videos[i] );
			}
		}else{
			console.log("[PlayFilter] No containers found with media");
		}

	}
}else{
	console.log("[PlayFilter] Unknown site");
}