var rhit = rhit || {};

rhit.FB_COLLECTION_GAMES = "Games";
rhit.FB_KEY_IMAGE = "banner";
rhit.FB_KEY_TITLE = "title";
rhit.FB_KEY_AUTHOR = "developer";
rhit.FB_KEY_STARS = "totalStars";
rhit.FB_KEY_NUMRATINGS = "totalRatings";
rhit.FB_KEY_DESCRIPTION = "description";
rhit.FB_KEY_BANNERCOLOR = "BannerColor";
rhit.FB_KEY_APPROVED = "approved";
rhit.FB_KEY_CODE = "code";
rhit.FB_KEY_ICON = "icon";
rhit.FB_KEY_ISCANVAS = "isCanvas";

rhit.FB_COLLECTION_USERS = "Users";
rhit.FB_COLLECTION_PLAYEDGAMES = "playedGames";
rhit.FB_COLLECTION_DEVELOPEDGAMES = "developedGames";
rhit.FB_KEY_FAVORITE = "favorited";
rhit.FB_KEY_RATED = "isRated";
rhit.FB_KEY_RATING = "starRating";
rhit.fbSingleGameManager = null;
rhit.fbAuthManager = null;
rhit.ECGameManager = null;
rhit.GameId = null;

rhit.FB_KEY_CANVAS = "isCanvas";
rhit.FB_KEY_CODE = "code";

rhit.SearchPageController = class {
    constructor(search) {
        rhit.fbSearchManager.beginListening(this.updateView.bind(this));
        this.search = search;
    }
    updateView() {
        document.querySelector("#searchFor").innerHTML = "Searched For: " + this.search;

        const games = sortGamesList(this.search)
        const newList = htmlToElement('<div id="resultContainer"></div>');
        for (let i = 0; i < games.length; i++) {
			const game = games[i][0];
			const newCard = this._createCard(game);
			newCard.onclick = (event) => {
				window.location.href = `/game.html?id=${game.id}`;
			}
			newList.appendChild(newCard);
		}
        
        const oldList = document.querySelector("#resultContainer");
		oldList.replaceWith(newList);
    }

    _createCard(game) {
		return htmlToElement(`<div class="card mb-3">
        <div class="row g-0">
          <div class="col-md-4">
            <img
              src=${game.icon}
              class="img-fluid rounded-start"
            />
          </div>
          <div class="col-md-8">
            <div class="card-body">
              <h5 class="card-title">${game.title}</h5>
              <p class="card-text">
                ${game.description}
              </p>
            </div>
          </div>
        </div>
      </div>`);
	}
}

rhit.FbSearchManager = class {
    constructor() {
        this._documentSnapshot = null;
        this._unsubscribe = null;
        this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_GAMES);
    }
    beginListening(changeListener) {
        this._unsubscribe = this._ref.onSnapshot((doc) => {
            this._documentSnapshot = doc;
            changeListener();
        });
    }
    stopListening() {
        this._unsubscribe();
    }

    get games() {
        let gameList = [];
        if(this._documentSnapshot == null) {
            return gameList;
        }
        for(let i = 0; i < this._documentSnapshot.docs.length; i++) {
            let doc = this._documentSnapshot.docs[i];
            let data = doc.data();
            gameList.push({
                id: doc.id,
                title: data.title,
                icon: data.icon,
                description: data.description
            });
        }
        return gameList;
    }
}

const last = arr => arr[arr.length - 1];

// from: https://stackoverflow.com/questions/22308014/damerau-levenshtein-distance-implementation
function levenshteinWeighted(seq1,seq2) {
    var len1=seq1.length;
    var len2=seq2.length;
    var i, j;
    var dist;
    var ic, dc, rc;
    var last, old, column;

    var weighter={
        insert(c) { 
            if(/\s/.test(c)) {
                return 0.1;
            }
            return 1; 
        },
        delete(c) {
            if(/\s/.test(c)) {
                return 0.1;
            }
            return 5;
        },
        replace(c, d) {
            return 10;
        }
    };

    /* don't swap the sequences, or this is gonna be painful */
    if (len1 == 0 || len2 == 0) {
        dist = 0;
        while (len1)
            dist += weighter.delete(seq1[--len1]);
        while (len2)
            dist += weighter.insert(seq2[--len2]);
        return dist;
    }

    column = []; // malloc((len2 + 1) * sizeof(double));
    //if (!column) return -1;

    column[0] = 0;
    for (j = 1; j <= len2; ++j)
        column[j] = column[j - 1] + weighter.insert(seq2[j - 1]);

    for (i = 1; i <= len1; ++i) {
        last = column[0]; /* m[i-1][0] */
        column[0] += weighter.delete(seq1[i - 1]); /* m[i][0] */
        for (j = 1; j <= len2; ++j) {
            old = column[j];
            if (seq1[i - 1] == seq2[j - 1]) {
                column[j] = last; /* m[i-1][j-1] */
            } else {
                ic = column[j - 1] + weighter.insert(seq2[j - 1]);      /* m[i][j-1] */
                dc = column[j] + weighter.delete(seq1[i - 1]);          /* m[i-1][j] */
                rc = last + weighter.replace(seq1[i - 1], seq2[j - 1]); /* m[i-1][j-1] */
                column[j] = ic < dc ? ic : (dc < rc ? dc : rc);
            }
            last = old;
        }
    }

    dist = column[len2];
    return dist;
}

