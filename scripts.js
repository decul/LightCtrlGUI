var jsVersion = "1.0.4";
var commands = [];
var comIndex = 0;

var queuedCmd = "";
var httpBusy = false;

var lampAddress = "http://" + ($(location).attr('hostname') || "192.168.0.9") + "/";

var execute = function(command) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", lampAddress + command, true);
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            processResponse(this.responseText);
        }
    };
    xhttp.send();
}

var addCmdToQueue = function(command) {
    queuedCmd = command;
    executeQueuedCmd();
}

var executeQueuedCmd = function() {
    if (httpBusy || !queuedCmd)
        return;

    httpBusy = true;
    var xhttp = new XMLHttpRequest();
    xhttp.timeout = 5000;
    xhttp.open("GET", lampAddress + queuedCmd, true);
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            httpBusy = false;
            processResponse(this.responseText, true);
            executeQueuedCmd();
        }
    };
    xhttp.ontimeout = function () {
        httpBusy = false;
        executeQueuedCmd();
    };
    xhttp.send();
    queuedCmd = "";
}

var sendUserCommand = function() {
    var command = $("#command-box").val().trim();
    if (command === "") 
        return;

    sendCommand(command);
}

var sendCommand = function(command) {
    storeCommand(command);
    
    $("#output").append('<div class="command">' + command + '</div>');   
    $("#output").scrollTop($("#output")[0].scrollHeight);
    $(".command:last-child").click(runCommand);

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            var className = "response";
            if (this.status >= 400)
                className = "resp-e";

            var lines = processResponse(this.responseText).split('\n');
            if (lines.length == 0)
                lines.push(this.status)

            $(lines).each(function(i, line) {
                $("#output").append('<div class="' + className + '">' + formatResponse(line) + '</div>');
            });
            $("#output").scrollTop($("#output")[0].scrollHeight);
        }
    };

    command = command.replace(new RegExp(" ", 'g'), "/");
    xhttp.open("GET", lampAddress + command, true);
    xhttp.send();
}

var processResponse = function(response, skipColor = false) {
    var respObj = jQuery.parseJSON(response.trim().replace(/\n/g, "\\n"));

    if (!skipColor && respObj.hasOwnProperty("col")) {
        var colors = respObj.col.split(" ");
        $(".slider input").each(function (i) {
            if (i < colors.length) {
                this.value = parseFloat(colors[i]) * 1000;
            }
        });
    }

    if (respObj.hasOwnProperty("err")) {
        if (respObj.err) 
            $("#exclamation").show();
        else 
            $("#exclamation").hide();
    }

    if (respObj.hasOwnProperty("resp")) 
        return escapeHtml(respObj.resp);
    else 
        return "";
}

var initialize = function () {
    execute("status");

    $(window).on('focus', function () {
        execute("status");
    });

    $("#exclamation").click(function () {
        sendCommand("log e");
    });
    
    $("#on").click(function () {
        execute("on");
    });
    
    $("#off").click(function () {
        execute("off");
    });

    $(".slider input").on('input', function () {
        var command = "transit";
        $(".slider input").each(function (i) {
            command += "/" + (this.value / 1000);
        });
        addCmdToQueue(command);
    });

    $("#send").click(sendUserCommand);

    $("#clear").click(function () {
        $("#output").empty();
    });

    $("#full").click(function () {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            $("#full").removeClass("expanded");
        }
        else {
            document.getElementById("console-window").requestFullscreen();
            $("#full").addClass("expanded");
        }
    });

    $("#command-box").on('keydown',function(e) {
        switch (e.which) {
            case 13:    // Enter
                sendUserCommand();
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
    var logRegex      = /^(\d\d\d\d-\d\d-\d\dT)?\d\d:\d\d:\d\d (I|D|E): /;
    var onOffLogRegex = /^(\d\d\d\d-\d\d-\d\dT)?\d\d:\d\d:\d\d (ON|OFF)$/;

    if (logRegex.test(line)) {
        var parts = line.split(" ");
        var time = parts[0].replace("T", " ");
        var className = parts[1].toLowerCase()[0];
        var content = parts.slice(2).join(" ");
        return time + " <span class='resp-" + className + "'>" + content + "</span>";
    }

    if (onOffLogRegex.test(line)) {
        var parts = line.split(" ");
        var time = parts[0].replace("T", " ");
        var className = parts[1].toLowerCase();
        return "<span class='resp-" + className + "'>" + time + "</span>";
    }

    return line;
}



var loadSite = function() {
    var url = "https://decul.github.io/LightCtrlGUI/";
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

    var sendOnClick = e.currentTarget.attributes["sendOnClick"];
    if (sendOnClick) 
        sendUserCommand();
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