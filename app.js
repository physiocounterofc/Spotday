// ==========================================
// SPOTDAY - APLICAÇÃO PRINCIPAL
// ==========================================


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


        // ==================================
        // BOTÕES
        // ==================================

        if (loginButton) {

            loginButton.addEventListener(
                "click",
                loginWithSpotify
            );

        }


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                logout
            );

        }


        // ==================================
        // AUTENTICAÇÃO
        // ==================================

        try {

            const callbackHandled =
                await handleCallback();


            if (
                callbackHandled ||
                getAccessToken()
            ) {

                showDashboard();

                await loadDashboard();

                // ==================================
                // 🎵 INICIAR TOCANDO AGORA
                // ==================================

                startNowPlaying();

            }

        } catch (error) {

            console.error(
                "Erro no Spotday:",
                error
            );

        }

    }
);


// ==========================================
// TELAS
// ==========================================

function showDashboard() {

    const loginScreen =
        document.getElementById(
            "login-screen"
        );


    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (loginScreen) {

        loginScreen.classList.add(
            "hidden"
        );

    }


    if (dashboard) {

        dashboard.classList.remove(
            "hidden"
        );

    }

}


// ==========================================
// DASHBOARD
// ==========================================

async function loadDashboard() {

    try {

        const data =
            await getRecentlyPlayed();


        const tracks =
            data.items || [];


        const today =
            getTodayTracks(
                tracks
            );


        updateStatistics(
            today
        );


        updateTopTrack(
            today
        );


        updateHistory(
            today
        );

    } catch (error) {

        console.error(
            "Erro ao carregar dashboard:",
            error
        );

    }

}


// ==========================================
// PEGAR MÚSICAS DE HOJE
// ==========================================

function getTodayTracks(
    tracks
) {

    const now =
        new Date();


    return tracks.filter(
        item => {

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

        }
    );

}


// ==========================================
// ESTATÍSTICAS
// ==========================================

function updateStatistics(
    tracks
) {

    const tracksCount =
        tracks.length;


    const artists =
        new Set(
            tracks
                .map(
                    item =>
                        item.track
                            ?.artists?.[0]
                            ?.id
                )
                .filter(Boolean)
        );


    const minutes =
        tracks.reduce(
            (
                total,
                item
            ) => {

                return total +
                    (
                        item.track
                            ?.duration_ms
                        || 0
                    );

            },
            0
        ) / 60000;


    const tracksElement =
        document.getElementById(
            "tracks-count"
        );


    const artistsElement =
        document.getElementById(
            "artists-count"
        );


    const minutesElement =
        document.getElementById(
            "minutes-count"
        );


    if (tracksElement) {

        tracksElement.textContent =
            tracksCount;

    }


    if (artistsElement) {

        artistsElement.textContent =
            artists.size;

    }


    if (minutesElement) {

        minutesElement.textContent =
            Math.round(
                minutes
            );

    }

}


// ==========================================
// MAIS OUVIDA
// ==========================================

function updateTopTrack(
    tracks
) {

    if (!tracks.length) {

        const name =
            document.getElementById(
                "top-track-name"
            );


        const artist =
            document.getElementById(
                "top-track-artist"
            );


        const count =
            document.getElementById(
                "top-track-count"
            );


        if (name) {

            name.textContent =
                "Nenhuma música";

        }


        if (artist) {

            artist.textContent =
                "—";

        }


        if (count) {

            count.textContent =
                "0 reproduções";

        }


        return;
    }


    const count = {};


    tracks.forEach(
        item => {

            const track =
                item.track;


            if (!track) {
                return;
            }


            const id =
                track.id;


            if (!count[id]) {

                count[id] = {

                    track:
                        track,

                    plays:
                        0

                };

            }


            count[id].plays++;

        }
    );


    const top =
        Object.values(
            count
        )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.plays -
                    a.plays
            )[0];


    if (!top) {
        return;
    }


    const track =
        top.track;


    const image =
        document.getElementById(
            "top-track-image"
        );


    const name =
        document.getElementById(
            "top-track-name"
        );


    const artist =
        document.getElementById(
            "top-track-artist"
        );


    const plays =
        document.getElementById(
            "top-track-count"
        );


    if (image) {

        image.src =
            track.album
                ?.images?.[0]
                ?.url
            || "";

    }


    if (name) {

        name.textContent =
            track.name;

    }


    if (artist) {

        artist.textContent =
            track.artists
                ?.map(
                    artist =>
                        artist.name
                )
                .join(", ")
            || "—";

    }


    if (plays) {

        plays.textContent =
            `${top.plays} ${
                top.plays === 1
                    ? "reprodução"
                    : "reproduções"
            }`;

    }

}


// ==========================================
// HISTÓRICO
// ==========================================

function updateHistory(
    tracks
) {

    const container =
        document.getElementById(
            "history-list"
        );


    const count =
        document.getElementById(
            "history-count"
        );


    if (!container) {
        return;
    }


    if (count) {

        count.textContent =
            tracks.length;

    }


    container.innerHTML =
        "";


    tracks.forEach(
        item => {

            const track =
                item.track;


            if (!track) {
                return;
            }


            const date =
                new Date(
                    item.played_at
                );


            const time =
                date.toLocaleTimeString(
                    "pt-BR",
                    {
                        hour:
                            "2-digit",

                        minute:
                            "2-digit"
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
                        track.album
                            ?.images?.[2]
                            ?.url

                        ||

                        track.album
                            ?.images?.[0]
                            ?.url

                        ||

                        ""
                    }"
                    alt=""
                >

                <div class="history-info">

                    <strong>
                        ${escapeHTML(
                            track.name
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            track.artists
                                ?.map(
                                    artist =>
                                        artist.name
                                )
                                .join(", ")
                            || ""
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

        }
    );

}


// ==========================================
// SEGURANÇA
// ==========================================

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


// ==========================================
// SERVICE WORKER
// ==========================================

if (
    "serviceWorker"
    in navigator
) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker.register(
                "./sw.js"
            )
                .catch(
                    error => {

                        console.error(
                            "Erro no Service Worker:",
                            error
                        );

                    }
                );

        }
    );

}


