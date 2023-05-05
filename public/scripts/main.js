/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};

/** globals */
rhit.variableName = "";

/** function and class syntax examples */
rhit.functionName = function () {
	/** function body */
};

rhit.LoginPageController = class LoginPageController {
	constructor() {
		document.querySelector("#rosefireButton").addEventListener("click", (event) => {
			rhit.fbAuthManager.signIn();
		});
	}
}

function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1^h2^h3^h4)>>>0, (h2^h1)>>>0, (h3^h1)>>>0, (h4^h1)>>>0];
}

function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

rhit.FbAuthManager = class FbAuthManager {
	#user = null;
	#unsubscribe = null;
	constructor() {

	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			let uid = user?.uid ?? "Anonymous";
			this.#user = user;
			$("#profileImage").text(uid[0].toUpperCase())
			var seed = cyrb128(uid);
			
			$("#profileImage").css("background-color", `#${Math.floor(0xFFFFFF * mulberry32(seed[0])()).toString(16).padStart(6,"0")}`)
			console.log(`#${mulberry32(seed[0])().toString(16).padStart(6,"0")}`);
			changeListener?.();
		})
	}
	signIn() {
		Rosefire.signIn("8d1a0a7f-3d9e-4427-ac16-22625c43b0fb", (err, rfUser) => {
			if (err) {
			  console.error("Rosefire error!", err);
			  return;
			}
			console.log("Rosefire success!", rfUser);
			

			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const { errorCode, errorMessage } = error;
				if(errorCode === "auth/invalid-custom-token") {
					alert("The token you provided is not useful");
				} else {
					console.error("Custom auth error", errorCode, errorMessage);
				}
			})
			// TODO: Use the rfUser.token with your server.
		  });
		  
	}
	signOut() {
		firebase.auth().signOut().catch((error) => {
			// An error happened.
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log("Signout user error", errorCode, errorMessage);
		});
	}
	get isSignedIn() {
		return this.#user != null;
	}
	get uid() {
		// Null chaining!
		return this.#user?.uid;
	}
}

rhit.checkForRedirects = function() {
	if (document.querySelector("#loginPage")) {
		if(rhit.fbAuthManager.isSignedIn) {
			window.location.href = "/index.html";
		}
	} else {
		if(document.querySelector("#mainPage")) {
			return;
		}
		if(!rhit.fbAuthManager.isSignedIn) {
			window.location.href = "/";
		}
	}
}

rhit.initializePage = function() {
	const pageUrl = new URL(window.location.href); 
		if (document.querySelector("#loginPage")) {
			console.log("Login page");
			new rhit.LoginPageController();
		}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("auth change callback fired. TODO: check for redirect and init the page");
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		// Check for redirects
		rhit.checkForRedirects();
		// Initialize page
		rhit.initializePage();
	});
};

rhit.main();
