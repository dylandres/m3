// Client-side JS for doc.ejs
// Load event-listener
window.addEventListener("load", function() {
    // Delete button event-listener
    var deleteButton = document.getElementById("delete");
    deleteButton.addEventListener("submit", function() {
        var doc_id = deleteButton.getAttribute('doc_id');
        deleteDocument(doc_id);
    });
});

function deleteDocument(doc_id) {
    // Send an AJAX POST to /logout
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:8080/collection/delete", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    var payload = JSON.stringify({doc_id: doc_id});
    xhr.send(payload);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var json = JSON.parse(xhr.responseText);
            // Redirect to home page after deletion
            if (json['error'] == false)
                window.location.assign(`http://localhost:8080/home`);
        }
    }
}