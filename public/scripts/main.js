/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * PUT_YOUR_NAME_HERE
 */

/** namespace. */
var rhit = rhit || {};

rhit.FB_COLLECTION_GAMES = "Games";
rhit.FB_KEY_IMAGE = "banner";
rhit.FB_KEY_TITLE = "title";
rhit.FB_KEY_AUTHOR = "developer";
rhit.FB_KEY_STARS = "totalStars";
rhit.FB_KEY_NUMRATINGS = "totalRatings";
rhit.FB_KEY_DESCRIPTION = "description";
rhit.FB_KEY_BANNERCOLOR = "BannerColor";

rhit.FB_COLLECTION_USERS = "Users";
rhit.FB_COLLECTION_PLAYEDGAMES = "playedGames";
rhit.FB_KEY_FAVORITE = "favorited";
rhit.FB_KEY_RATED = "isRated";
rhit.fbSingleGameManager = null;
rhit.fbAuthManager = null;

rhit.GamePageController = class {
	constructor() {
		document.querySelector("#review").onclick = (event) => {
			
		}
		rhit.fbSingleGameManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		document.querySelector("#mainImage").src = rhit.fbSingleGameManager.image;
		document.querySelector("#autherTitleBox").style.backgroundColor = rhit.fbSingleGameManager.color;
		document.querySelector("#gameTitle").innerHTML = rhit.fbSingleGameManager.title;
		document.querySelector("#author").innerHTML = rhit.fbSingleGameManager.author;
		document.querySelector("#description").innerHTML = rhit.fbSingleGameManager.description;

		const stars = (rhit.fbSingleGameManager.stars == 0 ? 0 : Math.round(2 * rhit.fbSingleGameManager.stars / rhit.fbSingleGameManager.numRatings) / 2);
		const intStars = parseInt(stars);
		document.querySelector("#reveiws").innerHTML = "<i class='material-icons'>star</i>".repeat(intStars) +
			(intStars != stars ? "<i class='material-icons'>star_half</i>" : "") +
			"<i class='material-icons'>star_border</i>".repeat(5 - stars) +
			"&nbsp;" + rhit.fbSingleGameManager.numRatings + " reviews";
		document.querySelector("#starButton").innerHTML = (rhit.fbSingleGameManager.favorited ? "<i class='material-icons'>star</i>" : "<i class='material-icons'>star_border</i>")
		document.querySelector("#review").innerHTML = (rhit.fbSingleGameManager.rated ? "Edit Star Rating" : "Add Star Rating")
		// if (rhit.fbSingleGameManager.author == rhit.fbAuthManager.uid) {
		// 	document.querySelector("#menuEdit").style.display = "Flex";
		// 	document.querySelector("#menuDelete").style.display = "Flex";
		// }
	}
}

rhit.FbSingleGameManager = class {
	constructor(gameId, userId) {
		this._gameDocumentSnapshot = {};
		this._userGameDocumentSnapshot = null;
		this._gameUnsubscribe = null;
		this._userGameUnsubscribe = null;
		this._gameRef = firebase.firestore().collection(rhit.FB_COLLECTION_GAMES).doc(gameId);
		this._userGameRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbAuthManager.uid).collection(rhit.FB_COLLECTION_PLAYEDGAMES).doc(gameId);
		// this._userGameRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc("adkinsda").collection("playedGames").doc(gameId);
	}
	beginListening(changeListener) {
		this._gameUnsubscribe = this._gameRef.onSnapshot((doc) => {
			if (doc.exists) {
				this._gameDocumentSnapshot = doc;
				changeListener();
			}
		});
		this._userGameUnsubscribe = this._userGameRef.onSnapshot((doc) => {
			if (doc.exists) {
				this._userGameDocumentSnapshot = doc;
				changeListener();
			}
		});
	}
	stopListening() {
		this._gameUnsubscribe();
		this._userGameUnsubscribe();
	}

	get image() {
		return this._gameDocumentSnapshot.get(rhit.FB_KEY_IMAGE);
	}
	get color() {
		return this._gameDocumentSnapshot.get(rhit.FB_KEY_BANNERCOLOR);
	}
	get title() {
		return this._gameDocumentSnapshot.get(rhit.FB_KEY_TITLE);
	}
	get author() {
		return this._gameDocumentSnapshot.get(rhit.FB_KEY_AUTHOR);
	}
	get stars() {
		return this._gameDocumentSnapshot.get(rhit.FB_KEY_STARS);
	}
	get numRatings() {
		return this._gameDocumentSnapshot.get(rhit.FB_KEY_NUMRATINGS);
	}
	get description() {
		return this._gameDocumentSnapshot.get(rhit.FB_KEY_DESCRIPTION);
	}
	get description() {
		return this._gameDocumentSnapshot.get(rhit.FB_KEY_DESCRIPTION);
	}

	get favorited() {
		if (this._userGameDocumentSnapshot != null) {
			return this._userGameDocumentSnapshot.get(rhit.FB_KEY_FAVORITE);
		} else {
			return null;
		}
	}
	get rated() {
		if (this._userGameDocumentSnapshot != null) {
			return this._userGameDocumentSnapshot.get(rhit.FB_KEY_RATED);
		} else {
			return null;
		}
	}
}

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
		return this.#user?.uid ?? "|anonymous|"
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

rhit.initializePage = () => {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#gamePage")) {
		const gameId = urlParams.get("id");
		if (!gameId) {
			window.location.href = "/";
		}
		rhit.fbSingleGameManager = new rhit.FbSingleGameManager(gameId);
		new rhit.GamePageController();
	}
	if (document.querySelector("#loginPage")) {
		console.log("Login page");
		new rhit.LoginPageController();
	}
};

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
