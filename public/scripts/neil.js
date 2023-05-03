var rhit = rhit || {};

rhit.FB_COLLECTION_GAMES = "MovieQuotes";
rhit.FB_KEY_IMAGE = "image";
rhit.FB_KEY_TITLE = "title";
rhit.FB_KEY_AUTHOR = "author";
rhit.FB_KEY_STARS = 0;
rhit.FB_KEY_NUMRATINGS = 0;
rhit.FB_KEY_DESCRIPTION = "desription";
rhit.fbSingleGameManager = null;
rhit.fbAuthManager = null;

rhit.GamePageController = class {
	constructor() {
		// document.querySelector("#menuSignOut").onclick = (event) => {
		// 	rhit.fbAuthManager.signOut();
		// }
		rhit.fbSingleGameManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		document.querySelector("#mainImage").innerHTML = rhit.fbSingleGameManager.image;
		document.querySelector("#gameTitle").innerHTML = rhit.fbSingleGameManager.title;
		document.querySelector("#author").innerHTML = rhit.fbSingleGameManager.author;
		document.querySelector("#description").innerHTML = rhit.fbSingleGameManager.description;

        const stars = Math.round(rhit.fbSingleGameManager.stars/rhit.fbSingleGameManager.numRatings)
        document.querySelector("#reveiws").innerHTML = repeat("<i class='material-icons'>star</i>", stars) + repeat("<i class='material-icons'>openStar</i>", 5-stars) + "&nbsp;" + rhit.fbSingleGameManager.numRatings + "reviews";

		// if (rhit.fbSingleGameManager.author == rhit.fbAuthManager.uid) {
		// 	document.querySelector("#menuEdit").style.display = "Flex";
		// 	document.querySelector("#menuDelete").style.display = "Flex";
		// }
	}
}

rhit.FbSingleGameManager = class {
	constructor(gameId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_GAMES).doc(gameId);
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				this._documentSnapshot = doc;
				changeListener();
			}
		});
	}
	stopListening() {
		this._unsubscribe();
	}
	// update(quote, movie) {
	// 	this._ref.update({
	// 			[rhit.FB_KEY_QUOTE]: quote,
	// 			[rhit.FB_KEY_MOVIE]: movie,
	// 			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
	// 		})
	// 		.then(() => {
	// 			console.log("Document sucsessfuly updated");
	// 		})
	// 		.catch((error) => {
	// 			console.error("Error updating document: ", error);
	// 		})
	// }
	// delete() {
	// 	return this._ref.delete();
	// }

	get image() {
		return this._documentSnapshot.get(rhit.FB_KEY_IMAGE);
	}

	get title() {
		return this._documentSnapshot.get(rhit.FB_KEY_TITLE);
	}

	get author() {
		return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
	}

    get stars() {
        return this._documentSnapshot.get(rhti.FB_KEY_STARS);
    }

    get numRatings() {
        return this._documentSnapshot.get(rhti.FB_KEY_NUMRATINGS);
    }

    get description() {
        return this._documentSnapshot.get(rhti.FB_KEY_DESCRIPTION);
    }
}

// rhit.FbAuthManager = class {
// 	constructor() {
// 		this._user = null;
// 	}
// 	beginListening(changeListener) {
// 		firebase.auth().onAuthStateChanged((user) => {
// 			this._user = user;
// 			changeListener();
// 		});
// 	}
// 	signIn() {
// 		console.log("TODO: Sign in using Rosefire");
// 		Rosefire.signIn("84d5e5a9-7ee8-4172-b06f-a70e5d8eb874", (err, rfUser) => {
// 			if (err) {
// 				console.log("Rosefire error!", err);
// 				return;
// 			}
// 			console.log("Rosefire success!", rfUser);

// 			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
// 				const errorCode = error.code;
// 				const errorMessage = error.message;
// 				if (errorCode === "auth/invalid-custom-token") {
// 					alert("The token you provided is not valid.")
// 				} else {
// 					console.log("Custom auth error", errorCode, errorMessage);
// 				}
// 			});
// 		});
// 	}
// 	signOut() {
// 		firebase.auth().signOut();
// 	}
// 	get uid() {
// 		return this._user.uid;
// 	}
// 	get isSignedIn() {
// 		return !!this._user;
// 	}
// }

rhit.initializePage = () => {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#gamePage")) {
		console.log("You are on the game page");
		const gameId = urlParams.get("id");
		// if (!gameId) {
		// 	window.location.href = "/";
		// }
		rhit.fbSingleGameManager = new rhit.FbSingleGameManager(gameId);
		new rhit.GamePageController();
	}
};

rhit.main = function () {
	console.log("Ready");
	// rhit.fbAuthManager = new rhit.FbAuthManager();
	// rhit.fbAuthManager.beginListening(() => {
	// 	console.log("is signed in: ", rhit.fbAuthManager.isSignedIn);
	// 	rhit.checkForRedirects();
		rhit.initializePage();
	// });
};

rhit.main();