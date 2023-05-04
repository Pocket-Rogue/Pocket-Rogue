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
rhit.ECGameManager = null;

rhit.EditGameDataController = class {
    constructor() {
        console.log("Added EditGameDataController.");


        const imageForm = document.querySelector('#imageForm');
        const logoForm = document.querySelector('#logoForm');
        const gameForm = document.querySelector('#gameForm');
        imageForm.addEventListener('submit', this.handleSubmit);
        logoForm.addEventListener('submit', this.handleSubmit);
        gameForm.addEventListener('submit', this.handleSubmit);
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
            rhit.ECGameManager.addGame();
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
        console.log("Created editGameDataManager.")
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
    addGame(event) {
        console.log("Add the new game!");
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