// ==========================================
// 🎵 NOW PLAYING
// ==========================================

let nowPlayingTimer =
    null;


let currentTrackId =
    null;


let currentProgress =
    0;


let currentDuration =
    0;


// ==========================================
// ATUALIZAR MÚSICA ATUAL
// ==========================================

async function updateNowPlaying() {

    try {

        const data =
            await getCurrentlyPlaying();


        const image =
            document.getElementById(
                "now-playing-image"
            );


        const name =
            document.getElementById(
                "now-playing-name"
            );


        const artist =
            document.getElementById(
                "now-playing-artist"
            );


        const status =
            document.getElementById(
                "playing-status"
            );


        const progress =
            document.getElementById(
                "now-playing-progress"
            );


        const currentTime =
            document.getElementById(
                "current-time"
            );


        const totalTime =
            document.getElementById(
                "total-time"
            );


        // ==================================
        // ELEMENTOS NÃO EXISTEM
        // ==================================

        if (
            !image ||
            !name ||
            !artist ||
            !status ||
            !progress ||
            !currentTime ||
            !totalTime
        ) {

            console.error(
                "Elementos do Now Playing não encontrados."
            );

            return;

        }


        // ==================================
        // NADA TOCANDO
        // ==================================

        if (
            !data ||
            !data.item
        ) {

            name.textContent =
                "Nada tocando";


            artist.textContent =
                "Abra o Spotify para começar";


            status.textContent =
                "● PARADO";


            status.style.color =
                "#888";


            progress.style.width =
                "0%";


            currentTime.textContent =
                "0:00";


            totalTime.textContent =
                "0:00";

            
            image.src =
    "assets/icon-512.png";


            currentTrackId =
                null;


            currentProgress =
                0;


            currentDuration =
                0;


            return;

        }


        // ==================================
        // VERIFICAR SE É UMA MÚSICA
        // ==================================

        const track =
            data.item;


        if (
            track.type !== "track"
        ) {

            name.textContent =
                "Conteúdo não suportado";


            artist.textContent =
                "O Spotify não informou uma música";


            return;

        }


        // ==================================
        // DADOS DA MÚSICA
        // ==================================

        currentTrackId =
            track.id;


        currentProgress =
            data.progress_ms
            || 0;


        currentDuration =
            track.duration_ms
            || 0;


        name.textContent =
            track.name;


        artist.textContent =
            track.artists
                ?.map(
                    artist =>
                        artist.name
                )
                .join(", ")
            || "Artista desconhecido";


        image.src =
            track.album
                ?.images?.[0]
                ?.url
            || "";


        // ==================================
        // STATUS
        // ==================================

        if (
            data.is_playing
        ) {

            status.textContent =
                "● TOCANDO";


            status.style.color =
                "#1ed760";

        } else {

            status.textContent =
                "Ⅱ PAUSADO";


            status.style.color =
                "#aaaaaa";

        }


        // ==================================
        // PROGRESSO
        // ==================================

        updateProgressBar();


    } catch (error) {

        console.error(
            "Erro no currently playing:",
            error
        );

    }

}


// ==========================================
// BARRA DE PROGRESSO
// ==========================================

function updateProgressBar() {

    const progress =
        document.getElementById(
            "now-playing-progress"
        );


    const currentTime =
        document.getElementById(
            "current-time"
        );


    const totalTime =
        document.getElementById(
            "total-time"
        );


    if (
        !progress ||
        !currentTime ||
        !totalTime
    ) {

        return;

    }


    if (
        !currentDuration ||
        currentDuration <= 0
    ) {

        progress.style.width =
            "0%";


        currentTime.textContent =
            "0:00";


        totalTime.textContent =
            "0:00";


        return;

    }


    const percentage =
        (
            currentProgress /
            currentDuration
        ) * 100;


    progress.style.width =
        `${Math.min(
            Math.max(
                percentage,
                0
            ),
            100
        )}%`;


    currentTime.textContent =
        formatTime(
            currentProgress
        );


    totalTime.textContent =
        formatTime(
            currentDuration
        );

}


// ==========================================
// FORMATAR TEMPO
// ==========================================

function formatTime(
    milliseconds
) {

    const seconds =
        Math.floor(
            milliseconds / 1000
        );


    const minutes =
        Math.floor(
            seconds / 60
        );


    const remainingSeconds =
        seconds % 60;


    return `${minutes}:${String(
        remainingSeconds
    ).padStart(
        2,
        "0"
    )}`;

}


// ==========================================
// ATUALIZAÇÃO AUTOMÁTICA
// ==========================================

function startNowPlaying() {

    // Fazer uma consulta imediatamente

    updateNowPlaying();


    // Evitar múltiplos timers

    if (
        nowPlayingTimer
    ) {

        clearInterval(
            nowPlayingTimer
        );

    }


    // Atualizar a cada 5 segundos

    nowPlayingTimer =
        setInterval(
            updateNowPlaying,
            5000
        );

}

const capsuleButton =
    document.getElementById(
        "capsule-button"
    );

if (capsuleButton) {

    capsuleButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "./capsula/";

        }
    );

}