function sortGamesList(search) {
    let games = [...rhit.fbSearchManager.games];
    for (i=0; i<games.length; i++) {
       games[i] = [games[i], levenshteinWeighted(search, games[i].title)];
    }
    games.sort((a,b) => {return a[1]-b[1]})
    return games.slice(0,20);
}

rhit.FbPlayManager = class {
	constructor(gameId) {
		this._gameDocumentSnapshot = {};
		this._gameRef = firebase.firestore().collection(rhit.FB_COLLECTION_GAMES).doc(gameId);
		// this._userGameRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc("adkinsda").collection("playedGames").doc(gameId);
	}
	beginListening(changeListener) {
		this._gameRef.onSnapshot((doc) => {
			if (doc.exists) {
				this._gameDocumentSnapshot = doc;
				console.log(this._gameDocumentSnapshot);
				changeListener();
			}
		});
	}
	stopListening() {
	
    }
    
	get code() {
		return this._gameDocumentSnapshot.get(rhit.FB_KEY_CODE);
	}
	get isCanvas() {
		return this._gameDocumentSnapshot.get(rhit.FB_KEY_CANVAS);
	}
}


rhit.GamePlayPageController = class {
	constructor() {
		rhit.fbPlayManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		console.log(1);
        if(rhit.fbPlayManager.isCanvas) {
            let canvas = document.createElement("CANVAS");
            canvas.id = "canvas";
            document.querySelector("#playPage").appendChild(canvas);
        }
        let script = document.createElement("SCRIPT");
        script.src = rhit.fbPlayManager.code;
        document.body.appendChild(script);
	}
}


rhit.GamePageController = class {
	constructor() {
        document.querySelector("#starButton").onclick = (event) => {
			rhit.fbSingleGameManager.toggleFavorate();
		}
        document.querySelector("#review").onclick = (event) => {
            rhit.fbSingleGameManager.rate(rhit.fbSingleGameManager.myRating);
            this.updateView()
        }
        for(let i=1;i<6;i++){
            document.querySelector("#star"+i).onclick = (event) => {
                rhit.fbSingleGameManager.rate(i);
                this.updateView()
            }
        }
        document.querySelector("#cancel").onclick = (event) => {
            rhit.fbSingleGameManager.cancelRating();
        }
        document.querySelector("#submit").onclick = (event) => {
            rhit.fbSingleGameManager.updateRating();
        }
		rhit.fbSingleGameManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		document.querySelector("#mainImage").src = rhit.fbSingleGameManager.image;
		document.querySelector("#mainImageWrapper").href = `/play.html?id=${rhit.fbSingleGameManager.id}`
		document.querySelector("#autherTitleBox").style.backgroundColor = rhit.fbSingleGameManager.color;
		document.querySelector("#gameTitle").innerHTML = rhit.fbSingleGameManager.title;
		document.querySelector("#author").innerHTML = rhit.fbSingleGameManager.author;
		document.querySelector("#description").innerHTML = rhit.fbSingleGameManager.description;

        for(let i=1;i<6;i++){
            document.querySelector("#star"+i).innerHTML = (rhit.fbSingleGameManager.unsavedRating < i ? "<i class='material-icons'>star_border</i>" : "<i class='material-icons'>star</i>")
        }

		const stars = (rhit.fbSingleGameManager.stars == 0 ? 0 : Math.round(2 * rhit.fbSingleGameManager.stars / rhit.fbSingleGameManager.numRatings) / 2);
		const intStars = parseInt(stars);
		document.querySelector("#reveiws").innerHTML = "<i class='material-icons'>star</i>".repeat(intStars) +
			(intStars != stars ? "<i class='material-icons'>star_half</i>" : "") +
			"<i class='material-icons'>star_border</i>".repeat(5 - stars) +
			"&nbsp;" + rhit.fbSingleGameManager.numRatings + " reviews";
		document.querySelector("#starButton").innerHTML = (rhit.fbSingleGameManager.favorited ? "<i class='material-icons'>star</i>" : "<i class='material-icons'>star_border</i>")
		document.querySelector("#review").innerHTML = (rhit.fbSingleGameManager.rated ? "Edit Star Rating" : "Add Star Rating")

        if (rhit.fbAuthManager.isSignedIn) {
            document.querySelector("#starButton").style.display = "Flex";
            document.querySelector("#review").style.display = "Flex";
        } else {
            document.querySelector("#starButton").style.display = "None";
            document.querySelector("#review").style.display = "None";
        }
	}
}

