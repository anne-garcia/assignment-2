class Main {
    
    static HighlightNone(htmlElement) {
        htmlElement.classList.remove('highlightValid');
        htmlElement.classList.remove('highlightInvalid');
        htmlElement.classList.add('highlightNone');
    }
    static HighlightValid(htmlElement) {
        htmlElement.classList.add('highlightValid');
        htmlElement.classList.remove('highlightInvalid');
        htmlElement.classList.remove('highlightNone');
    }
    static HighlightInvalid(htmlElement) {
        htmlElement.classList.remove('highlightValid');
        htmlElement.classList.add('highlightInvalid');
        htmlElement.classList.remove('highlightNone');
    }

    btnCreateArticle = null;

    btnLogout = null;
    btnDeleteAccount = null;
    btnModifyAccount = null;
    
    static HandleNavControls() {
        this.btnCreateArticle = document.getElementById("BtnCreateArticle");

        this.btnLogout = document.getElementById("BtnLogout");
        this.btnModifyAccount = document.getElementById("BtnModifyAccount");
        this.btnDeleteAccount = document.getElementById("BtnDeleteAccount");

        this.btnCreateArticle?.addEventListener('click', () => {
            window.location.href = `/articleCreate`;
        });

        this.btnLogout?.addEventListener('click', () => {
            window.location.href = `/logout`;
        });

        this.btnModifyAccount?.addEventListener('click', async () => {
            // await fetch('/modifyAccount', {
            //     method: "PATCH",
            //     headers: {
            //         'Accept': 'application/json',
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify({
                    
            //     })
            // });
    
            // window.location.href = `/`;

            window.location.href = `/modifyAccount`;
        });

        this.btnDeleteAccount?.addEventListener('click', async () => {
            if(confirm(`Are you sure you wish to delete your account?`)) {
                await fetch(`/deleteAccount`, { method: "delete" });
                location.reload();
            }
        });
    }
}