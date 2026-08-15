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
// Se estiver expirado, o auth.js
// tenta renovar automaticamente.
//
// Se a API responder 401, tentamos
// renovar uma vez e repetir a requisição.
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
    // FUNÇÃO INTERNA PARA REQUISIÇÃO
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
    // SESSÃO REALMENTE EXPIRADA
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
// TOCANDO AGORA
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
