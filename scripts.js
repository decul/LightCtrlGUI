var jsVersion = "1.0.4";
var respClassName = "";

var execute = function(command) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "http://192.168.0.9/" + command, true);
    xhttp.send();
}

var sendCommand = function() {
    var command = $("#command-box").val().trim();
    if (command === "") 
        return;

    $("#output").append('<div class="command">' + command + '</div>');   
    $("#output").scrollTop($("#output")[0].scrollHeight);

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var lines = escapeHtml(this.responseText).trim().split('\n');
            $(lines).each(function(i, line) {
                $("#output").append('<div class="response">' + formatResponse(line) + '</div>');
            });
            respClassName = "";
            $("#output").scrollTop($("#output")[0].scrollHeight);
            updateColors();
        }
    };

    command = command.replace(new RegExp(" ", 'g'), "/");
    xhttp.open("GET", "http://192.168.0.9/" + command, true);
    xhttp.send();
}

var updateColors = function() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var colors = this.responseText.split(" ");
            $(".slider input").each(function (i) {
                this.value = parseFloat(colors[i]) * 100;
            });
        }
    };
    xhttp.open("GET", "http://192.168.0.9/color", true);
    xhttp.send();
}

var initialize = function () {
    updateColors();

    $(window).on('focus', updateColors);

    $("#on").click(function () {
        execute("on");
    });
    
    $("#off").click(function () {
        execute("off");
    });

    $(".slider input").on('input', function () {
        var command = "color";
        $(".slider input").each(function (i) {
            command += "/" + (this.value / 100);
        })
        execute(command);
    });

    $("#send").click(sendCommand);

    $("#clear").click(function () {
        $("#output").empty();
    })

    $("#full").click(function () {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            $("#full").removeClass("expanded");
        }
        else {
            document.getElementById("console-window").requestFullscreen();
            $("#full").addClass("expanded");
        }
    })

    $("#command-box").on('keypress',function(e) {
        if(e.which == 13) {
            sendCommand();
        }
    });

    $("#output").append('<div style="color: #444444;">v' + jsVersion + '</div>');
};



var formatResponse = function(line) {
    var timeRegex = /^(\d+d )?\d+:\d+/;
    var typeRegex = /(Ard|ESP|Fail|Deb):/;
    if (timeRegex.test(line) && typeRegex.test(line)) {
        var parts = line.split(typeRegex);
        respClassName = parts[1].toLowerCase();
        return parts[0] + " <span class='resp-" + respClassName + "'>" + parts[2] + "</span>";
    }
    else if (respClassName != "") {
        return "<span class='resp-" + respClassName + "'>" + line + "</span>";
    }
    else {
        return line;
    }
}



var loadSite = function() {
    var url = "https://decul.github.io/LightCtrl/";
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            document.children[0].innerHTML = this.responseText.replace(new RegExp("href=\"", 'g'), "href=\"" + url);
            initialize();
        }
    }
    xhttp.open("GET", url, true);
    xhttp.send();
    //location.href = url;
}



var entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

var escapeHtml = function(string) {
    return String(string).replace(/[&<>"'`=\/]/g, function (s) {
        return entityMap[s];
    });
}