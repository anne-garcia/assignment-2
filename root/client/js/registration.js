class Registration {

    // Form elements
    form = null;
    inputFirstName = null;
    inputLastName = null;
    inputProfileImg = null;
    inputEmail = null;
    inputBirthDate = null;
    inputUsername = null;
    inputPassword = null;
    inputPassword2 = null;
    submitBtn = null;

    // Validation requirements
    fieldsUsedSet = null; // set object
    fieldsUsedCount = 0;
    passwordConfirmed = false;
    
    static HandleForm() {
        this.form = document.getElementById("form_userAccess");

        // We're using a set to capture each unique form field that needs to be filled out in some manner.
        this.fieldsUsedSet = new Set();

        // We're not validating any entry into the "password confirmation" field, because that will be checked implicitely.
        // Also deduct one for the submit button.
        this.fieldsUsedCount = this.form.elements.length - 2;

        this.inputFirstName = this.form.elements["firstName"];
        this.inputLastName = this.form.elements["lastName"];
        this.inputProfileImg = this.form.elements["profileImage"];
        this.inputEmail = this.form.elements["email"];
        this.inputBirthDate = this.form.elements["birthDate"];
        this.inputUsername = this.form.elements["username"];
        this.inputPassword = this.form.elements["password"];
        this.inputPassword2 = this.form.elements["password2"];
        this.submitBtn = this.form.elements["submitBtn"];

        this.submitBtn.setAttribute('disabled', '');
        this.submitBtn.addEventListener('click', this.SubmitForm);

        this.inputFirstName.addEventListener("keyup", event => this.TextInputValidationCheck(event.currentTarget));
        this.inputLastName.addEventListener("keyup", event => this.TextInputValidationCheck(event.currentTarget));
        this.inputProfileImg.addEventListener("change", event => this.InputValueValidationCheck(event.currentTarget));
        this.inputEmail.addEventListener("keyup", event => this.TextInputValidationCheck(event.currentTarget));
        this.inputBirthDate.addEventListener("change", event => this.InputValueValidationCheck(event.currentTarget));
        this.inputUsername.addEventListener("keyup", event => this.TextInputValidationCheck(event.currentTarget));
        this.inputPassword.addEventListener("keyup", event => this.TextInputValidationCheck(event.currentTarget));
         // Password gets an additional event check, incase password 2 is changed first, then password is changed to match it.
        this.inputPassword.addEventListener("keyup", this.PasswordConfirmedCheck);
        this.inputPassword2.addEventListener("keyup", this.PasswordConfirmedCheck);

        // Due to this being used during editing, we need to check immediately if the form already has valid content.
        this.TextInputValidationCheck(this.inputFirstName);
        this.TextInputValidationCheck(this.inputLastName);
        this.InputValueValidationCheck(this.inputProfileImg);
        this.TextInputValidationCheck(this.inputEmail);
        this.InputValueValidationCheck(this.inputBirthDate);
        this.TextInputValidationCheck(this.inputUsername);
        this.TextInputValidationCheck(this.inputPassword);
    }

    // Check all typed text
    static TextInputValidationCheck = (el) => {
        const name = el.getAttribute("name");

        // If nothing in the field at all, highlight as nothing (nothing is indeed invalid, but does not require "invalid" highlighting, so long as it's articulated that all form fields are required)
        if(el.value == "") {
            this.fieldsUsedSet.delete(name);
            Main.HighlightNone(el);
        }
        else {
            this.fieldsUsedSet.add(name);

            // ! Simply valid if it exists, for now
            Main.HighlightValid(el);
        }

        this.CheckFullFormValid();
    }

    // Valid if any value exists
    static InputValueValidationCheck = (el) => {
        const name = el.getAttribute("name");

        if(el.value == "") {
            this.fieldsUsedSet.delete(name);
            Main.HighlightNone(el);
        }
        else {
            this.fieldsUsedSet.add(name);
            Main.HighlightValid(el);
        }

        this.CheckFullFormValid();
    }

    // Valid if password fields match
    static PasswordConfirmedCheck = (event) => {
        this.passwordConfirmed = false;

        if(this.inputPassword2.value == "") {
            Main.HighlightNone(this.inputPassword2);
        }
        else {
            if(this.inputPassword2.value == this.inputPassword.value) {
                Main.HighlightValid(this.inputPassword2);
                this.passwordConfirmed = true;
            }
            else {
                Main.HighlightInvalid(this.inputPassword2);
            }
        }

        this.CheckFullFormValid();
    }

    static CheckFullFormValid() {

        const allfieldsUsed = this.fieldsUsedSet.size == this.fieldsUsedCount;

        if(allfieldsUsed && this.passwordConfirmed) {
            this.submitBtn.removeAttribute('disabled');
        }
        else {
            this.submitBtn.setAttribute('disabled', '');
        }
    }

    static SubmitForm = async (event) => {
        const fetchRoute = event.currentTarget.dataset['route'];
        const fetchMethod = event.currentTarget.dataset['method'];

        console.log(`On user edit button submit, route <${fetchRoute}>, method <${fetchMethod}>`);
        
        await fetch(fetchRoute, {
            method: fetchMethod,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                firstName: this.inputFirstName.value,
                lastName: this.inputLastName.value,
                profileImage: this.inputProfileImg.value,
                email: this.inputEmail.value,
                birthDate: this.inputBirthDate.value,
                username: this.inputUsername.value,
                password: this.inputPassword.value
            })
        });

        window.location.href = `/`;
    }
}