rhit.FbSingleGameManager = class {
	constructor(gameId) {
        this.id = gameId;
        this.unsavedRating = 0;
		this._gameDocumentSnapshot = {};
		this._userGameDocumentSnapshot = null;
        this._userDocumentSnapshot = {};
		this._gameUnsubscribe = null;
		this._userGameUnsubscribe = null;
		this._userUnsubscribe = null;
		this._gameRef = firebase.firestore().collection(rhit.FB_COLLECTION_GAMES).doc(gameId);
		this._userGameRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbAuthManager.uid).collection(rhit.FB_COLLECTION_PLAYEDGAMES).doc(gameId);
		this._userRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbAuthManager.uid).collection(rhit.FB_COLLECTION_PLAYEDGAMES);
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
        this._userUnsubscribe = this._userRef.onSnapshot((doc) => {
            this._userDocumentSnapshot = doc;
            changeListener();
        });
	}
	stopListening() {
		this._gameUnsubscribe();
		this._userGameUnsubscribe();
		this._userUnsubscribe();
	}
    addToPlayed() {
        for(let i = 0; i < this._userDocumentSnapshot.docs.length; i++) {
            let doc = this._userDocumentSnapshot.docs[i];
            if (doc.id == this.id){
                return true;
            }
        }
        this._userRef.doc(this.id).set({
            [rhit.FB_KEY_FAVORITE]: false,
            [rhit.FB_KEY_RATED]: false,
            [rhit.FB_KEY_RATING]: 0,
        })
        return true;
    }
    toggleFavorate() {
        this.addToPlayed()
		this._userGameRef.update({
            [rhit.FB_KEY_FAVORITE]: !this.favorited,
		})
	}
    rate(rating) {
        this.unsavedRating = rating;
    }
    cancelRating() {
        this.unsavedRating = this.myRating;
    }
    updateRating() {
        this.addToPlayed()
        this._gameRef.update({
            [rhit.FB_KEY_NUMRATINGS]: (this.rated ? this.numRatings : this.numRatings + 1),
            [rhit.FB_KEY_STARS]: (this.rated ? this.stars - this.myRating + this.unsavedRating : this.stars + this.unsavedRating),
        })
        this._userGameRef.update({
            [rhit.FB_KEY_RATING]: this.unsavedRating,
            [rhit.FB_KEY_RATED]: true,
		})
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
    get myRating() {
		if (this._userGameDocumentSnapshot != null) {
			return this._userGameDocumentSnapshot.get(rhit.FB_KEY_RATING);
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
        rhit.fbAuthManager.beginListening(() => {
            if(rhit.fbAuthManager.isSignedIn) {
                document.querySelector("#rosefireButton").innerHTML = "Prestige?"
            }
        })
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
        this._documentSnapshot = null;
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			let uid = user?.uid ?? "A";
			this.#user = user;
			$("#profileImage").text(uid[0].toUpperCase())
			var seed = cyrb128(uid);
			
			$("#profileImage").css("background-color", `#${Math.floor(0xFFFFFF * mulberry32(seed[0])()).toString(16).padStart(6,"0")}`)
			console.log(`#${mulberry32(seed[0])().toString(16).padStart(6,"0")}`);
			changeListener?.();

            if (this._documentSnapshot != null && user?.uid && !this.isInUsers()) {
                this.addUser();
            } else if (this._documentSnapshot != null && user?.uid) {
                window.location.href = "/index.html";
            }

            document.querySelector("#menuSignOut").onclick = (event) => {
                if (this.isSignedIn) {
                    this.signOut();
				    window.location.href = "";
                } else {
				    window.location.href = "/login.html";
                }
            }
            document.querySelector("#menuSignOut").innerHTML = (rhit.fbAuthManager.isSignedIn ? `<i class="material-icons">logout</i>&nbsp;&nbsp;&nbsp;Sign Out` : `<i class="material-icons">login</i>&nbsp;&nbsp;&nbsp;Sign In`);
		})
        this._unsubscribe = this._ref.onSnapshot((doc) => {
            this._documentSnapshot = doc;
            changeListener();
        });
	}
    addUser() {
        this._ref.doc(this.uid).set({
            [rhit.FB_COLLECTION_DEVELOPEDGAMES]: []
        });
        this._ref.doc(this.uid).collection("gamesPlayed").doc("null").set({})
        .then(() => {window.location.href = "/index.html"})
    }
    isInUsers() {
        if (this._documentSnapshot == null || this.#user == null) {
            return false;
        }
        for(let i = 0; i < this._documentSnapshot.docs.length; i++) {
            let doc = this._documentSnapshot.docs[i];
            if (doc.id == this.uid) {
                console.log(doc.id)
                console.log(doc)
                console.log(this.uid)
                return true;
            }
        }
        return false;
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

rhit.EditGameDataController = class {
    constructor(gameId) {
        console.log("Added EditGameDataController.");

        document.querySelector('#imageForm').addEventListener('submit', this.handleSubmit);
        document.querySelector('#logoForm').addEventListener('submit', this.handleSubmit);
        document.querySelector('#gameForm').addEventListener('submit', this.handleSubmit);
        document.querySelector("#imageFile").addEventListener('change', (event) => {
            console.log("Upload a main image!");
            rhit.ECGameManager.loadMainImage(event);
        });
        document.querySelector("#logoFile").addEventListener('change', (event) => {
            console.log("Upload a logo!");
            rhit.ECGameManager.loadLogoImage(event);
        });
        document.querySelector("#gameFile").addEventListener('change', (event) => {
            console.log("Upload a javascript file!");
            rhit.ECGameManager.loadGameFile(event);
        })
        document.querySelector("#colorButton").addEventListener('change', (event) => {
            console.log("Change the color!");
            rhit.ECGameManager.changeColor();
        });
        document.querySelector("#createButton").addEventListener('click', (event) => {
            console.log("Create a new game!");
            rhit.ECGameManager.addGame();
        });
        document.querySelector("#viewButton").addEventListener('click', (event) => {
            console.log("View the game!");
            window.location.href = `game.html?id=${rhit.gameId}`;
        });
        document.querySelector("#saveButton").addEventListener('click', (event) => {
            console.log("Save the game!");
            rhit.ECGameManager.saveGame();
        });
        document.querySelector("#deleteButton").addEventListener('click', (event) => {
            console.log("Delete the game!");
            rhit.ECGameManager.deleteGame()
            .then(() => {
                console.log("Game successfully deleted!");
                window.location.href = "index.html";
            }).catch((error) => {
                console.error("Error deleting game: ", error);
            });
        });

        if (gameId) {
            rhit.ECGameManager.beginListening(this.showExistingGame.bind(this));
        }
    }

    // Handle upload event here. Credit: https://www.webtrickshome.com/forum/how-to-display-uploaded-image-in-html-using-javascript
    handleSubmit(event) {
        const form = event.currentTarget;
        const url = new URL(form.action);
        const formData = new FormData(form);
        const searchParams = new URLSearchParams(formData);

        if(form.method.toLowerCase() == 'post') {
            if(form.enctype === 'multipart/form-data') {
                fetchOptions.body = formData;
            } else {
                fetchOptions.body = searchParams;
            }
        } else {
            url.search = searchParams;
        }

        fetch(url, {
            method: form.method,
            body: formData,
        });

        // Any JS that could fail goes here
        event.preventDefault();

    }

    // Load in existing game resources
    showExistingGame() {
        console.log("Attempting to show an existing game");
        document.querySelector("#uploadImage").src = rhit.ECGameManager.mainImage;
        document.querySelector("#uploadLogo").src = rhit.ECGameManager.logoImage;
        document.querySelector("#gameCaption").style.backgroundColor = rhit.ECGameManager.captionColor;
        document.querySelector("#colorButton").value = rhit.ECGameManager.captionColor;
        document.querySelector("#gameScript").value = rhit.ECGameManager.jsGameString;
        document.querySelector("#inputTitle").value = rhit.ECGameManager.title;
        document.querySelector("#inputAuthor").value = rhit.ECGameManager.author;
        document.querySelector("#inputDescription").value = rhit.ECGameManager.description;
    }
}

rhit.EditGameDataManager = class {
    constructor(gameId) {
        this._documentSnapshot = {};
        this._userDocumentSnapshot = {};
        this._gameUnsubscribe = null;
        this._userUnsubscribe = null;
        console.log("Created editGameDataManager.");
        rhit.gameId = gameId;
        this._userRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbAuthManager.uid); // Connect to developed games list user made
        if (!gameId) {
            console.log("We're creating a new game!");
            this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_GAMES);
        } else {
            this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_GAMES).doc(gameId);
            console.log(`Listing to ${this._ref.path}`);
            this._showEditButtons();
        }
    }
    beginListening(changeListener) {
        let gameExists = false;
		this._gameUnsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
                gameExists = true;
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
                if (!gameExists) {
                    window.location.href = "404.html";
                }
			}
		});
        this._userUnsubscribe = this._userRef.onSnapshot((doc) => {
			if (doc.exists) {
				this._userDocumentSnapshot = doc;
				changeListener();
			}
		});
	}
	stopListening() {
		this._gameUnsubscribe();
        this._userUnsubscribe();
	}

    // If we're in edit mode, hide the publish button and show the other buttons
    _showEditButtons() {
        document.querySelector("#gameLabel").innerHTML = "Overwrite existing js file (optional)";
        document.querySelector("#createButton").style.visibility = "hidden";
        document.querySelector("#viewButton").style.visibility = "visible";
        document.querySelector("#saveButton").style.visibility = "visible";
        document.querySelector("#deleteButton").style.visibility = "visible";
        console.log("Buttons should be toggled");
    }
    // Handle image upload display here
    loadMainImage(event) {
        var image = document.getElementById('uploadImage');
        //image.src = URL.createObjectURL(event.target.files[0]);
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onloadend = function() {
            const base64 = reader.result;
            image.src = base64;
        };

        image.src = reader.readAsDataURL(file);
    }
    loadLogoImage(event) {
        var image = document.getElementById('uploadLogo');
        //image.src = URL.createObjectURL(event.target.files[0]);
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onloadend = function() {
            const base64 = reader.result;
            image.src = base64;
        };

        reader.readAsDataURL(file);
    }
    loadGameFile(event) {
        var game = document.getElementById('gameScript');
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onloadend = function() {
            const base64 = reader.result;
            console.log(base64);
            game.value = base64;
        }

        reader.readAsDataURL(file);
    }

    // Handle color change here
    changeColor() {
        var caption = document.getElementById('gameCaption');
        var chosenColor = document.getElementById('colorButton');
        var title = document.getElementById('inputTitle');
        var author = document.getElementById('inputAuthor');
        let color = chosenColor.value;
        // Calculate the luma, used to determine if text color needs to change
        // LUMA CALCULATION CREDIT: https://stackoverflow.com/questions/12043187/how-to-check-if-hex-color-is-too-black
        color = color.substring(1);
        var rgb = parseInt(color, 16);
        var r = (rgb >> 16) & 0xff;  // extract red
        var g = (rgb >>  8) & 0xff;  // extract green
        var b = (rgb >>  0) & 0xff;  // extract blue

        var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
        if (luma < 60) {
            // Change text color to be light, otherwise its dark
            title.style.color = "#FFFFFF";
            author.style.color = "#FFFFFF";
        } else {
            title.style.color = "#111111";
            author.style.color = "#111111";
        }
        caption.style.backgroundColor = chosenColor.value;
    }

    // Handle adding a new game here. Occurs when "publish" is pressed.
    /**
     * Obtain the mainImage src (banner), logoImage src (Icon), style color of the caption (BannerColor),
     * the js file string (Code), title (Title), author (AuthorName), and the description (Description).
     * Check that all of these entries are valid, aka they aren't empty.
     * If one of them is empty, an alert needs to be given that that field needs to be filled.
     * Note: Description is allowed to be empty.
     * Otherwise, proceed to create a new firestore Games Item. 
     */
    addGame() {
        // Fetch game values
        console.log("Attempting to publish game...");
        var mainImage = document.querySelector("#uploadImage").src;
        var logoImage = document.querySelector("#uploadLogo").src;
        var captionColor = document.querySelector("#colorButton").value;
        var jsGameString = document.querySelector("#gameScript").value;
        var title = document.querySelector("#inputTitle").value;
        var author = document.querySelector("#inputAuthor").value;
        var description = document.querySelector("#inputDescription").value; 
        console.log(`Game values found. Here are the following parameters:\nmain image: ${mainImage}\nlogo image: ${logoImage}
        \ncaption color: ${captionColor}\njsGameString: ${jsGameString}\ntitle: ${title}\nauthor: ${author}\ndescription: ${description} `);

        // Inspect game values: Build alert string
        let alertString = "You are unable to publish your game: ";
        let invalidPublish = false;
        if (mainImage.includes("images/empty_image.jpg")) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease upload a banner image.");
        }
        if (logoImage.includes("images/empty_image.jpg")) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease upload a logo image.");
        }
        /*if (jsGameString.length == 0) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease upload a javascript game file.");
        }*/
        if (title.length == 0) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease add a title.");
        }
        if (author.length == 0) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease add an author.");
        }

        // Alert user a message if publish isn't done
        if (invalidPublish) {
            alert(alertString);
            return;
        }
        console.log("Passed validity check. Proceeding to publish the game...");
        console.log("Adding game ", this._ref);

        // Add a new entry to the Games collection in firestore.
        this._ref.add({
            [rhit.FB_KEY_BANNERCOLOR]: captionColor,
            [rhit.FB_KEY_APPROVED]: false,
            [rhit.FB_KEY_IMAGE]: mainImage,
            [rhit.FB_KEY_CODE]: jsGameString,
            [rhit.FB_KEY_DESCRIPTION]: description,
            [rhit.FB_KEY_AUTHOR]: author,
            [rhit.FB_KEY_ICON]: logoImage,
            [rhit.FB_KEY_ISCANVAS]: false,
            [rhit.FB_KEY_TITLE]: title,
            [rhit.FB_KEY_NUMRATINGS]: 0,
            [rhit.FB_KEY_STARS]: 0,
        })
        .then((docRef) => {
            console.log("Game published with ID: ", docRef.id);
            // Add the new game as a developed game under the user.
            let developedGames = this.developedGames;
            developedGames.push(docRef.id);
            this._userRef.update({
                [rhit.FB_KEY_DEVELOPEDGAMES]: developedGames,
            })
            .then(() => {
                console.log("Added game to developed games");
                window.location.href = "index.html";
            })
            .catch((error) => {
                console.error("Error adding game to developed games: ", error);
            })
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
        });

        return;
    }

    saveGame() {
        // Fetch game values
        console.log("Saving changes to the game...");
        var mainImage = document.querySelector("#uploadImage").src;
        var logoImage = document.querySelector("#uploadLogo").src;
        var captionColor = document.querySelector("#colorButton").value;
        var jsGameString = document.querySelector("#gameScript").value;
        var title = document.querySelector("#inputTitle").value;
        var author = document.querySelector("#inputAuthor").value;
        var description = document.querySelector("#inputDescription").value; 
        console.log(`Game values found. Here are the following parameters:\nmain image: ${mainImage}\nlogo image: ${logoImage}
        \ncaption color: ${captionColor}\njsGameString: ${jsGameString}\ntitle: ${title}\nauthor: ${author}\ndescription: ${description} `);

        // Inspect game values: Build alert string
        let alertString = "You are unable to your changes: ";
        let invalidPublish = false;
        if (mainImage.includes("images/empty_image.jpg")) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease upload a banner image.");
        }
        if (logoImage.includes("images/empty_image.jpg")) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease upload a logo image.");
        }
        /*if (jsGameString.length == 0) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease upload a javascript game file.");
        }*/
        if (title.length == 0) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease add a title.");
        }
        if (author.length == 0) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease add an author.");
        }

        // Alert user a message if save isn't done
        if (invalidPublish) {
            alert(alertString);
            return;
        }
        console.log("Passed validity check. Proceeding to save changes...");

        console.log("Updating the game ", this._ref);
        // Update the existing entry to the Games collection in firestore.
        this._ref.update({
            [rhit.FB_KEY_BANNERCOLOR]: captionColor,
            [rhit.FB_KEY_IMAGE]: mainImage,
            [rhit.FB_KEY_CODE]: jsGameString,
            [rhit.FB_KEY_DESCRIPTION]: description,
            [rhit.FB_KEY_AUTHOR]: author,
            [rhit.FB_KEY_ICON]: logoImage,
            [rhit.FB_KEY_TITLE]: title,
        })
        .then(() => {
            console.log("Changes saved!");
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Error saving changes: ", error);
        });

        return;
    }

    deleteGame() {
        console.log("Deleting the following game: ", this._ref);
        // Remove the game id from the user list of developed games
        let developedGames = this.developedGames;
        let removedGameId = rhit.GameId;
        for (let i = 0; i < developedGames.length; i++) {
            if (developedGames[i] == removedGameId) {
                delete developedGames[i];
                break;
            }
        }
        this._userRef.update({
            [rhit.FB_KEY_DEVELOPEDGAMES]: developedGames,
        })
        .then(() => {
            console.log("Removed game from developed games");
        })
        .catch((error) => {
            console.error("Error removing game from developed games: ", error);
        })
        return this._ref.delete();
    }

    get mainImage() {
        return this._documentSnapshot.get(rhit.FB_KEY_IMAGE);
    }
    get logoImage() {
        return this._documentSnapshot.get(rhit.FB_KEY_ICON);
    }
    get captionColor() {
        return this._documentSnapshot.get(rhit.FB_KEY_BANNERCOLOR);
    }
    get jsGameString() {
        return this._documentSnapshot.get(rhit.FB_KEY_CODE);
    }
    get title() {
        return this._documentSnapshot.get(rhit.FB_KEY_TITLE);
    }
    get author() {
        return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
    }
    get description() {
        return this._documentSnapshot.get(rhit.FB_KEY_DESCRIPTION);
    }
    get developedGames() {
        return this._gameDocumentSnapshot.get(rhit.FB_COLLECTION_DEVELOPEDGAMES);
    }

}

