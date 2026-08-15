// ==========================================
// SPOTDAY - SPOTIFY API
// ==========================================


const SPOTIFY_API =
    "https://api.spotify.com/v1";


// ==========================================
// FETCH AUTENTICADO
// ==========================================
//
// Obtém um access token válido.
//
// Se estiver expirado:
// auth.js tenta renovar.
//
// Se a API responder 401:
// tentamos renovar UMA vez.
//
// ==========================================

async function spotifyFetch(
    endpoint,
    options = {}
) {

    let token =
        await getValidAccessToken();


    // ======================================
    // NÃO AUTENTICADO
    // ======================================

    if (!token) {

        throw new Error(
            "Usuário não autenticado."
        );

    }


    // ======================================
    // FUNÇÃO DE REQUISIÇÃO
    // ======================================

    async function makeRequest(
        accessToken
    ) {

        return await fetch(
            SPOTIFY_API + endpoint,
            {

                ...options,

                headers: {

                    ...(options.headers || {}),

                    Authorization:
                        `Bearer ${accessToken}`

                }

            }
        );

    }


    // ======================================
    // PRIMEIRA REQUISIÇÃO
    // ======================================

    let response =
        await makeRequest(
            token
        );


    // ======================================
    // TOKEN REJEITADO
    // ======================================

    if (
        response.status === 401
    ) {

        console.warn(
            "Access token rejeitado. Tentando renovar..."
        );


        const refreshed =
            await refreshAccessToken();


        if (
            refreshed
        ) {

            token =
                await getValidAccessToken();


            if (
                token
            ) {

                response =
                    await makeRequest(
                        token
                    );

            }

        }

    }


    // ======================================
    // SESSÃO EXPIRADA
    // ======================================

    if (
        response.status === 401
    ) {

        clearAuthData();


        throw new Error(
            "Sessão do Spotify expirada. Faça login novamente."
        );

    }


    // ======================================
    // OUTROS ERROS
    // ======================================

    if (
        !response.ok
    ) {

        throw new Error(
            `Spotify API error: ${response.status}`
        );

    }


    // ======================================
    // RESPOSTA
    // ======================================

    return await response.json();

}


// ==========================================
// PERFIL
// ==========================================

async function getProfile() {

    return await spotifyFetch(
        "/me"
    );

}


// ==========================================
// RECENTEMENTE OUVIDAS
// ==========================================

async function getRecentlyPlayed() {

    return await spotifyFetch(
        "/me/player/recently-played?limit=50"
    );

}


// ==========================================
// 🎁 CÁPSULA DO TEMPO
// ==========================================
//
// Busca as músicas ouvidas dentro de um
// período de 7 até 15 dias.
//
// Exemplo:
//
// getCapsuleData(7)
// getCapsuleData(15)
//
// Retorna:
//
// {
//     days,
//     tracks,
//     artists,
//     totalMinutes,
//     totalPlays,
//     topTrack,
//     topArtist
// }
//
// ==========================================

