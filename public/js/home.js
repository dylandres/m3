// Client-side JS for home.ejs
// Load event-listener
window.addEventListener("load", function() {
    // On load, fetch the last 10 modified documents
    var allDocsList = document.getElementById("alldocs");
    populateList(allDocsList);
    // Logout button event-listener
    var logoutForm = document.getElementById("logout");
    logoutForm.addEventListener("submit", function() {
        logout()
    });
    // Create Doc button event-listener
    var createDocButton = document.getElementById("createdoc");
    createDocButton.addEventListener("submit", function() {
        createDocument(createDocButton)
    });
    // Search button event-listener
    var searchButton = document.getElementById("search");
    searchButton.addEventListener("submit", function() {
        search(searchButton)
    });
});

function logout() {
    // Send an AJAX POST to /logout
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://hotpink.cse356.compas.cs.stonybrook.edu/users/logout", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({}));
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Read JSON response
            var json = JSON.parse(xhr.responseText);
            // Redirect to login page
            if (json['error'] == false)
                window.location.assign(`http://hotpink.cse356.compas.cs.stonybrook.edu/`);
        }
    }
}

function createDocument(form) {
    var docname = form.docname.value;
    if (docname == '')
        docname = 'Untitled Document';
    // Send an AJAX POST to /logout
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://hotpink.cse356.compas.cs.stonybrook.edu/collection/create", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    var payload = JSON.stringify({'name': docname});
    xhr.send(payload)
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Read JSON response
            var json = JSON.parse(xhr.responseText);
            // Redirect to doc
            if (json['error'] == false)
                var docid = json['docid']
                window.location.assign(`http://hotpink.cse356.compas.cs.stonybrook.edu/home`);
        }
    }
}

function search(form) {
    var query = form.query.value;
    alert(`Searched for '${query}'`);
}

function populateList(list) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://hotpink.cse356.compas.cs.stonybrook.edu/collection/list", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({}));
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Populate doc list
            var docs = JSON.parse(xhr.responseText);
            docs.forEach((doc) => {
                // Create list element for doc
                var li = document.createElement("li");
                // Add an <a> tag
                var a = document.createElement("a");
                a.setAttribute('href', `http://hotpink.cse356.compas.cs.stonybrook.edu/doc/edit/${doc.id}`);
                a.innerHTML = doc.name;
                //add last modified time
                var xhr2 = new XMLHttpRequest();
                xhr2.open("GET", `http://hotpink.cse356.compas.cs.stonybrook.edu/doc/mapping/modified/${doc.id}`, false);
                xhr2.send();
                console.log(xhr2.responseText);
                var json = JSON.parse(xhr2.responseText);
                var date = json.map.modified;
                var time = 'AM';
                var hour = '00';
                var int_hour = ((parseInt(date.substring(11, 13)) - 4) + 24 )% 24;
                console.log(int_hour);
                if(int_hour >= 12)
                    time = 'PM'
                if(int_hour === 0)
                    hour = '12';
                else if(int_hour > 12) {
                    var tiempo = int_hour - 12;
                    if(tiempo < 10)
                        hour = '0' + tiempo;
                    else
                        hour = '' + tiempo;
                }
                else {
                    if (int_hour > 12)
                        hour = '0' + int_hour;
                    else
                        hour = '' + int_hour;
                }
                // Add delete button
                var form = document.createElement("form");
                form.setAttribute('id', `${doc.id}`);
                form.setAttribute('onsubmit', 'return false');
                var input = document.createElement("input");
                input.setAttribute('type', 'submit');
                input.setAttribute('value', 'Delete')
                // Organizing the DOM layers
                li.appendChild(a);
                li.innerHTML += '&nbsp&nbsp&nbsp';
                li.innerHTML += '(Last Modified: ' + date.substring(5,7) + '/' + date.substring(8,10) + '/' + date.substring(0,4) + ' ' + hour + ':' + date.substring(14,16) + ' ' + time + ')';
                li.innerHTML += '&nbsp&nbsp&nbsp';
                list.appendChild(li);
                form.appendChild(input)
                list.appendChild(form)
                list.appendChild(document.createElement("br"));
                // Delete button event-listener
                var deleteButton = document.getElementById(`${doc.id}`);
                deleteButton.addEventListener("submit", function() {
                    console.log(`${doc.id}`);
                    var xhr = new XMLHttpRequest();
                    xhr.open("POST", "http://hotpink.cse356.compas.cs.stonybrook.edu/collection/delete", true);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    var payload = JSON.stringify({doc_id: doc.id});
                    xhr.send(payload);
                    xhr.onreadystatechange = function() {
                        if (xhr.readyState == 4 && xhr.status == 200) {
                            var json = JSON.parse(xhr.responseText);
                            // Redirect to home page after deletion
                            if (json['error'] == false)
                                window.location.assign(`http://hotpink.cse356.compas.cs.stonybrook.edu/home`);
                        }
                    }
                });
            });
        }
    }
}
