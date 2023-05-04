var rhit = rhit || {};

/** TODO
 * Functions to construct for edit/create game page
 * String gameID
 * Firebase ref
 * getIsApproved
 * getGameName
 * getGameTag
 * getGameBanner
 * setGameBanner
 * getGameCode
 * setGameCode
 * getGameIsCanvas
 * setGameIsCanvas
*/
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

rhit.EditGameDataController = class {
    constructor() {
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
}

rhit.editGameDataManager = class {
    constructor() {
        console.log("Created editGameDataManager.");
        this._ref = firebase.firestore().collection(rhit.GAME_COLLECTION);
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

    // Handle adding a new game here. Occurs when "publish" is pressed
    // TODO: Add functionality to publish a game. The following should be implemented:
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

        // Add a new entry to the Games collection in firestore.
        this._ref.add({
            [rhit.GAME_BANNERCOLOR]: captionColor,
            [rhit.GAME_APPROVED]: false,
            [rhit.GAME_BANNER]: mainImage,
            [rhit.GAME_CODE]: jsGameString,
            [rhit.GAME_DESCRIPTION]: description,
            [rhit.GAME_DEVELOPER]: author,
            [rhit.GAME_ICON]: logoImage,
            [rhit.GAME_ISCANVAS]: true,
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
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

	if(document.querySelector("#editPage")) {
		console.log("You are on the edit/create game page.");
        rhit.ECGameManager = new rhit.editGameDataManager();
		new rhit.EditGameDataController();
	}
};

rhit.main();