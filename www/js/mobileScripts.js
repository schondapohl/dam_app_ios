var zeigeStartLogo = true;
var uniqueID = randomUUID();
var vortraegeGelesenNachLogin = false;
var serverconfig = 0;
var socket;
var verbindungsVersuche = 0;

function getServer() {
    if (serverconfig == 0) {
        return 'http://www.dam2013.org/';
    }
    else if (serverconfig == 1) {
        return 'http://localhost/';
    }
}

function getPath()
{
    if (serverconfig == 0) {
        return 'app/';
    }
    else if (serverconfig == 1) {
        return 'dam/';
    }
}

function initControls()
{
    $.support.cors = true;
    $.mobile.allowCrossDomainPages = true;
    zeigeStartLogo = false;
    zeigeAppGui();

    $('.showInfo').click(function () {
        $(this).find('.expl').toggle();
    })

    $('#v_d').click(function () {
        abstimmen('d');
    })

    $('#v_c').click(function () {
        abstimmen('c');
    })

    $('#v_b').click(function () {
        abstimmen('b');
    })

    $('#v_a').click(function () {
        abstimmen('a');
    })


    $('#umfrageTabelletd4').click(function () {
        abstimmen('d');
    })

    $('#umfrageTabelletd3').click(function () {
        abstimmen('c');
    })

    $('#umfrageTabelletd2').click(function () {
        abstimmen('b');
    })

    $('#umfrageTabelletd1').click(function () {
        abstimmen('a');
    })

    $('#noconnection').click(function () {
        delayedConnectionTry();
    })

    $('#connection').click(function () {
        //delayedConnectionTry();
    })

    $('#loginDiv').click(function () {
        $('#loginButton2').click();
    })

    $('#logoutDiv').click(function () {
        logoff();
    })
}

function zeigeAppGui() {
    $('#startLogo').hide();
    $('.contentWrapper').show();
    $('#footerBar').show();
}

function loginStart() {
    $('.formElement').hide();
    $('#loginButton').hide();
    $('#loginLoader').show();
    $('#errorMessage').hide();

    if ($('#username').val() != "" && $('#userpw').val() != "") {
        $.ajax({
            dataType:'jsonp',
            data:{u:$('#username').val(), p:$('#userpw').val()},
            jsonp:'jsonp_callback',
            url:'http://www.dam2013.org/tl_files/dam/php/mobile/login.php',
            success:function (data) {
                if (data.login == true) {
                    window.localStorage.setItem("benutzer", data.u);
                    window.localStorage.setItem("hash", data.hash);
                    window.localStorage.setItem("voted", data.state);
                    window.localStorage.setItem("punkte", 0);
                    window.localStorage.setItem("status", 2);
                    if (data.m == true) {
                        $('#adminButton').show();
                    }
                    else {
                        $('#adminButton').hide();
                    }
                    $('.ui-dialog').dialog('close');
                    leseVortragsStatus();
                }
                else {
                    $('#errorMessage').html("Login nicht erfolgreich");
                    $('#errorMessage').fadeIn('slow');
                    $('.formElement').show();
                    $('#loginButton').show();
                    $('#loginLoader').hide();
                    window.localStorage.setItem("status", 1);
                    manageGui();
                }
            }
        });
    }
    else {
        $('#errorMessage').html("Benutzername und Passwort eingeben");
        $('#errorMessage').fadeIn('slow');
        $('.formElement').show();
        $('#loginButton').show();
        $('#loginLoader').hide();
        window.localStorage.setItem("status", 1);
    }
}

function leseVortragsStatus() {

    $.ajax({
        dataType:'jsonp',
        data:{mode:"userlogindone", uid:window.localStorage.getItem("hash")},
        jsonp:'jsonp_callback',
        url:getServer() + getPath() + 'ajax_vortrag.php',
        success:function (data) {
            console.log(data);
            enableDisableVotings(data);
            manageGui();
        }
    });
}


