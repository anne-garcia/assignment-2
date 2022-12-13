class ArticleControls {

    static Init() {
        // Handle all delete button here (instead of HTML form) since the confirmation pop-up is required.
        const deleteBtns = document.getElementsByClassName("btnDeleteArticle");
        for(const btn of deleteBtns) {
            btn.addEventListener('click', async event => {
                const id = event.currentTarget.dataset['id'];
                if(confirm(`Are you sure you wish to delete: ${event.currentTarget.dataset['headline']}`)) {
                    await fetch(`/articles/${id}`, { method: "delete" });
                    location.reload();
                }
            });
        }

        // Handle all edit buttons here since we're already doing the delete buttons.
        const editBtns = document.getElementsByClassName("btnEditArticle");
        for(const btn of editBtns) {
            btn.addEventListener('click', event => {
                const id = event.currentTarget.dataset['id'];
                window.location.href = `/articleEdit/${id}`;
            });
        }
    }
}