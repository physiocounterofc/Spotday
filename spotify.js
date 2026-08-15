// ==========================================
// SPOTDAY - SPOTIFY API
// ==========================================

const SPOTIFY_API =
    "https://api.spotify.com/v1";


// ==========================================
// FETCH AUTENTICADO
// ==========================================
//
// Sempre tenta obter um access token válido
// antes de fazer uma requisição.
//
// Se o token estiver expirado, o auth.js
// automaticamente usa o refresh_token.
// ==========================================

async function spotifyFetch(
    endpoint,
    options = {}
) {

    let token =
        await getValidAccessToken();


    // ======================================
    // USUÁRIO NÃO AUTENTICADO
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
            SPOTIFY_API + endpoint,
            {

                ...options,

                headers: {

                    ...(options.headers || {}),

                    Authorization:
                        `Bearer ${token}`

                }

            }
        );


    // ======================================
    // TOKEN INVÁLIDO
    // ======================================
    //
    // Isso pode acontecer se o token for
    // revogado ou expirar entre a verificação
    // e a requisição.
    //
    // Tentamos renovar UMA vez.
    // ======================================

    if (
        response.status === 401
    ) {

        console.warn(
            "Access token rejeitado. Tentando renovar..."
        );


        const refreshToken =
            localStorage.getItem(
                "spotday_refresh_token"
            );


        if (
            refreshToken
        ) {

            const refreshed =
                await refreshAccessToken(
                    refreshToken
                );


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
                            SPOTIFY_API + endpoint,
                            {

                                ...options,

                                headers: {

                                    ...(options.headers || {}),

                                    Authorization:
                                        `Bearer ${token}`

                                }

                            }
                        );

                }

            }

        }

    }


    // ======================================
    // AINDA NÃO AUTORIZADO
    // ======================================

    if (
        response.status === 401
    ) {

        /*
         * Só chegamos aqui se:
         *
         * 1. O access token foi rejeitado
         * 2. Tentamos refresh
         * 3. O refresh não funcionou
         *
         * Nesse caso a sessão realmente
         * pode ter expirado/revogado.
         */

        clearTokens();


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
// TOCANDO AGORA
// ==========================================

async function getCurrentlyPlaying() {

    let token =
        await getValidAccessToken();


    if (!token) {

        throw new Error(
            "Usuário não autenticado."
        );

    }


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
    // TOKEN INVÁLIDO
    // ======================================

    if (
        response.status === 401
    ) {

        console.warn(
            "Token rejeitado no Now Playing. Renovando..."
        );


        const refreshToken =
            localStorage.getItem(
                "spotday_refresh_token"
            );


        if (
            refreshToken
        ) {

            const refreshed =
                await refreshAccessToken(
                    refreshToken
                );


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

    }


    // ======================================
    // AINDA 401
    // ======================================

    if (
        response.status === 401
    ) {

        clearTokens();


        throw new Error(
            "Sessão do Spotify expirada."
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