rhit.checkForRedirects = function() {
	if (!document.querySelector("#loginPage")) {
		if(document.querySelector("#mainPage") || document.querySelector("#searchPage") || document.querySelector("#gamePage") || document.querySelector("#playPage")) {
			return;
		}
		if(!rhit.fbAuthManager.isSignedIn) {
			window.location.href = "/";
		}
	}
}

rhit.FbMainManager = class {
    constructor() {
        this._gamesRef = firebase.firestore().collection(rhit.FB_COLLECTION_GAMES);
		this._playedGamesRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbAuthManager.uid).collection(rhit.FB_COLLECTION_PLAYEDGAMES);
		this._userRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(rhit.fbAuthManager.uid)
    }
    get games() {
        let gameList = [];
        if(this._gamesSnapshot == null) {
            return gameList;
        }
        for(let i = 0; i < Math.min(this._gamesSnapshot.docs.length, 20); i++) {
            let doc = this._gamesSnapshot.docs[i];
            let data = doc.data();
            gameList.push({
                id: doc.id,
                title: data.title,
                icon: data.icon
            });
        }
        return gameList;
    }
    get userGames() {
        if(this._userSnapshot?.exists != true) {
            return [];
        }
        let gamesList = this._userSnapshot.get(rhit.FB_COLLECTION_DEVELOPEDGAMES);
        let object = {};
        for(let i = 0; i < gamesList.length; i++) {
            object[gamesList[i]] = null;
        }
        return this.games.filter((game) => {
            return game.id in object;
        });
    }
    get favorited() {
        if(this._playedSnapshot == undefined) {
            return [];
        }
        let object = {};
        for(let i = 0; i < Math.min(this._playedSnapshot.docs.length, 20); i++) {
            let doc = this._playedSnapshot.docs[i];
            if(doc.data().favorited) {

                object[doc.id] = null;
            }
        }
        return this.games.filter((game) => {
            return game.id in object;
        });
    }
    beginListening(changeListener1, changeListener2, changeListener3) {
        let gameExists = false;
		this._gamesRef.onSnapshot(gamesSnapshot => {
            this._gamesSnapshot = gamesSnapshot;
            changeListener1();
            changeListener2();
            changeListener3();
        });
        this._playedGamesRef.onSnapshot(playedGamesSnap => {
            this._playedSnapshot = playedGamesSnap;
            changeListener3();
        })
        this._userRef.onSnapshot(snap => {
            this._userSnapshot = snap;
            changeListener2();
        });
        
	}
	stopListening() {
	}

}
function htmlToElement(html) {
	let template = document.createElement("TEMPLATE");
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.MainPageController = class {
    constructor() {
        if (rhit.fbAuthManager.isSignedIn) {
            document.querySelector("#addGameButton").style.visibility = "visible";
            document.querySelector("#addGameButton").addEventListener('click', (event) => {
                window.location.href = "/edit.html";
            });
        } else {
            document.querySelector("#addGameButton").style.visibility = "hidden";
        }
        rhit.fbMainManager.beginListening(this.updateGamesList.bind(this), this.updateUserGamesList.bind(this), this.updateFavoritedGamesList.bind(this));
    }
    updateFavoritedGamesList() {
        console.log(rhit.fbMainManager.games);
        let games = rhit.fbMainManager.favorited;
        const newList = htmlToElement(`<div id="favoriteGameListContainer" class="columns"></div>`);
		// Fill the photoListContainer with photo cards using a loop
		for (let i = 0; i < games.length; i++) {
			const g = games[i];
			const newCard = this.createCard(g);
			newCard.addEventListener("click", (event) => {
				window.location.href = `/play.html?id=${g.id}`;
			});
			newList.appendChild(newCard);
		}
		// Remove the old photoListContainer, and put in the new photoListContainer
		const oldList = document.querySelector("#favoriteGameListContainer");
		// Why hide, etc, when replaceWith exists?
		oldList.replaceWith(newList);
    }
    updateGamesList() {
        console.log(rhit.fbMainManager.games);
        let games = rhit.fbMainManager.games;
        const newList = htmlToElement(`<div id="gameListContainer" class="columns"></div>`);
		// Fill the photoListContainer with photo cards using a loop
		for (let i = 0; i < games.length; i++) {
			const g = games[i];
			const newCard = this.createCard(g);
			newCard.addEventListener("click", (event) => {
				window.location.href = `/game.html?id=${g.id}`;
			});
			newList.appendChild(newCard);
		}
		// Remove the old photoListContainer, and put in the new photoListContainer
		const oldList = document.querySelector("#gameListContainer");
		// Why hide, etc, when replaceWith exists?
		oldList.replaceWith(newList);
    }
    
    createCard(game) {
		return htmlToElement(`
        <div class="pin" data-id="${game.id}">
          <img class="img-fluid" src="${game.icon}">
          <p class="caption">${game.title}</p>
        </div>
      `);
	}
    updateUserGamesList() {
        console.log(rhit.fbMainManager.userGames);
        let games = rhit.fbMainManager.userGames;
        const newList = htmlToElement(`<div id="userGameListContainer" class="columns"></div>`);
		// Fill the photoListContainer with photo cards using a loop
		for (let i = 0; i < games.length; i++) {
			const g = games[i];
			const newCard = this.createCard(g);
			newCard.addEventListener("click", (event) => {
				window.location.href = `/edit.html?id=${g.id}`;
			});
			newList.appendChild(newCard);
		}
		// Remove the old photoListContainer, and put in the new photoListContainer
		const oldList = document.querySelector("#userGameListContainer");
		// Why hide, etc, when replaceWith exists?
		oldList.replaceWith(newList);
    }
}

rhit.initializePage = () => {
	const urlParams = new URLSearchParams(window.location.search);
    if (document.querySelector("#mainPage")) {
		rhit.fbMainManager = new rhit.FbMainManager();
		new rhit.MainPageController();
	}
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
	if (document.querySelector("#playPage")) {
		const gameId = urlParams.get("id");
		if (!gameId) {
			window.location.href = "/";
		}
		rhit.fbPlayManager = new rhit.FbPlayManager(gameId);
		new rhit.GamePlayPageController();
	}
	if(document.querySelector("#editPage")) {
		console.log("You are on the edit/create game page.");

        // Determine if there is a game id being passed (that means we're editing a game)
        const queryString = window.location.search;
		console.log(queryString);
		const urlParams = new URLSearchParams(queryString);
		const gameId = urlParams.get("id");

		if (!gameId) {
            console.log("Creating a new game");
		} else {
            console.log("Editing an existing game");
        }

        rhit.ECGameManager = new rhit.EditGameDataManager(gameId);
		new rhit.EditGameDataController(gameId);
	}
    if (document.querySelector("#searchPage")) {
        const search = urlParams.get("search") ?? '';
        rhit.fbSearchManager = new rhit.FbSearchManager();
        new rhit.SearchPageController(search);
    }
    document.querySelector("#searchForm").addEventListener("submit", (n) => {
        var item = document.getElementById("search").value;
        var form = document.getElementById("searchForm");
        window.location.href = `/search.html?search=${encodeURIComponent(item)}`;
        n.preventDefault();
    })
};

/* Main */
/** function and class syntax examples */
let Initialized = false;
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("auth change callback fired. TODO: check for redirect and init the page");
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		// Check for redirects
		rhit.checkForRedirects();
		// Initialize page
        if (!Initialized) {
            Initialized = true;
            rhit.initializePage();
        }
	});
};

rhit.main();
