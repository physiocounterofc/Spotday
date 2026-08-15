document.addEventListener(
    "DOMContentLoaded",
    async () => {

        const loginButton =
            document.getElementById(
                "login-button"
            );


        const logoutButton =
            document.getElementById(
                "logout-button"
            );


        loginButton.addEventListener(
            "click",
            loginWithSpotify
        );


        logoutButton.addEventListener(
            "click",
            logout
        );


        try {

            const callbackHandled =
                await handleCallback();


            if (
                callbackHandled ||
                getAccessToken()
            ) {

                showDashboard();

                await loadDashboard();

            }

        } catch (error) {

            console.error(
                "Erro no Spotday:",
                error
            );

        }

    }
);


/* ==============================
   TELAS
============================== */

function showDashboard() {

    document
        .getElementById("login-screen")
        .classList.add("hidden");


    document
        .getElementById("dashboard")
        .classList.remove("hidden");
}


/* ==============================
   DASHBOARD
============================== */

async function loadDashboard() {

    const data =
        await getRecentlyPlayed();


    const tracks =
        data.items || [];


    const today =
        getTodayTracks(tracks);


    updateStatistics(today);

    updateTopTrack(today);

    updateHistory(today);
}


/* ==============================
   PEGAR MÚSICAS DE HOJE
============================== */

function getTodayTracks(tracks) {

    const now =
        new Date();


    return tracks.filter(item => {

        const playedAt =
            new Date(
                item.played_at
            );


        return (
            playedAt.getFullYear()
            === now.getFullYear()

            &&

            playedAt.getMonth()
            === now.getMonth()

            &&

            playedAt.getDate()
            === now.getDate()
        );

    });
}


/* ==============================
   ESTATÍSTICAS
============================== */

function updateStatistics(tracks) {

    const tracksCount =
        tracks.length;


    const artists =
        new Set(
            tracks.map(
                item =>
                    item.track.artists[0]?.id
            )
        );


    const minutes =
        tracks.reduce(
            (total, item) => {

                return total +
                    (
                        item.track.duration_ms
                        || 0
                    );

            },
            0
        ) / 60000;


    document.getElementById(
        "tracks-count"
    ).textContent =
        tracksCount;


    document.getElementById(
        "artists-count"
    ).textContent =
        artists.size;


    document.getElementById(
        "minutes-count"
    ).textContent =
        Math.round(minutes);
}


/* ==============================
   MAIS OUVIDA
============================== */

function updateTopTrack(tracks) {

    if (!tracks.length) {

        return;
    }


    const count = {};


    tracks.forEach(item => {

        const track =
            item.track;


        const id =
            track.id;


        if (!count[id]) {

            count[id] = {
                track: track,
                plays: 0
            };

        }


        count[id].plays++;

    });


    const top =
        Object.values(count)
            .sort(
                (a, b) =>
                    b.plays - a.plays
            )[0];


    const track =
        top.track;


    document.getElementById(
        "top-track-image"
    ).src =
        track.album.images[0]?.url || "";


    document.getElementById(
        "top-track-name"
    ).textContent =
        track.name;


    document.getElementById(
        "top-track-artist"
    ).textContent =
        track.artists
            .map(
                artist =>
                    artist.name
            )
            .join(", ");


    document.getElementById(
        "top-track-count"
    ).textContent =
        `${top.plays} ${
            top.plays === 1
                ? "reprodução"
                : "reproduções"
        }`;
}


/* ==============================
   HISTÓRICO
============================== */

function updateHistory(tracks) {

    const container =
        document.getElementById(
            "history-list"
        );


    const count =
        document.getElementById(
            "history-count"
        );


    count.textContent =
        tracks.length;


    container.innerHTML = "";


    tracks.forEach(item => {

        const track =
            item.track;


        const date =
            new Date(
                item.played_at
            );


        const time =
            date.toLocaleTimeString(
                "pt-BR",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );


        const element =
            document.createElement(
                "div"
            );


        element.className =
            "history-item";


        element.innerHTML = `

            <img
                src="${
                    track.album.images[2]?.url
                    ||
                    track.album.images[0]?.url
                    ||
                    ""
                }"
                alt=""
            >

            <div class="history-info">

                <strong>
                    ${escapeHTML(track.name)}
                </strong>

                <span>
                    ${escapeHTML(
                        track.artists
                            .map(
                                artist =>
                                    artist.name
                            )
                            .join(", ")
                    )}
                </span>

            </div>

            <time>
                ${time}
            </time>

        `;


        container.appendChild(
            element
        );

    });
}


/* ==============================
   SEGURANÇA
============================== */

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;
}

if ("serviceWorker" in navigator) {
    
    window.addEventListener(
        "load",
        () => {
            
            navigator.serviceWorker.register(
                "./sw.js"
            );
            
        }
    );
    
}