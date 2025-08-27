// src/apollo.ts
import { ApolloClient, InMemoryCache, ApolloLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { createUploadLink } from "apollo-upload-client";

// 1) Link d'auth: ajoute le header Authorization à chaque requête
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem("access"); // <- tu y stockes le token après login
  if (token) {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        // Si tu as configuré Django pour "Bearer", garde Bearer. Sinon remplace par "JWT".
        Authorization: `Bearer ${token}`,
      },
    }));
  }
  return forward(operation);
});

// 2) Link d'upload (gère aussi les requêtes "normales")
const uploadLink = createUploadLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || "http://127.0.0.1:4000/graphql/",
  // credentials: "include", // <- uniquement si tu utilises des cookies/session
}) as unknown as ApolloLink;

// 3) Gestion d’erreurs basique
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      console.error("[GraphQLError]", err.message, err.extensions);
      if (err.extensions?.code === "UNAUTHENTICATED") {
        // ici tu peux déclencher un refresh token ou rediriger vers /login
      }
    }
  }
  if (networkError) console.error("[NetworkError]", networkError);
});

// 4) Client Apollo
export const client = new ApolloClient({
  link: from([errorLink, authLink, uploadLink]),
  cache: new InMemoryCache(),
});
