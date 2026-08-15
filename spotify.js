const SPOTIFY_API =
    "https://api.spotify.com/v1";


async function spotifyFetch(endpoint) {

    const token =
        getAccessToken();


    if (!token) {

        throw new Error(
            "Usuário não autenticado."
        );
    }


    const response =
        await fetch(
            SPOTIFY_API + endpoint,
            {

                headers: {
                    Authorization:
                        `Bearer ${token}`
                }

            }
        );


    if (response.status === 401) {

        logout();

        throw new Error(
            "Sessão expirada."
        );
    }


    if (!response.ok) {

        throw new Error(
            `Spotify API error: ${response.status}`
        );
    }


    return await response.json();
}


/* ==============================
   PERFIL
============================== */

async function getProfile() {

    return await spotifyFetch(
        "/me"
    );
}


/* ==============================
   RECENTEMENTE OUVIDAS
============================== */

async function getRecentlyPlayed() {

    return await spotifyFetch(
        "/me/player/recently-played?limit=50"
    );
}