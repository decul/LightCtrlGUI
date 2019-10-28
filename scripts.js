var execute = function(command) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", "http://192.168.0.9/" + command, true);
    xhttp.send();
}

$(document).ready(function () {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var colors = this.responseText.split(" ");
            var value = parseFloat(colors[0]) * 100;
            //$("#red").val(value);
            $(".slider").each(function (i) {
                this.value = parseFloat(colors[i]) * 100;
            })
        }
    };
    xhttp.open("GET", "http://192.168.0.9/color", true);
    xhttp.send();

    $("#on").click(function () {
        execute("on");
    });
    
    $("#off").click(function () {
        execute("off");
    });

    $(".slider").on('input', function () {
        var command = "color";
        $(".slider").each(function (i) {
            command += "/" + (this.value / 100);
        })
        execute(command);
    })
});