
rhit.FB_KEY_CANVAS = "isCanvas";
rhit.FB_KEY_CODE = "code";

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
        if(rhit.fbPlayManager.isCanvas) {
            let canvas = document.createElement("CANVAS");
            canvas.id = "canvas";
            document.querySelector("#mainPage").appendChild(canvas);
        }
        let script = document.createElement("SCRIPT");
        script.src = fbPlayManager.code;
        document.body.appendChild(script);
	}
}
