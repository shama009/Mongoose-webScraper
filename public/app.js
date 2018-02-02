$(document).ready(function () {
    // Grab the articles as a json
    $.getJSON("/articles", function (data) {
        // For each one
        $(".articles").empty();
        for (var i = 0; i < data.length; i++) {
            // Display the apropos information on the page
            var panelDiv = $("<div class='panel panel-default'>");
            var panelHeadingDiv = $("<div class='panel-heading'>").append("<h3 id='heading' data-id='" + data[i]._id + "'><a class='article-link' href=" + data[i].link + " target='_blank'>" + data[i].title +
                "</a>&nbsp;&nbsp;&nbsp;<a class='btn btn-success' id='saveArticle'>Save Article</a></h3>");
            var panelBodyDiv = $("<div class='panel-body' id='summary'>").append("<p>" + data[i].summary + "</p>");
            panelDiv.append(panelHeadingDiv).append(panelBodyDiv);
            $(".articles").append(panelDiv);
        }
    });
    // scrape new articles
    $("#scrape").on("click", function () {
        $.getJSON("/scrape", function () {
            refreshPage();
        });
    });
    // save articles
    $(document).on("click", "#saveArticle", function () {
        // AJAX POST call to the submit route on the server
        // This will take the data from the form and send it to the server
        $.ajax({
            type: "POST",
            dataType: "json",
            url: "/api/article/update",
            data: {
                id: $("#heading").attr("data-id"),
                isSaved: true
            }
        }).then(function(data){
            refreshPage();
        });
    });
    function refreshPage(){
            //set timeout to refresh page after 1 sec to see updated articles
            var timeout = 1000;
            setTimeout(function () {
               window.location.reload();
            }, timeout);
    }
});