function enableDisableVotings(data) {
    /* Hauptarray */
    $('.vortragWrapper').hide();
    $('.vortragWrapper').removeClass('ui-disabled').addClass('ui-disabled');
    dlength = data.length;
    for (var i = 0; i < dlength; i++) {
        /* Vortrag */
        vortrag = data[i];
        console.log("enableDisableVotings:" + vortrag.vtitel + " ist aktiv " + vortrag.aktiv);
        if (vortrag.aktiv == 1) {
            $('#vortragWrapper_' + i + " h4").html(vortrag.vtitel + " - " + vortrag.vautor);
            // keine Punkte bisher vergeben
            if (vortrag.eigenePunkte.length == 0) {
                $('#vh_' + i + "").val(vortrag.vid);
                $('#vortragWrapper_' + i + "").show();
                $('#vortragWrapper_' + i + "").removeClass('ui-disabled');
                $('#vote_' + i + "").click(function () {
                    bewerten(this.id);
                })
            }
            else {
                $('#vortragWrapper_' + i + "").show();
                $('#vote_' + i + "").hide();
                $('#slider-fill_' + i + "_1-label").hide();
                $('#slider-fill_' + i + "_2-label").hide();
                $('#slider-fill_' + i + "_3-label").hide();
                $('#slider-fill_' + i + "_1").hide();
                $('#slider-fill_' + i + "_2").hide();
                $('#slider-fill_' + i + "_3").hide();
                $('#vortragWrapper_' + i + " .ui-slider").hide();
                punkte1 = 0;
                punkte2 = 0;
                punkte3 = 0;
                for (var e = 0; e < vortrag.eigenePunkte.length; e++) {
                    punkteArray = vortrag.eigenePunkte[e];
                    if (vortrag.eigenePunkte[e].kriterium == 1) {
                        punkte1 = parseInt(punkte1 + vortrag.eigenePunkte[e].punkte);
                        $('#slider-fill_' + i + "_1").val(vortrag.eigenePunkte[e].punkte);
                    }
                    else if (vortrag.eigenePunkte[e].kriterium == 2) {
                        punkte2 = parseInt(punkte2 + vortrag.eigenePunkte[e].punkte);
                        $('#slider-fill_' + i + "_2").val(vortrag.eigenePunkte[e].punkte);
                    }
                    else if (vortrag.eigenePunkte[e].kriterium == 3) {
                        punkte3 = parseInt(punkte3 + vortrag.eigenePunkte[e].punkte);
                        $('#slider-fill_' + i + "_3").val(vortrag.eigenePunkte[e].punkte);
                    }
                }
                if (vortrag.gesPunkte.length > 0) {
                    for (var e = 0; e < vortrag.gesPunkte.length; e++) {
                        punkteArray = vortrag.gesPunkte[e];
                        if (vortrag.gesPunkte[e].kriterium == 1) {
                            punkte1 = parseInt(punkte1 + vortrag.gesPunkte[e].punkte);
                        }
                        else if (vortrag.gesPunkte[e].kriterium == 2) {
                            punkte2 = parseInt(punkte2 + vortrag.gesPunkte[e].punkte);
                        }
                        else if (vortrag.gesPunkte[e].kriterium == 3) {
                            punkte3 = parseInt(punkte3 + vortrag.gesPunkte[e].punkte);
                        }
                    }
                }
                $('#vortrag_erg_' + i + "").show();
                $('#vortrag_erg_' + i + "").html("Gesamtpunkte:<div class=\"kritzusammenfassung\"> - Kriterium 1: Punkte " + punkte1 + "</div><div class=\"kritzusammenfassung\"> - Kriterium 2: Punkte " + punkte2 + "</div><div class=\"kritzusammenfassung\"> - Kriterium 3: Punkte " + punkte3 + "</div>");

            }
        }
    }
}

