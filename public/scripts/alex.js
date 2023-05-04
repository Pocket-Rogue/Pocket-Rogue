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

rhit.EditGameDataController = class {
    constructor() {
        const imageForm = document.querySelector('#imageForm');
        const logoForm = document.querySelector('#logoForm');
        const gameForm = document.querySelector('#gameForm');
        imageForm.addEventListener('submit', this.handleSubmit);
        logoForm.addEventListener('submit', this.handleSubmit);
        gameForm.addEventListener('submit', this.handleSubmit);
    }

    // Handle upload event here
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