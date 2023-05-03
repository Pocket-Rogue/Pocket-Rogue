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

rhit.FbAuthManager = class FbAuthManager {
	#user = null;
	#unsubscribe = null;
	constructor() {

	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this.#user = user;
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
			window.location.href = "/list.html";
		}
	} else {
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