function bewerten(theid) {
    bid = theid.split('_');
    namea = "slider-fill_" + bid[1] + "_1";
    nameb = "slider-fill_" + bid[1] + "_2";
    namec = "slider-fill_" + bid[1] + "_3";

    $('#vote_' + bid[1]).removeClass('ui-disabled').addClass('ui-disabled');

    $('#bewerten_laden_' + bid[1]).show();
    $.ajax({
        dataType:'jsonp',
        data:{mode:"bewerten", vid:$('#vh_' + bid[1]).val(), u:window.localStorage.getItem("hash"), a:$('#' + namea).val(), b:$('#' + nameb).val(), c:$('#' + namec).val()},
        jsonp:'jsonp_callback',
        url:getServer() + getPath() + 'ajax_vortrag.php',
        success:function (data) {
            if (data.a && data.b && data.c) {
                leseVortragsStatus();
                manageGui();
            }
            else {
                alert("Fehler bei der Bewertung");
            }

        }
    });
    $('#bewerten_laden_' + bid[1]).hide();
}

function manageGui() {
    if (typeof(window.localStorage) != 'undefined') {
        if (window.localStorage.getItem("status") != null && window.localStorage.getItem("status") == 2) {
            $('#loginDiv').hide();
            $('#logoutDiv').show();
            $('#abstimmungscontroller').removeClass("ui-disabled");
            $('#abstimmungsheadline').html("Vortr&auml;ge bewerten");
            $('#interactiveController').removeClass("ui-disabled");
            $('#interactiveControllerHeadline').html("Interaktiver Vortrag");
            if (!vortraegeGelesenNachLogin) {
                leseVortragsStatus();
                vortraegeGelesenNachLogin = true;
                delayedConnectionTry();
            }
        }
        else {
            $('#loginDiv').show();
            $('#logoutDiv').hide();
            $('#abstimmungscontroller').addClass("ui-disabled");
            $('#abstimmungsheadline').html('Vortr&auml;ge bewerten (bitte einloggen)');
            $('#interactiveController').addClass("ui-disabled");
            $('#interactiveControllerHeadline').html("Interaktiver Vortrag (bitte einloggen)");
        }
    }
}

function logoff() {
    window.localStorage.clear();
    window.localStorage.setItem("status", 1);
    $('#loginDiv').show();
    $('#logoutDiv').hide();
    $('#abstimmungscontroller').addClass("ui-collapsible-collapsed");
    $('#interactiveController').addClass("ui-disabled");
    manageGui();
}

function damNotConnected() {
    $('#noconnection').show();
    $('#connection').hide();
}

function damConnected() {
    $('#noconnection').hide();
    $('#connection').show();
}

function clientListen() {
    socket = io.connect('http://app.emzed.de:8081');
    socket.on('connecting', function () {
        damNotConnected();
        console.log("Socket is connecting");
    });
    socket.on('connect', function () {
        console.log("Socket is connected");
        damConnected();
        umfrageAktiv();
    });
    socket.on('connect_failed', function () {
        console.log("Connection is failed");
        damNotConnected();
    });
    socket.on('message', function (message, callback) {
        console.log(message);
        damConnected();
        if (message.typ == 1) {
            if (message.neu == true) {
                $('#v_frage').html(message.frage);
                $('#v_a').html(message.a);
                $('#v_b').html(message.b);
                $('#v_c').html(message.c);
                $('#v_d').html(message.d);
                $('#v_value').val(message.fid);
                //$('#votingLink').click();
                $('#votingDiv').removeClass('hidden visibleVotingDiv').addClass('visibleVotingDiv');
                $('#umfrageTabelletd1').height($('#votingDiv').height() / 2);
                $('#umfrageTabelletd2').height($('#votingDiv').height() / 2);
                $('#umfrageTabelletd3').height($('#votingDiv').height() / 2);
                $('#umfrageTabelletd4').height($('#votingDiv').height() / 2);
            }
            else if (message.beendet == true) {
                window.localStorage.removeItem("frage");
            }
        }
        if (message.typ == 2) {
            if (message.beendet == true) {
                //$('#popupDialog').popup("close");
                $('#votingDiv').removeClass('hidden visibleVotingDiv').addClass('hidden');
            }
            else if (message.beendet == true) {
                window.localStorage.removeItem("frage");
            }
        }
        if (message.typ == 3) {
            leseVortragsStatus();
        }
    });
    socket.on('firstConnection', function () {
        damConnected();
        if (typeof device === "undefined") {
            alert('Erster Connect!');
        }
        else {
            navigator.notification.alert('First Connect');
        }
    });
    socket.on('reconnecting', function () {
        damNotConnected();
        console.log("Reconnecting to Socket");
    });
    socket.on('reconnect', function () {
        damNotConnected();
        console.log("Reconnection is completed");
    });
    socket.on('reconnect_failed', function () {
        damNotConnected();
        console.log("Reconnection is failed");
    });
    socket.on('disconnect', function () {
        damNotConnected();
        console.log("Socket is disconnected");
    });
}


