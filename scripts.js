var execute = function(command) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "http://192.168.0.9/" + command, true);
    xhttp.send();
}

var sendCommand = function() {
    var command = $("#command-box").val();
    var erase = $("#erase").is(':checked');

    if (erase) {
        $("#command-box").val("");
    }

    $("#output").append('<div class="command">' + command + '</div>');   
    $("#output").scrollTop($("#output")[0].scrollHeight);

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var lines = this.responseText.trim().split('\n');
            $(lines).each(function(i, line) {
                $("#output").append('<div class="response">' + line + '</div>');
            });
            $("#output").scrollTop($("#output")[0].scrollHeight);
            updateColors();
        }
    };

    command = command.trim().replace(new RegExp(" ", 'g'), "/");
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

    $("#command-box").on('keypress',function(e) {
        if(e.which == 13) {
            sendCommand();
        }
    });
};



var loadSite = function() {
    var url = "https://decul.github.io/LightCtrl/";
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            document.children[0].innerHTML = this.responseText;
            $('link').each(function() {
                $(this).attr("href", url + $(this).attr("href"));
            });
            initialize();
        }
    }
    xhttp.open("GET", url, true);
    xhttp.send();
    //location.href = url;
}