import { gql } from "@apollo/client";

export const GET_LOGEMENTS = gql`
  query Logements($filtres: FiltresLogement!) {
    logements(filtres: $filtres) {
      total
      page
      taillePage
      aSuivant
      elements {
        id
        titre
        ville
        prixParNuit
        note
        capacite
        chambres
        commodites
        photos { url }
      }
    }
  }
`;