function altbackup() {
    $('#interactiveDialogController').click();
    setInteractiveElements();
}

function randomUUID() {
    var s = [], itoh = '0123456789ABCDEF';

    // Make array of random hex digits. The UUID only has 32 digits in it, but we
    // allocate an extra items to make room for the '-'s we'll be inserting.
    for (var i = 0; i < 36; i++) s[i] = Math.floor(Math.random() * 0x10);

    // Conform to RFC-4122, section 4.4
    s[14] = 4;  // Set 4 high bits of time_high field to version
    s[19] = (s[19] & 0x3) | 0x8;  // Specify 2 high bits of clock sequence

    // Convert to hex chars
    for (var i = 0; i < 36; i++) s[i] = itoh[s[i]];

    // Insert '-'s
    s[8] = s[13] = s[18] = s[23] = '-';

    return s.join('');
}

function abstimmen(antwort) {
    console.log("Abgestimmt fuer " + $('#v_value').val() + " mit " + antwort);
    $('#votingLoading').show();
    $('#umfrageTabelle').hide();
    var uid = null;
    if (typeof device === "undefined") {
        uid = uniqueID;
    }
    else {
        uid = device.name;
    }
    console.log("ID " + uid);

    $.ajax({
        dataType:'jsonp',
        data:{mode:'abstimmen', fid:$('#v_value').val(), a:antwort, u:uid},
        jsonp:'jsonp_callback',
        url:getServer() + getPath() + 'abstimmen.php',
        success:function (data) {
            if (data.gezaehlt == true) {
                console.log('Stimme erfasst');
                if (typeof device === "undefined") {
                    alert('Vielen Dank. Ihre Stimme wurde erfasst!');
                }
                else {
                    navigator.notification.alert('Vielen Dank. Ihre Stimme wurde erfasst!');
                }
                $('#votingDiv').removeClass('hidden visibleVotingDiv').addClass('hidden');
            }
            else {
                console.log('Stimme nicht erfasst');
                if (typeof device === "undefined") {
                    alert('Stimme wurde nicht erfasst!');
                }
                else {
                    navigator.notification.alert('Stimme wurde nicht erfasst!');
                }
            }
        }
    });
    $('#umfrageTabelle').show();
    $('#votingLoading').hide();
}

function umfrageAktiv() {
    console.log("umfrageAktiv() - Pruefen ob Umfrage aktiv ist ...");
    var uid = null;
    if (typeof device === "undefined") {
        uid = uniqueID;
    }
    else {
        uid = device.uuid;
    }
    console.log("umfrageAktiv() - Meine UniqueID " + uid);
    $.ajax({
        dataType:'jsonp',
        data:{mode:'pruefeAufAktiveUmfrage', gid:uid},
        jsonp:'jsonp_callback',
        url:getServer() + getPath() + 'abstimmen.php',
        success:function (data) {
            zeigeAppGui();
            zeigeStartLogo = false;
            console.log("umfrageAktiv() - Antwortdaten");
            console.log(data);
            if (data.gestartet == true) {
                $('#v_frage').html(data.frage);
                $('#v_a').html(data.a);
                $('#v_b').html(data.b);
                $('#v_c').html(data.c);
                $('#v_d').html(data.d);
                $('#v_value').val(data.fid);
                //$('#votingLink').click();
                if (data.abgestimmt == false) {
                    $('#votingDiv').removeClass('hidden visibleVotingDiv').addClass('visibleVotingDiv');
                    $('#umfrageTabelletd1').height(($('#votingDiv').height() / 2 ) - 20);
                    $('#umfrageTabelletd2').height(($('#votingDiv').height() / 2 ) - 20);
                    $('#umfrageTabelletd3').height($('#votingDiv').height() / 2);
                    $('#umfrageTabelletd4').height($('#votingDiv').height() / 2);
                }
            }
        }
    });
}


