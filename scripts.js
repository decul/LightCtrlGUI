var jsVersion = "1.0.4";
var respClassName = "";
var commands = [];
var comIndex = 0;

var lampAddress = "http://" + ($(location).attr('hostname') || "192.168.0.9") + "/";

var execute = function(command) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", lampAddress + command, true);
    xhttp.send();
}

var sendCommand = function() {
    var command = $("#command-box").val().trim();
    if (command === "") 
        return;

    storeCommand(command);

    $("#output").append('<div class="command">' + command + '</div>');   
    $("#output").scrollTop($("#output")[0].scrollHeight);
    $(".command:last-child").click(runCommand);

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
    xhttp.open("GET", lampAddress + command, true);
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
    xhttp.open("GET", lampAddress + "color", true);
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

    $("#command-box").on('keydown',function(e) {
        switch (e.which) {
            case 13:    // Enter
                sendCommand();
                break;

            case 38:    // Up
                comIndex--;
                loadCommand();
                break;

            case 40:    // Down
                comIndex++;
                loadCommand();
                break;

            case 27:    // Esc
                comIndex = commands.length;
                loadCommand();
                break;
        }
    });

    $("#drop-list *").click(runCommand);

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
            document.children[0].innerHTML = this.responseText.replace(new RegExp('href="', 'g'), 'href="' + url);
            initialize();
        }
    }
    xhttp.open("GET", url, true);
    xhttp.send();
    //location.href = url;
}

var isAndroid = function() {
    return navigator.userAgent.match(/Android/i);
}



var storeCommand = function(command) {
    var index = commands.indexOf(command);
    if (index >= 0) 
        commands.splice(index, 1);
    commands.push(command);
    comIndex = commands.length;
    $("#command-box").val("");
}

var loadCommand = function() {
    if (comIndex < 0)
        comIndex = 0;
    if (comIndex > commands.length)
        comIndex = commands.length;

    if (comIndex == commands.length)
        $("#command-box").val("");
    else
        $("#command-box").val(commands[comIndex]);

    event.preventDefault();
}

var runCommand = function(e) {
    var cmd = e.currentTarget.attributes["cmd"];
    if (cmd != null)
        $("#command-box").val(cmd.value);
    else
        $("#command-box").val(e.currentTarget.innerText);

    if (!isAndroid())
        $("#command-box").focus();
    commIndex = commands.length;
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