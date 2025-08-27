import { useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { GET_LOGEMENTS } from "../src/graphql/logements";

export default function useLogements() {
  const [pageLogs, setPageLogs] = useState(1);
  const [fetchLogs, logsState] = useLazyQuery(GET_LOGEMENTS);

  const goPageLogs = (p: number) => {
    setPageLogs(p);
    fetchLogs({
      variables: {
        filtres: {
          ville: "Paris",
          dateArrivee: "2025-10-23",
          dateDepart: "2025-10-27",
          voyageurs: 2,
          page: p,
          taillePage: 6,
          tri: "PRIX_ASC",
        },
      },
    });
  };

  useEffect(() => {
    goPageLogs(1);
  }, []);

  return { logsState, pageLogs, goPageLogs };
}