function handleLogin() {
    var u = $("#username", form).val();
    var p = $("#password", form).val();

    if (u != '' && p != '') {
        $.post("http://www.emzed.de/tl_files/dam/php/mobile/login.php", {username:u, password:p}, function (res) {
            if (res == true) {
                //store
                window.localStorage["username"] = u;
                window.localStorage["password"] = p;
                $.mobile.changePage("some.html");
            } else {
                navigator.notification.alert("Your login failed", function () {
                });
            }
        }, "json");
    } else {
        navigator.notification.alert("Bitte Benutzer und Passwort eingeben", function () {
        });
    }
    return false;
}


function delayedConnectionTry() {
    if (typeof socket === "undefined") {
        verbindungsVersuche = verbindungsVersuche + 1;
        if (verbindungsVersuche > 3) {
            if (typeof device === "undefined") {
                alert('DAM App Server derzeit nicht erreichbar. Bitte pruefen Sie Ihre Internetverbindung oder versuchen Sie es spaeter erneut!');
            }
            else {
                navigator.notification.alert('DAM App Server derzeit nicht erreichbar. Bitte pruefen Sie Ihre Internetverbindung oder versuchen Sie es spaeter erneut!');
            }
        }
        else {
            clientListen();
        }
    }
    else {
        if (socket.socket.connected == false) {
            verbindungsVersuche = verbindungsVersuche + 1;
            if (verbindungsVersuche > 3) {
                if (typeof device === "undefined") {
                    alert('DAM App Server derzeit nicht erreichbar. Bitte pruefen Sie Ihre Internetverbindung oder versuchen Sie es spaeter erneut!');
                }
                else {
                    navigator.notification.alert('DAM App Server derzeit nicht erreichbar. Bitte pruefen Sie Ihre Internetverbindung oder versuchen Sie es spaeter erneut!');
                }
            }
            else {
                clientListen();
            }
        }
        else {
            console.log("Bereits verbunden");
            damConnected();
        }

    }
}

function generiereProgramm() {
    $.ajax({
        dataType:'jsonp',
        data:{mode:'generiereProgramm'},
        jsonp:'jsonp_callback',
        url:getServer() + getPath() + 'ajax_programm.php',
        success:function (data) {
            htmlcode = "";
            tag2found = false;
            counter = 0;
            console.log("generiereProgramm() - Antwortdaten");
            console.log(data);
            eintrag = "<li class=\"ui-li ui-li-static ui-body-c\">XXX - YYY Uhr: <b>WWWZZZ</b><div class=\"expl\">AAA</div></li>";
            htag1 = "<li data-role=\"list-divider\" role=\"heading\" class=\"ui-li ui-li-divider ui-btn ui-bar-e ui-btn-up-undefined\">Tag 1 (21.11.2013)</li>";
            htag2 = "<li data-role=\"list-divider\" role=\"heading\" class=\"ui-li ui-li-divider ui-btn ui-bar-e ui-btn-up-undefined\">Tag 2 (22.11.2013)</li>";
            dlength = data.length;
            for (var i = 0; i < dlength; i++) {
                if (data[i].tag == 1 && counter == 0) {
                    htmlcode = htmlcode + htag1;
                }

                if (data[i].tag == 2 && tag2found == false) {
                    tag2found = true;
                    htmlcode = htmlcode + htag2;
                }

                zeile = eintrag.replace("XXX", data[i].von);
                zeile = zeile.replace("YYY", data[i].bis);
                if(data[i].pause == 1)
                {
                    zeile = zeile.replace("WWW", data[i].titel);
                    zeile = zeile.replace("ZZZ", "");
                }
                else
                {
                    zeile = zeile.replace("WWW", data[i].person + " - ");
                    zeile = zeile.replace("ZZZ", data[i].titel);
                }

                zeile = zeile.replace("AAA", data[i].hintergrund);
                htmlcode = htmlcode + zeile;
                counter = counter + 1;
            }
            $('#programmuebersicht').html(htmlcode);
        }
    });

}
