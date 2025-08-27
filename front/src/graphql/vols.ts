import { gql } from "@apollo/client";

export const GET_VOLS = gql`
  query Vols($filtres: FiltresVol!) {
    vols(filtres: $filtres) {
      total
      page
      aSuivant
      elements {
        id
        depart
        destination
        date
        compagnie
        prix
      }
    }
  }
`;