async function getCapsuleData(
    days = 7
) {

    // ======================================
    // LIMITAR PERÍODO
    // ======================================

    days =
        Math.max(
            7,
            Math.min(
                15,
                Number(days) || 7
            )
        );


    // ======================================
    // DATA LIMITE
    // ======================================

    const now =
        Date.now();


    const since =
        now -
        (
            days *
            24 *
            60 *
            60 *
            1000
        );


    // ======================================
    // BUSCAR HISTÓRICO
    // ======================================
    //
    // A API retorna no máximo 50 por página.
    //
    // Vamos continuar buscando páginas
    // enquanto existirem músicas dentro
    // do período escolhido.
    //
    // ======================================

    let allTracks = [];

    let before = null;

    let safety = 0;


    while (
        safety < 10
    ) {

        safety++;


        let endpoint =
            "/me/player/recently-played?limit=50";


        // ==================================
        // PAGINAÇÃO
        // ==================================

        if (
            before
        ) {

            endpoint +=
                `&before=${before}`;

        }


        const data =
            await spotifyFetch(
                endpoint
            );


        const items =
            data.items || [];


        if (
            !items.length
        ) {

            break;

        }


        // ==================================
        // ADICIONAR SOMENTE O PERÍODO
        // ==================================

        let reachedLimit =
            false;


        for (
            const item of items
        ) {

            const playedAt =
                new Date(
                    item.played_at
                ).getTime();


            if (
                playedAt >= since
            ) {

                allTracks.push(
                    item
                );

            } else {

                reachedLimit =
                    true;

                break;

            }

        }


        // ==================================
        // CHEGAMOS ANTES DO PERÍODO
        // ==================================

        if (
            reachedLimit
        ) {

            break;

        }


        // ==================================
        // PRÓXIMA PÁGINA
        // ==================================

        const lastItem =
            items[
                items.length - 1
            ];


        if (
            !lastItem ||
            !lastItem.played_at
        ) {

            break;

        }


        const nextBefore =
            new Date(
                lastItem.played_at
            ).getTime();


        // Evitar loop infinito

        if (
            before &&
            nextBefore >= before
        ) {

            break;

        }


        before =
            nextBefore;

    }


    // ======================================
    // ORGANIZAR MÚSICAS
    // ======================================

    const trackMap =
        new Map();


    const artistMap =
        new Map();


    let totalMinutes =
        0;


    allTracks.forEach(
        item => {

            const track =
                item.track;


            if (
                !track
            ) {

                return;

            }


            // ==============================
            // MÚSICA
            // ==============================

            const trackId =
                track.id;


            if (
                !trackMap.has(
                    trackId
                )
            ) {

                trackMap.set(
                    trackId,
                    {

                        id:
                            track.id,

                        name:
                            track.name,

                        artist:
                            track.artists
                                ?.map(
                                    artist =>
                                        artist.name
                                )
                                .join(", ")
                            || "Artista desconhecido",

                        artistId:
                            track.artists
                                ?. [0]
                                ?.id
                            || null,

                        image:
                            track.album
                                ?.images
                                ?. [0]
                                ?.url
                            || "",

                        album:
                            track.album
                                ?.name
                            || "",

                        plays:
                            0,

                        duration_ms:
                            track.duration_ms
                            || 0

                    }
                );

            }


            const trackData =
                trackMap.get(
                    trackId
                );


            trackData.plays++;


            // ==============================
            // ARTISTAS
            // ==============================

            track.artists
                ?.forEach(
                    artist => {

                        if (
                            !artist.id
                        ) {

                            return;

                        }


                        if (
                            !artistMap.has(
                                artist.id
                            )
                        ) {

                            artistMap.set(
                                artist.id,
                                {

                                    id:
                                        artist.id,

                                    name:
                                        artist.name,

                                    image:
                                        "",

                                    plays:
                                        0

                                }
                            );

                        }


                        const artistData =
                            artistMap.get(
                                artist.id
                            );


                        artistData.plays++;

                    }
                );


            // ==============================
            // MINUTOS
            // ==============================

            totalMinutes +=
                (
                    track.duration_ms
                    || 0
                ) / 60000;

        }
    );


    // ======================================
    // TRANSFORMAR EM ARRAYS
    // ======================================

    const tracks =
        Array.from(
            trackMap.values()
        )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.plays -
                    a.plays
            );


    const artists =
        Array.from(
            artistMap.values()
        )
            .sort(
                (
                    a,
                    b
                ) =>
                    b.plays -
                    a.plays
            );


    // ======================================
    // MAIS OUVIDOS
    // ======================================

    const topTrack =
        tracks[0]
        || null;


    const topArtist =
        artists[0]
        || null;


    // ======================================
    // RESULTADO
    // ======================================

    return {

        days:

            days,


        from:

            new Date(
                since
            ),


        to:

            new Date(
                now
            ),


        tracks:

            tracks,


        artists:

            artists,


        totalTracks:

            allTracks.length,


        totalMinutes:

            Math.round(
                totalMinutes
            ),


        topTrack:

            topTrack,


        topArtist:

            topArtist

    };

}


// ==========================================
// 🎵 TOCANDO AGORA
// ==========================================

async function getCurrentlyPlaying() {

    let token =
        await getValidAccessToken();


    // ======================================
    // NÃO AUTENTICADO
    // ======================================

    if (!token) {

        throw new Error(
            "Usuário não autenticado."
        );

    }


    // ======================================
    // PRIMEIRA REQUISIÇÃO
    // ======================================

    let response =
        await fetch(
            `${SPOTIFY_API}/me/player/currently-playing`,
            {

                headers: {

                    Authorization:
                        `Bearer ${token}`

                }

            }
        );


    // ======================================
    // NADA TOCANDO
    // ======================================

    if (
        response.status === 204
    ) {

        return null;

    }


    // ======================================
    // TOKEN REJEITADO
    // ======================================

    if (
        response.status === 401
    ) {

        console.warn(
            "Token rejeitado no Now Playing. Tentando renovar..."
        );


        const refreshed =
            await refreshAccessToken();


        if (
            refreshed
        ) {

            token =
                await getValidAccessToken();


            if (
                token
            ) {

                response =
                    await fetch(
                        `${SPOTIFY_API}/me/player/currently-playing`,
                        {

                            headers: {

                                Authorization:
                                    `Bearer ${token}`

                            }

                        }
                    );

            }

        }

    }


    // ======================================
    // NADA TOCANDO APÓS RENOVAÇÃO
    // ======================================

    if (
        response.status === 204
    ) {

        return null;

    }


    // ======================================
    // SESSÃO EXPIRADA
    // ======================================

    if (
        response.status === 401
    ) {

        clearAuthData();


        throw new Error(
            "Sessão do Spotify expirada. Faça login novamente."
        );

    }


    // ======================================
    // OUTROS ERROS
    // ======================================

    if (
        !response.ok
    ) {

        throw new Error(
            `Spotify API error: ${response.status}`
        );

    }


    // ======================================
    // JSON
    // ======================================

    return await response.json();

}
