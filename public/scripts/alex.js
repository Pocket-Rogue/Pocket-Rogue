var rhit = rhit || {};

rhit.GAME_COLLECTION = "Games";

rhit.GAME_BANNERCOLOR = "BannerColor";
rhit.GAME_APPROVED = "approved";
rhit.GAME_BANNER = "banner";
rhit.GAME_CODE = "code";
rhit.GAME_DESCRIPTION = "description";
rhit.GAME_DEVELOPER = "developer";
rhit.GAME_ICON = "icon";
rhit.GAME_ISCANVAS = "isCanvas";
rhit.GAME_TITLE = "title";
rhit.GAME_TOTAL_RATINGS = "totalRatings";
rhit.GAME_TOTAL_STARS = "totalStars";
rhit.ECGameManager = null;
rhit.GameId = null;

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
        document.querySelector("#colorButton").addEventListener('change', (event) => {
            console.log("Change the color!");
            rhit.ECGameManager.changeColor();
        });
        document.querySelector("#createButton").addEventListener('click', (event) => {
            console.log("Create a new game!");
            let success = rhit.ECGameManager.addGame();
            if (success == 1) {
                window.location.href = "index.html";
            }
        });
        document.querySelector("#viewButton").addEventListener('click', (event) => {
            console.log("View the game!");
            window.location.href = `game.html?id=${rhit.gameId}`;
        });
        document.querySelector("#saveButton").addEventListener('click', (event) => {
            console.log("Save the game!");
            let success = rhit.ECGameManager.saveGame();
            if (success == 1) {
                window.location.href = "index.html";
            }
        });
        document.querySelector("#deleteButton").addEventListener('click', (event) => {
            console.log("Delete the game!");
            let success = rhit.ECGameManager.deleteGame();
            window.location.href = "index.html";
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
        document.querySelector("#gameFile").value = rhit.ECGameManager.jsGameString;
        document.querySelector("#inputTitle").value = rhit.ECGameManager.title;
        document.querySelector("#inputAuthor").value = rhit.ECGameManager.author;
        document.querySelector("#inputDescription").value = rhit.ECGameManager.description;
    }
}

rhit.editGameDataManager = class {
    constructor(gameId) {
        this._documentSnapshot = {};
        this._unsubscribe = null;
        console.log("Created editGameDataManager.");
        rhit.gameId = gameId;
        if (!gameId) {
            console.log("We're creating a new game!");
            this._ref = firebase.firestore().collection(rhit.GAME_COLLECTION);
        } else {
            this._ref = firebase.firestore().collection(rhit.GAME_COLLECTION).doc(gameId);
            console.log(`Listing to ${this._ref.path}`);
            this._showEditButtons();
        }
    }
    beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				// doc.data() will be undefined in this case
				console.log("No such document!");
				//window.location.href = "/";
			}
		});
	}
	stopListening() {
		this._unsubscribe();
	}

    // If we're in edit mode, hide the publish button and show the other buttons
    _showEditButtons() {
        document.querySelector("#createButton").style.visibility = "hidden";
        document.querySelector("#viewButton").style.visibility = "visible";
        document.querySelector("#saveButton").style.visibility = "visible";
        document.querySelector("#deleteButton").style.visibility = "visible";
        console.log("Buttons should be toggled");
    }
    // Handle image upload display here
    loadMainImage(event) {
        var image = document.getElementById('uploadImage');
        image.src = URL.createObjectURL(event.target.files[0]);
    }
    loadLogoImage(event) {
        var image = document.getElementById('uploadLogo');
        image.src = URL.createObjectURL(event.target.files[0]);
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
        var captionColor = document.querySelector("#gameCaption").style.backgroundColor;
        var jsGameString = document.querySelector("#gameFile").value;
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
        if (jsGameString.length == 0) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease upload a javascript game file.");
        }
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
            return 0;
        }
        console.log("Passed validity check. Proceeding to publish the game...");
        console.log("Adding game ", this._ref);

        // Add a new entry to the Games collection in firestore.
        this._ref.add({
            [rhit.GAME_BANNERCOLOR]: captionColor,
            [rhit.GAME_APPROVED]: false,
            [rhit.GAME_BANNER]: mainImage,
            [rhit.GAME_CODE]: jsGameString,
            [rhit.GAME_DESCRIPTION]: description,
            [rhit.GAME_DEVELOPER]: author,
            [rhit.GAME_ICON]: logoImage,
            [rhit.GAME_ISCANVAS]: false,
            [rhit.GAME_TITLE]: title,
            [rhit.GAME_TOTAL_RATINGS]: 0,
            [rhit.GAME_TOTAL_STARS]: 0,
        })
        .then((docRef) => {
            console.log("Game published with ID: ", docRef.id);
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
        });

        return 1;
    }

    saveGame() {
        // Fetch game values
        console.log("Saving changes to the game...");
        var mainImage = document.querySelector("#uploadImage").src;
        var logoImage = document.querySelector("#uploadLogo").src;
        var captionColor = document.querySelector("#gameCaption").style.backgroundColor;
        var jsGameString = document.querySelector("#gameFile").value;
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
        if (jsGameString.length == 0) {
            invalidPublish = true;
            alertString = alertString.concat("\nPlease upload a javascript game file.");
        }
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
            return 0;
        }
        console.log("Passed validity check. Proceeding to save changes...");

        console.log("Updating the game ", this._ref);
        // Update the existing entry to the Games collection in firestore.
        this._ref.update({
            [rhit.GAME_BANNERCOLOR]: captionColor,
            [rhit.GAME_BANNER]: mainImage,
            [rhit.GAME_CODE]: jsGameString,
            [rhit.GAME_DESCRIPTION]: description,
            [rhit.GAME_DEVELOPER]: author,
            [rhit.GAME_ICON]: logoImage,
            [rhit.GAME_TITLE]: title,
        })
        .then(() => {
            console.log("Changes saved");
        })
        .catch((error) => {
            console.error("Error saving changes: ", error);
        });

        return 1;
    }

    deleteGame() {
        console.log("Deleting the following game: ", this._ref);
        return this._ref.delete();
    }

    get mainImage() {
        return this._documentSnapshot.get(rhit.GAME_BANNER);
    }
    get logoImage() {
        return this._documentSnapshot.get(rhit.GAME_ICON);
    }
    get captionColor() {
        return this._documentSnapshot.get(rhit.GAME_BANNERCOLOR);
    }
    get jsGameString() {
        return this._documentSnapshot.get(rhit.GAME_CODE);
    }
    get title() {
        return this._documentSnapshot.get(rhit.GAME_TITLE);
    }
    get author() {
        return this._documentSnapshot.get(rhit.GAME_DEVELOPER);
    }
    get description() {
        return this._documentSnapshot.get(rhit.GAME_DESCRIPTION);
    }

}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

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

        rhit.ECGameManager = new rhit.editGameDataManager(gameId);
		new rhit.EditGameDataController(gameId);
	}
};

rhit.main();