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

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}
	signIn() {
		console.log("TODO: Sign in using Rosefire");
		Rosefire.signIn("84d5e5a9-7ee8-4172-b06f-a70e5d8eb874", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);

			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === "auth/invalid-custom-token") {
					alert("The token you provided is not valid.")
				} else {
					console.log("Custom auth error", errorCode, errorMessage);
				}
			});
		});
	}
	signOut() {
		firebase.auth().signOut();
	}
	get uid() {
		return this._user.uid;
	}
	get isSignedIn() {
		return !!this._user;
	}
}

rhit.initializePage = () => {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#gamePage")) {
		console.log("You are on the game page");
		const gameId = urlParams.get("id");
		if (!gameId) {
			window.location.href = "/";
		}
		rhit.fbSingleGameManager = new rhit.FbSingleGameManager(gameId);
		new rhit.GamePageController();
	}
};

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage")) {
		if (rhit.fbAuthManager.isSignedIn) {
			window.location.href = "/index.html";
		}
	} else {
		if (document.querySelector("#mainPage")) {
			return;
		}
		if (!rhit.fbAuthManager.isSignedIn) {
			window.location.href = "/";
		}
	}
}

rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("is signed in: ", rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		rhit.initializePage();
	});
};

// rhit.main();