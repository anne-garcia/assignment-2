class ArticleEdit {

    // Form elements
    form = null;
    inputHeadline = null;
    inputSubHead = null;
    inputArticleImg = null;
    inputContent = null;
    submitBtn = null;

    // Validation requirements
    fieldsUsedSet = null; // set object
    // Only headline and content are mandatory
    inputHeadlineName = "";
    inputContentName = "";

    static HandleForm() {
        this.form = document.getElementById("form_articleEdit");

        this.inputHeadline = this.form.elements["headline"];
        this.inputSubHead = this.form.elements["subHead"];
        this.inputArticleImg = this.form.elements["image"];
        this.inputContent = this.form.elements["content"];
        this.submitBtn = this.form.elements["submitBtn"];

        this.fieldsUsedSet = new Set();
        this.inputHeadlineName = this.inputHeadline.getAttribute("name");
        this.inputContentName = this.inputContent.getAttribute("name");

        this.inputHeadline.addEventListener("keyup", event => this.TextInputValidationCheck(event.currentTarget));
        this.inputSubHead.addEventListener("keyup", event => this.TextInputValidationCheck(event.currentTarget));
        this.inputArticleImg.addEventListener("change", event => this.InputValueValidationCheck(event.currentTarget));
        this.inputContent.addEventListener("keyup", event => this.TextInputValidationCheck(event.currentTarget));

        this.submitBtn.setAttribute('disabled', '');
        this.submitBtn.addEventListener('click', this.SubmitForm);

        // Due to this being used during editing, we need to check immediately if the form already has valid content.
        this.TextInputValidationCheck(this.inputHeadline);
        this.TextInputValidationCheck(this.inputSubHead);
        this.InputValueValidationCheck(this.inputArticleImg);
        this.TextInputValidationCheck(this.inputContent);
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

    static CheckFullFormValid() {

        // Just check the only 2 required fields directly
        const allfieldsUsed = 
        this.fieldsUsedSet.has(this.inputHeadlineName) &&
        this.fieldsUsedSet.has(this.inputContentName);

        if(allfieldsUsed) {
            this.submitBtn.removeAttribute('disabled');
        }
        else {
            this.submitBtn.setAttribute('disabled', '');
        }
    }

    static SubmitForm = async (event) => {
        const fetchRoute = event.currentTarget.dataset['route'];
        const fetchMethod = event.currentTarget.dataset['method'];

        console.log(`On article edit button submit, route <${fetchRoute}>, method <${fetchMethod}>`);
        
        await fetch(fetchRoute, {
            method: fetchMethod,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                headline: this.inputHeadline.value,
                subHead: this.inputSubHead.value,
                image: this.inputArticleImg.value,
                content: this.inputContent.value
            })
        });

        window.location.href = `/`;
    }
}