import { useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_VOLS } from "../src/graphql/vols";

export default function useVols() {
  const [pageVols, setPageVols] = useState(1);
  const [fetchVols, volsState] = useLazyQuery(GET_VOLS);

  const goPageVols = (p: number) => {
    setPageVols(p);
    fetchVols({
      variables: {
        filtres: {
          origine: "YUL",
          destination: "CDG",
          date: "2025-10-23",
          voyageurs: 1,
          page: p,
          taillePage: 6,
          tri: "PRIX_ASC",
        },
      },
    });
  };

  useEffect(() => {
    goPageVols(1);
  }, []);

  return { volsState, pageVols, goPageVols };
}
